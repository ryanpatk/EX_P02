import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import LinkGridCard from '../../components/LinkGridCard';
import LinkListRow from '../../components/LinkListRow';
import NoteGridCard from '../../components/NoteGridCard';
import NoteListRow from '../../components/NoteListRow';
import SpaceCarousel from '../../components/SpaceCarousel';
import TaskGridCard from '../../components/TaskGridCard';
import TaskListRow from '../../components/TaskListRow';
import { EmptyState, FrostedStack, Omnibar, ViewToggleFab } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { useViewMode } from '../../hooks/useViewMode';
import { useAllLinks } from '../../hooks/useLinks';
import { useAllNotes } from '../../hooks/useNotes';
import { useAllTasks, useUpdateTask } from '../../hooks/useTasks';
import { useCreateProfile, useProfiles } from '../../hooks/useProfiles';
import { useProfileLinkMembership } from '../../hooks/useProfileLinks';
import { useProfileNoteMembership } from '../../hooks/useProfileNotes';
import { useProfileTaskMembership } from '../../hooks/useProfileTasks';
import {
  LinkWithTag,
  NoteWithTags,
  Tag,
  TaskWithTags,
} from '../../types/database';
import { openUrlInBackgroundTab } from '../../utils/openUrlInBackgroundTab';
import { stripMarkdown } from '../../utils/markdown';

const LAST_SPACE_KEY = 'memex.last-space';

type SpaceItem =
  | { type: 'link'; id: string; updatedAt: string; link: LinkWithTag }
  | { type: 'note'; id: string; updatedAt: string; note: NoteWithTags }
  | { type: 'task'; id: string; updatedAt: string; task: TaskWithTags };

const mergeTags = <T extends { tags?: Tag[] }>(
  item: T,
  joins: { tag?: Tag }[] | undefined,
): Tag[] => {
  const map = new Map<string, Tag>();
  (joins ?? []).forEach((join) => {
    if (join.tag) map.set(join.tag.id, join.tag);
  });
  (item.tags ?? []).forEach((tag) => map.set(tag.id, tag));
  return Array.from(map.values());
};

const SpacesPage = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useViewMode('spaces');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(LAST_SPACE_KEY);
    } catch {
      return null;
    }
  });

  const { data: allLinks } = useAllLinks();
  const { data: allNotes } = useAllNotes();
  const { data: allTasks } = useAllTasks();
  const { data: profiles } = useProfiles();
  const { data: linkMembership } = useProfileLinkMembership();
  const { data: noteMembership } = useProfileNoteMembership();
  const { data: taskMembership } = useProfileTaskMembership();
  const updateTask = useUpdateTask();
  const createProfile = useCreateProfile();

  const spaces = useMemo(() => profiles ?? [], [profiles]);

  // Resolve selection: stored space if it still exists, else the first space
  useEffect(() => {
    if (spaces.length === 0) return;
    if (selectedSpaceId && spaces.some((space) => space.id === selectedSpaceId)) {
      return;
    }
    setSelectedSpaceId(spaces[0].id);
  }, [selectedSpaceId, spaces]);

  const handleSelectSpace = useCallback((spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setSearchQuery('');
    try {
      window.localStorage.setItem(LAST_SPACE_KEY, spaceId);
    } catch {
      /* storage unavailable — skip */
    }
  }, []);

  const handleCreateSpace = useCallback(
    async (name: string) => {
      try {
        const created = await createProfile.mutateAsync({ name });
        if (created?.id) {
          handleSelectSpace(created.id);
        }
        setIsCreatingSpace(false);
      } catch (error) {
        console.error('Failed to create space:', error);
      }
    },
    [createProfile, handleSelectSpace],
  );

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

  // Membership sets for the selected space
  const spaceSets = useMemo(() => {
    const sets = {
      links: new Set<string>(),
      notes: new Set<string>(),
      tasks: new Set<string>(),
    };
    if (!selectedSpaceId) return sets;
    (linkMembership ?? []).forEach((row) => {
      if (row.profile_id === selectedSpaceId) sets.links.add(row.link_id);
    });
    (noteMembership ?? []).forEach((row) => {
      if (row.profile_id === selectedSpaceId) sets.notes.add(row.note_id);
    });
    (taskMembership ?? []).forEach((row) => {
      if (row.profile_id === selectedSpaceId) sets.tasks.add(row.task_id);
    });
    return sets;
  }, [linkMembership, noteMembership, selectedSpaceId, taskMembership]);

  const spaceItems = useMemo<SpaceItem[]>(() => {
    if (!selectedSpaceId) return [];
    const items: SpaceItem[] = [];

    (allLinks ?? []).forEach((link) => {
      if (!spaceSets.links.has(link.id)) return;
      items.push({
        type: 'link',
        id: link.id,
        updatedAt: link.updated_at,
        link: { ...link, tags: mergeTags(link, link.link_tags) },
      });
    });

    (allNotes ?? []).forEach((note) => {
      if (!spaceSets.notes.has(note.id)) return;
      items.push({
        type: 'note',
        id: note.id,
        updatedAt: note.updated_at,
        note: { ...note, tags: mergeTags(note, note.note_tags) },
      });
    });

    (allTasks ?? []).forEach((task) => {
      if (!spaceSets.tasks.has(task.id)) return;
      items.push({
        type: 'task',
        id: task.id,
        updatedAt: task.updated_at,
        task: { ...task, tags: mergeTags(task, task.task_tags) },
      });
    });

    return items;
  }, [allLinks, allNotes, allTasks, selectedSpaceId, spaceSets]);

  const filterBySearch = useCallback(
    (item: SpaceItem) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      if (item.type === 'link') {
        return (
          item.link.url.toLowerCase().includes(query) ||
          item.link.title?.toLowerCase().includes(query) ||
          item.link.description?.toLowerCase().includes(query)
        );
      }
      if (item.type === 'note') {
        return (
          item.note.title?.toLowerCase().includes(query) ||
          stripMarkdown(item.note.body).toLowerCase().includes(query)
        );
      }
      return (
        item.task.title.toLowerCase().includes(query) ||
        item.task.detail?.toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filteredItems = useMemo(
    () =>
      spaceItems
        .filter(filterBySearch)
        .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)),
    [filterBySearch, spaceItems],
  );

  const handleToggleTaskDone = useCallback(
    (task: TaskWithTags) => {
      if (task.id.startsWith('temp-')) return;
      updateTask.mutate({ id: task.id, updates: { is_done: !task.is_done } });
    },
    [updateTask],
  );

  const handleOpenNote = useCallback(
    (note: NoteWithTags) => {
      navigate(`/notes?note=${note.id}`);
    },
    [navigate],
  );

  const handleOpenLink = useCallback((link: LinkWithTag) => {
    openUrlInBackgroundTab(link.url);
  }, []);

  const noop = useCallback(() => {}, []);

  const selectedSpace = spaces.find((space) => space.id === selectedSpaceId);
  const hasSpaces = spaces.length > 0;

  const emptyTitle = !hasSpaces
    ? 'No spaces yet'
    : searchQuery.trim()
      ? 'Nothing here matches your search'
      : 'This space is empty';
  const emptySubtitle = !hasSpaces
    ? 'Create your first space with the + button in the toolbar above.'
    : searchQuery.trim()
      ? 'Try a different search, or clear it to see everything in this space.'
      : 'Assign notes, links, and tasks to this space from their modules — they all land here.';

  return (
    <div className="bookmark-dashboard">
      <AppHeader
        user={session?.user ?? null}
        center={
          <SpaceCarousel
            spaces={spaces}
            selectedSpaceId={selectedSpaceId}
            onSelect={handleSelectSpace}
            isCreating={isCreatingSpace}
            onCreate={handleCreateSpace}
            onCancelCreate={() => setIsCreatingSpace(false)}
            createPending={createProfile.isPending}
          />
        }
        right={
          <button
            type="button"
            className="memex-space-carousel-arrow memex-space-new"
            onClick={() => setIsCreatingSpace(true)}
            aria-label="New space"
            title="New space"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3.5v9" />
              <path d="M3.5 8h9" />
            </svg>
          </button>
        }
      />

      {/* Same grid as the primitive modules (empty rail columns) so the
          stack width tracks theirs at every viewport size; in grid view the
          empty rails collapse entirely */}
      <div
        className={`bookmark-feed-layout${
          viewMode === 'grid' ? ' is-grid-wide is-empty-rails' : ''
        }`}
      >
        <aside className="bookmark-rail bookmark-rail--profiles" aria-hidden="true" />

        <main className="bookmark-feed-main">
          <div
            className={`bookmark-feed-main-inner${viewMode === 'grid' ? ' is-grid-view' : ''}`}
          >
          <FrostedStack>
            <div className="bookmark-search-panel">
              <Omnibar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  selectedSpace ? `Search “${selectedSpace.name}”…` : 'No spaces yet'
                }
                ariaLabel="Search this space"
              />
            </div>

            <div className={viewMode === 'grid' ? 'memex-grid-view' : 'memex-space-list'}>
              {filteredItems.length === 0 ? (
                <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
              ) : viewMode === 'grid' ? (
                <div className="memex-grid">
                  {filteredItems.map((item) => {
                    if (item.type === 'link') {
                      return (
                        <LinkGridCard
                          key={`link-${item.id}`}
                          link={item.link}
                          hideActions
                          onActivate={() => handleOpenLink(item.link)}
                        />
                      );
                    }
                    if (item.type === 'note') {
                      return (
                        <NoteGridCard
                          key={`note-${item.id}`}
                          note={item.note}
                          hideActions
                          onOpen={handleOpenNote}
                        />
                      );
                    }
                    return (
                      <TaskGridCard
                        key={`task-${item.id}`}
                        task={item.task}
                        hideActions
                        onToggleDone={handleToggleTaskDone}
                      />
                    );
                  })}
                </div>
              ) : (
                filteredItems.map((item) => {
                  if (item.type === 'link') {
                    return (
                      <LinkListRow
                        key={`link-${item.id}`}
                        link={item.link}
                        index={0}
                        hideActions
                        onOpen={() => handleOpenLink(item.link)}
                        onToggleSelect={noop}
                      />
                    );
                  }
                  if (item.type === 'note') {
                    return (
                      <NoteListRow
                        key={`note-${item.id}`}
                        note={item.note}
                        hideActions
                        onOpen={handleOpenNote}
                        onDelete={noop}
                      />
                    );
                  }
                  return (
                    <TaskListRow
                      key={`task-${item.id}`}
                      task={item.task}
                      hideActions
                      onToggleDone={handleToggleTaskDone}
                      onDelete={noop}
                    />
                  );
                })
              )}
            </div>
          </FrostedStack>
          </div>
        </main>

        <aside className="bookmark-rail bookmark-rail--tags" aria-hidden="true" />
      </div>

      <ViewToggleFab mode={viewMode} onChange={setViewMode} />
    </div>
  );
};

export default SpacesPage;
