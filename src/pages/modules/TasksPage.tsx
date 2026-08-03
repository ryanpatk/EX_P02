import { useCallback, useEffect, useMemo, useState } from 'react';
import AppHeader from '../../components/AppHeader';
import ProfileFilterBar from '../../components/ProfileFilterBar';
import TagFilterBar from '../../components/TagFilterBar';
import TaskGridCard from '../../components/TaskGridCard';
import TaskListRow from '../../components/TaskListRow';
import { EmptyState, FeedbackToast, FrostedStack, Omnibar, ViewToggleFab } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { useFeedbackToast } from '../../hooks/useFeedbackToast';
import { useViewMode } from '../../hooks/useViewMode';
import { useProfiles } from '../../hooks/useProfiles';
import { useTags } from '../../hooks/useTags';
import {
  useAllTasks,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '../../hooks/useTasks';
import { useSetTaskTags } from '../../hooks/useTaskTags';
import {
  useAddTasksToProfile,
  useProfileTaskMembership,
} from '../../hooks/useProfileTasks';
import { Tag, TaskWithTags } from '../../types/database';

type MobileRail = 'none' | 'tags' | 'profiles';

type PendingTaskAdd = {
  title: string;
  profileId: string | null;
  tagIds: string[];
};

const TasksPage = () => {
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [viewMode, setViewMode] = useViewMode('tasks');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [pendingAdd, setPendingAdd] = useState<PendingTaskAdd | null>(null);
  const [mobileRail, setMobileRail] = useState<MobileRail>('none');
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 899px)').matches,
  );

  const { data: allTasks } = useAllTasks();
  const { data: profiles } = useProfiles();
  const { data: tags } = useTags();
  const { data: membershipRows } = useProfileTaskMembership();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const setTaskTags = useSetTaskTags();
  const addTasksToProfile = useAddTasksToProfile();
  const { toast, flash, handleAnimationEnd } = useFeedbackToast();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 899px)');
    const onChange = () => setIsNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isNarrow) {
      setMobileRail('none');
    }
  }, [isNarrow]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.classList.add('dashboard-scroll-lock');
    body.classList.add('dashboard-scroll-lock');
    root?.classList.add('dashboard-scroll-lock');

    return () => {
      html.classList.remove('dashboard-scroll-lock');
      body.classList.remove('dashboard-scroll-lock');
      root?.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  useEffect(() => {
    if (
      selectedProfileId &&
      !(profiles ?? []).some((p) => p.id === selectedProfileId)
    ) {
      setSelectedProfileId(null);
    }
  }, [profiles, selectedProfileId]);

  const tasksWithTags = useMemo(
    () =>
      (allTasks ?? []).map((task) => {
        const tagMap = new Map<string, Tag>();
        (task.task_tags ?? []).forEach((taskTag) => {
          if (taskTag.tag) {
            tagMap.set(taskTag.tag.id, taskTag.tag);
          }
        });
        (task.tags ?? []).forEach((tag) => tagMap.set(tag.id, tag));
        return { ...task, tags: Array.from(tagMap.values()) } as TaskWithTags;
      }),
    [allTasks],
  );

  const profileTaskSets = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of membershipRows ?? []) {
      if (!map.has(row.profile_id)) {
        map.set(row.profile_id, new Set());
      }
      map.get(row.profile_id)!.add(row.task_id);
    }
    return map;
  }, [membershipRows]);

  const profileCountsForBar = useMemo(() => {
    const counts: Record<string, number> = {};
    (profiles ?? []).forEach((p) => {
      counts[p.id] = profileTaskSets.get(p.id)?.size ?? 0;
    });
    return counts;
  }, [profiles, profileTaskSets]);

  useEffect(() => {
    setSelectedTaskIds([]);
    setSelectionMode(false);
  }, [searchQuery, selectedTagIds, includeUntagged, selectedProfileId]);

  const bulkAssignActive = selectionMode && selectedTaskIds.length > 0;

  const toggleTaskSelection = useCallback((taskId: string) => {
    if (taskId.startsWith('temp-')) return;
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }, []);

  const handleAddSelectedToSpace = useCallback(
    async (profileId: string) => {
      if (selectedTaskIds.length === 0) return;
      const profile = (profiles ?? []).find((p) => p.id === profileId);
      const inSpace = profileTaskSets.get(profileId) ?? new Set<string>();
      const newlyAdded = selectedTaskIds.filter((id) => !inSpace.has(id));
      const name = profile?.name ?? 'space';
      let message: string;
      if (newlyAdded.length === 0) {
        message = `Selection was already in “${name}”.`;
      } else if (newlyAdded.length === selectedTaskIds.length) {
        message = `Added ${newlyAdded.length} task${newlyAdded.length === 1 ? '' : 's'} to “${name}”.`;
      } else {
        message = `Added ${newlyAdded.length} task${newlyAdded.length === 1 ? '' : 's'} to “${name}” (${selectedTaskIds.length - newlyAdded.length} already there).`;
      }
      flash(message);
      try {
        await addTasksToProfile.mutateAsync({
          profileId,
          taskIds: [...selectedTaskIds],
        });
      } catch (error) {
        console.error('Failed to add tasks to space:', error);
      }
    },
    [addTasksToProfile, flash, profileTaskSets, profiles, selectedTaskIds],
  );

  const handleBulkAddTag = useCallback(
    async (tagId: string) => {
      if (selectedTaskIds.length === 0) return;
      const tag = (tags ?? []).find((t) => t.id === tagId);
      const tagName = tag?.name ?? 'tag';
      const targets = selectedTaskIds
        .map((id) => tasksWithTags.find((t) => t.id === id))
        .filter((t): t is TaskWithTags => !!t)
        .filter((t) => !(t.tags ?? []).some((existing) => existing.id === tagId));
      if (targets.length === 0) {
        flash(`Selection already had “${tagName}”.`);
        return;
      }
      flash(`Applied “${tagName}” to ${targets.length} task${targets.length === 1 ? '' : 's'}.`);
      try {
        await Promise.all(
          targets.map((task) =>
            setTaskTags.mutateAsync({
              taskId: task.id,
              tagIds: [...(task.tags ?? []).map((t) => t.id), tagId],
            }),
          ),
        );
      } catch (error) {
        console.error('Failed to bulk-apply tag:', error);
      }
    },
    [flash, selectedTaskIds, setTaskTags, tags, tasksWithTags],
  );

  const isPendingTask = useCallback(
    (task: TaskWithTags) =>
      pendingAdd !== null &&
      (task.id.startsWith('temp-') || task.title === pendingAdd.title),
    [pendingAdd],
  );

  const filterBySearch = useCallback(
    (task: TaskWithTags) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        task.title.toLowerCase().includes(query) ||
        task.detail?.toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filterByTags = useCallback(
    (task: TaskWithTags) => {
      if (selectedTagIds.length === 0 && !includeUntagged) return true;

      if (isPendingTask(task)) {
        const pendingTagIds = pendingAdd?.tagIds ?? [];
        const matchesTags = selectedTagIds.some((tagId) =>
          pendingTagIds.includes(tagId),
        );
        return matchesTags || (includeUntagged && pendingTagIds.length === 0);
      }

      const tagIds = (task.tags ?? []).map((tag) => tag.id);
      const matchesTags = selectedTagIds.some((tagId) => tagIds.includes(tagId));
      const matchesUntagged = includeUntagged && tagIds.length === 0;
      return matchesTags || matchesUntagged;
    },
    [includeUntagged, isPendingTask, pendingAdd, selectedTagIds],
  );

  const filterByProfile = useCallback(
    (task: TaskWithTags) => {
      if (!selectedProfileId) return true;
      if (isPendingTask(task)) {
        return pendingAdd?.profileId === selectedProfileId;
      }
      return profileTaskSets.get(selectedProfileId)?.has(task.id) ?? false;
    },
    [isPendingTask, pendingAdd, profileTaskSets, selectedProfileId],
  );

  const filteredTasks = useMemo(
    () =>
      tasksWithTags.filter(
        (task) =>
          filterBySearch(task) && filterByTags(task) && filterByProfile(task),
      ),
    [filterByProfile, filterBySearch, filterByTags, tasksWithTags],
  );

  const openTasks = useMemo(
    () =>
      filteredTasks
        .filter((task) => !task.is_done)
        .sort((a, b) => a.order_index - b.order_index),
    [filteredTasks],
  );

  const doneTasks = useMemo(
    () =>
      filteredTasks
        .filter((task) => task.is_done)
        .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1)),
    [filteredTasks],
  );

  const tasksForTagRail = useMemo(() => {
    if (!selectedProfileId) {
      return tasksWithTags;
    }
    const inProfile = profileTaskSets.get(selectedProfileId);
    if (!inProfile) {
      return [];
    }
    return tasksWithTags.filter((task) => inProfile.has(task.id));
  }, [profileTaskSets, selectedProfileId, tasksWithTags]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasksForTagRail.forEach((task) => {
      (task.tags ?? []).forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [tasksForTagRail]);

  const tagsForBar = useMemo(() => {
    const allTags = tags ?? [];
    if (!selectedProfileId) {
      return allTags;
    }
    return allTags.filter((tag) => (tagCounts[tag.id] ?? 0) > 0);
  }, [selectedProfileId, tagCounts, tags]);

  const untaggedCount = useMemo(
    () =>
      tasksForTagRail.filter((task) => (task.tags ?? []).length === 0).length,
    [tasksForTagRail],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTagIds.length > 0 ||
    includeUntagged ||
    selectedProfileId !== null;

  const showOmnibarAdd = searchQuery.trim().length > 0;

  const handleOmnibarAdd = useCallback(() => {
    const title = searchQuery.trim();
    if (!title || pendingAdd !== null) {
      return;
    }

    const pendingContext: PendingTaskAdd = {
      title,
      profileId: selectedProfileId,
      tagIds: [...selectedTagIds],
    };

    setPendingAdd(pendingContext);
    setSearchQuery('');

    createTask.mutate(
      { title },
      {
        onSuccess: (newTask) => {
          const postCreate: Promise<unknown>[] = [];

          if (pendingContext.profileId) {
            postCreate.push(
              addTasksToProfile.mutateAsync({
                profileId: pendingContext.profileId,
                taskIds: [newTask.id],
              }),
            );
          }

          if (pendingContext.tagIds.length > 0) {
            postCreate.push(
              setTaskTags.mutateAsync({
                taskId: newTask.id,
                tagIds: pendingContext.tagIds,
              }),
            );
          }

          if (postCreate.length === 0) {
            setPendingAdd(null);
            return;
          }

          void Promise.all(postCreate)
            .catch((error) => {
              console.error('Failed to apply task filters after create:', error);
            })
            .finally(() => {
              setPendingAdd(null);
            });
        },
        onError: () => {
          setSearchQuery(pendingContext.title);
          setPendingAdd(null);
        },
      },
    );
  }, [
    addTasksToProfile,
    createTask,
    pendingAdd,
    searchQuery,
    selectedProfileId,
    selectedTagIds,
    setTaskTags,
  ]);

  const handleToggleDone = useCallback(
    (task: TaskWithTags) => {
      if (task.id.startsWith('temp-')) return;
      updateTask.mutate({ id: task.id, updates: { is_done: !task.is_done } });
    },
    [updateTask],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      if (taskId.startsWith('temp-')) return;
      if (!window.confirm('Delete this task permanently? This cannot be undone.')) {
        return;
      }
      deleteTask.mutate(taskId);
    },
    [deleteTask],
  );

  const handleToggleTag = (tagId: string) => {
    if (bulkAssignActive) {
      void handleBulkAddTag(tagId);
      return;
    }
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleToggleProfileFilter = useCallback(
    (profileId: string) => {
      if (bulkAssignActive) {
        void handleAddSelectedToSpace(profileId);
        return;
      }
      setSelectedProfileId((prev) => (prev === profileId ? null : profileId));
    },
    [bulkAssignActive, handleAddSelectedToSpace],
  );

  const openCount = openTasks.length;
  const emptyTitle = hasActiveFilters
    ? 'No tasks match the current filters'
    : 'No tasks yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust search, tags, or space to broaden the results.'
    : 'Type above and press Enter to capture your first task.';

  return (
    <div className="bookmark-dashboard">
      <AppHeader user={session?.user ?? null} />

      <div
        className={`bookmark-feed-layout${viewMode === 'grid' ? ' is-grid-wide' : ''}`}
      >
        {isNarrow && mobileRail !== 'none' && (
          <button
            type="button"
            className="bookmark-mobile-scrim"
            aria-label="Close panel"
            onClick={() => setMobileRail('none')}
          />
        )}

        <aside
          className={`bookmark-rail bookmark-rail--profiles ${
            isNarrow && mobileRail === 'profiles' ? 'is-mobile-open' : ''
          }`}
        >
          {isNarrow && (
            <div className="bookmark-rail-mobile-header">
              <span className="bookmark-rail-mobile-title">Spaces</span>
              <button
                type="button"
                className="bookmark-rail-mobile-close"
                onClick={() => setMobileRail('none')}
              >
                Close
              </button>
            </div>
          )}
          <div className="bookmark-rail-inner bookmark-rail-inner--profiles">
            <ProfileFilterBar
              profiles={profiles ?? []}
              profileCounts={profileCountsForBar}
              selectedProfileId={selectedProfileId}
              onToggleProfile={handleToggleProfileFilter}
              bulkAssignMode={bulkAssignActive}
            />
          </div>
        </aside>

        <main className="bookmark-feed-main">
          {isNarrow && (
            <div
              className="bookmark-mobile-rail-tabs"
              role="toolbar"
              aria-label="Open side panels"
            >
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) => (r === 'profiles' ? 'none' : 'profiles'))
                }
              >
                Spaces
              </button>
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) => (r === 'tags' ? 'none' : 'tags'))
                }
              >
                Tags
              </button>
            </div>
          )}

          <div
            className={`bookmark-feed-main-inner${viewMode === 'grid' ? ' is-grid-view' : ''}`}
          >
            <FrostedStack>
              <div className="bookmark-search-panel">
                <Omnibar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Search ${openCount} open task${openCount === 1 ? '' : 's'}…`}
                  ariaLabel="Search tasks or type to capture a new one"
                  action={{
                    label: 'New task',
                    pendingLabel: 'Adding…',
                    show: showOmnibarAdd,
                    pending: pendingAdd !== null,
                    onRun: handleOmnibarAdd,
                  }}
                />
              </div>

              <div className={viewMode === 'grid' ? 'memex-grid-view' : 'memex-task-list'}>
                {openTasks.length === 0 && doneTasks.length === 0 ? (
                  <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
                ) : (
                  <>
                    {viewMode === 'grid' ? (
                      openTasks.length > 0 && (
                        <div className="memex-grid">
                          {openTasks.map((task) => (
                            <TaskGridCard
                              key={task.id}
                              task={task}
                              onToggleDone={handleToggleDone}
                              onDelete={handleDeleteTask}
                              selectionMode={selectionMode}
                              isSelected={selectedTaskIds.includes(task.id)}
                              onToggleSelect={toggleTaskSelection}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      openTasks.map((task) => (
                        <TaskListRow
                          key={task.id}
                          task={task}
                          onToggleDone={handleToggleDone}
                          onDelete={handleDeleteTask}
                          selectionMode={selectionMode}
                          isSelected={selectedTaskIds.includes(task.id)}
                          onToggleSelect={toggleTaskSelection}
                        />
                      ))
                    )}

                    {openTasks.length === 0 && (
                      <EmptyState
                        title={hasActiveFilters ? emptyTitle : 'All clear'}
                        subtitle={
                          hasActiveFilters
                            ? emptySubtitle
                            : 'Nothing open. Type above to capture the next thing.'
                        }
                      />
                    )}

                    {doneTasks.length > 0 && (
                      <div className="memex-task-done-section">
                        <button
                          type="button"
                          className="memex-task-done-toggle"
                          onClick={() => setShowDone((prev) => !prev)}
                          aria-expanded={showDone}
                        >
                          <span
                            className={`memex-task-done-caret${showDone ? ' is-open' : ''}`}
                            aria-hidden="true"
                          >
                            <svg viewBox="0 0 16 16" fill="none">
                              <path d="M6 4.5 9.5 8 6 11.5" />
                            </svg>
                          </span>
                          Done ({doneTasks.length})
                        </button>
                        {showDone &&
                          (viewMode === 'grid' ? (
                            <div className="memex-grid">
                              {doneTasks.map((task) => (
                                <TaskGridCard
                                  key={task.id}
                                  task={task}
                                  onToggleDone={handleToggleDone}
                                  onDelete={handleDeleteTask}
                                  selectionMode={selectionMode}
                                  isSelected={selectedTaskIds.includes(task.id)}
                                  onToggleSelect={toggleTaskSelection}
                                />
                              ))}
                            </div>
                          ) : (
                            doneTasks.map((task) => (
                              <TaskListRow
                                key={task.id}
                                task={task}
                                onToggleDone={handleToggleDone}
                                onDelete={handleDeleteTask}
                                selectionMode={selectionMode}
                                isSelected={selectedTaskIds.includes(task.id)}
                                onToggleSelect={toggleTaskSelection}
                              />
                            ))
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bookmark-selection-actions">
                {selectionMode ? (
                  <button
                    type="button"
                    className="bookmark-toolbar-cta is-secondary is-chip is-clear-selection"
                    onClick={() => setSelectedTaskIds([])}
                    disabled={selectedTaskIds.length === 0}
                    aria-label={
                      selectedTaskIds.length > 0
                        ? `Clear ${selectedTaskIds.length} selected task${selectedTaskIds.length === 1 ? '' : 's'}`
                        : 'Clear selection'
                    }
                  >
                    <span className="bookmark-toolbar-cta-icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8" />
                        <path d="M12 4 4 12" />
                      </svg>
                    </span>
                    <span>
                      {selectedTaskIds.length > 0
                        ? `Clear ${selectedTaskIds.length}`
                        : 'Clear'}
                    </span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="bookmark-selection-fab"
                  onClick={() =>
                    setSelectionMode((prev) => {
                      if (prev) setSelectedTaskIds([]);
                      return !prev;
                    })
                  }
                  aria-pressed={selectionMode}
                >
                  {selectionMode ? 'Done' : 'Select'}
                </button>
              </div>
            </FrostedStack>
          </div>
        </main>

        <aside
          className={`bookmark-rail bookmark-rail--tags ${
            isNarrow && mobileRail === 'tags' ? 'is-mobile-open' : ''
          }`}
        >
          {isNarrow && (
            <div className="bookmark-rail-mobile-header">
              <span className="bookmark-rail-mobile-title">Tags</span>
              <button
                type="button"
                className="bookmark-rail-mobile-close"
                onClick={() => setMobileRail('none')}
              >
                Close
              </button>
            </div>
          )}
          <div className="bookmark-rail-inner bookmark-rail-inner--tags">
            <TagFilterBar
              tags={tagsForBar}
              selectedTagIds={selectedTagIds}
              includeUntagged={includeUntagged}
              untaggedCount={untaggedCount}
              tagCounts={tagCounts}
              onToggleTag={handleToggleTag}
              onToggleUntagged={() => setIncludeUntagged((prev) => !prev)}
              bulkAssignMode={bulkAssignActive}
            />
          </div>
        </aside>
      </div>

      {toast !== null && (
        <FeedbackToast
          message={toast.message}
          phase={toast.phase}
          onAnimationEnd={handleAnimationEnd}
        />
      )}

      <ViewToggleFab mode={viewMode} onChange={setViewMode} />
    </div>
  );
};

export default TasksPage;
