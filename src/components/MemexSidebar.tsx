import { useCallback, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HOME_PATH, spacePath } from '../constants/modules';
import { useFeedbackToast } from '../hooks/useFeedbackToast';
import { useAddLinksToProfile, useProfileLinkMembership } from '../hooks/useProfileLinks';
import { useAddNotesToProfile, useProfileNoteMembership } from '../hooks/useProfileNotes';
import { useAddTasksToProfile, useProfileTaskMembership } from '../hooks/useProfileTasks';
import { useCreateProfile, useProfiles } from '../hooks/useProfiles';
import { useAppStore } from '../store';
import { parseItemKey } from '../utils/streamItems';
import { FeedbackToast, InlineCreateForm } from './ui';

const ICON_PROPS = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const HomeIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M2.75 7.75 8 3.25l5.25 4.5" />
    <path d="M4.25 6.75v6h7.5v-6" />
    <path d="M6.75 12.75v-3h2.5v3" />
  </svg>
);

const PlusIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M8 3.5v9" />
    <path d="M3.5 8h9" />
  </svg>
);

const itemClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'memex-sidebar-item is-active' : 'memex-sidebar-item';

/**
 * App navigation: Home (everything) on top, then the segmented list of
 * spaces. While a stream selection is active, spaces turn into bulk-assign
 * targets — clicking one adds the selected items to that space instead of
 * navigating (the same dashed-chip affordance the old rails used).
 */
const MemexSidebar = () => {
  const navigate = useNavigate();
  const { data: profiles } = useProfiles();
  const { data: linkMembership } = useProfileLinkMembership();
  const { data: noteMembership } = useProfileNoteMembership();
  const { data: taskMembership } = useProfileTaskMembership();
  const createProfile = useCreateProfile();
  const addLinks = useAddLinksToProfile();
  const addNotes = useAddNotesToProfile();
  const addTasks = useAddTasksToProfile();
  const { toast, flash, handleAnimationEnd } = useFeedbackToast();

  const selectionMode = useAppStore((state) => state.selectionMode);
  const selectedItemKeys = useAppStore((state) => state.selectedItemKeys);
  const bulkAssignActive = selectionMode && selectedItemKeys.length > 0;

  const [isCreating, setIsCreating] = useState(false);

  const spaces = useMemo(() => profiles ?? [], [profiles]);

  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const bump = (id: string) => {
      counts[id] = (counts[id] ?? 0) + 1;
    };
    (linkMembership ?? []).forEach((row) => bump(row.profile_id));
    (noteMembership ?? []).forEach((row) => bump(row.profile_id));
    (taskMembership ?? []).forEach((row) => bump(row.profile_id));
    return counts;
  }, [linkMembership, noteMembership, taskMembership]);

  const handleCreateSpace = useCallback(
    async (name: string) => {
      try {
        const created = await createProfile.mutateAsync({ name });
        setIsCreating(false);
        if (created?.id) {
          navigate(spacePath(created.id));
        }
      } catch (error) {
        console.error('Failed to create space:', error);
      }
    },
    [createProfile, navigate],
  );

  const handleAddSelectionToSpace = useCallback(
    async (spaceId: string) => {
      const space = spaces.find((s) => s.id === spaceId);
      const name = space?.name ?? 'space';

      const linkIds: string[] = [];
      const noteIds: string[] = [];
      const taskIds: string[] = [];
      selectedItemKeys.forEach((key) => {
        const { type, id } = parseItemKey(key);
        if (id.startsWith('temp-')) return;
        if (type === 'link') linkIds.push(id);
        else if (type === 'note') noteIds.push(id);
        else if (type === 'task') taskIds.push(id);
      });

      const already = new Set<string>();
      (linkMembership ?? []).forEach((row) => {
        if (row.profile_id === spaceId) already.add(`link:${row.link_id}`);
      });
      (noteMembership ?? []).forEach((row) => {
        if (row.profile_id === spaceId) already.add(`note:${row.note_id}`);
      });
      (taskMembership ?? []).forEach((row) => {
        if (row.profile_id === spaceId) already.add(`task:${row.task_id}`);
      });
      const total = linkIds.length + noteIds.length + taskIds.length;
      const newlyAdded = selectedItemKeys.filter((key) => !already.has(key)).length;

      if (newlyAdded === 0) {
        flash(`Selection was already in “${name}”.`);
      } else if (newlyAdded === total) {
        flash(`Added ${newlyAdded} item${newlyAdded === 1 ? '' : 's'} to “${name}”.`);
      } else {
        flash(
          `Added ${newlyAdded} item${newlyAdded === 1 ? '' : 's'} to “${name}” (${total - newlyAdded} already there).`,
        );
      }

      try {
        await Promise.all([
          linkIds.length > 0
            ? addLinks.mutateAsync({ profileId: spaceId, linkIds })
            : Promise.resolve(),
          noteIds.length > 0
            ? addNotes.mutateAsync({ profileId: spaceId, noteIds })
            : Promise.resolve(),
          taskIds.length > 0
            ? addTasks.mutateAsync({ profileId: spaceId, taskIds })
            : Promise.resolve(),
        ]);
      } catch (error) {
        console.error('Failed to add selection to space:', error);
      }
    },
    [
      addLinks,
      addNotes,
      addTasks,
      flash,
      linkMembership,
      noteMembership,
      selectedItemKeys,
      spaces,
      taskMembership,
    ],
  );

  return (
    <nav className="memex-sidebar" aria-label="Navigation">
      <div className="memex-sidebar-brand">
        <div className="bookmark-toolbar-brand-shell">
          <span className="bookmark-toolbar-brand" translate="no">
            memex
          </span>
        </div>
      </div>

      <div className="memex-sidebar-scroll">
        <div className="memex-sidebar-nav">
          <NavLink to={HOME_PATH} end className={itemClass}>
            <span className="memex-sidebar-item-icon">
              <HomeIcon />
            </span>
            <span className="memex-sidebar-item-label">Home</span>
          </NavLink>
        </div>

        <div className="memex-sidebar-section">
          <div className="memex-sidebar-section-header">
            <span className="memex-sidebar-kicker">Spaces</span>
            <button
              type="button"
              className="memex-sidebar-new"
              onClick={() => setIsCreating(true)}
              aria-label="New space"
              title="New space"
            >
              <PlusIcon />
            </button>
          </div>

          <div
            className={`memex-sidebar-nav memex-sidebar-spaces${
              bulkAssignActive ? ' is-bulk-assign' : ''
            }`}
          >
            {spaces.map((space) => {
              const count = spaceCounts[space.id] ?? 0;
              if (bulkAssignActive) {
                return (
                  <button
                    key={space.id}
                    type="button"
                    className="memex-sidebar-item is-bulk-target"
                    onClick={() => void handleAddSelectionToSpace(space.id)}
                    title={`Add selection to “${space.name}”`}
                  >
                    <span className="memex-sidebar-item-icon">
                      <PlusIcon />
                    </span>
                    <span className="memex-sidebar-item-label">{space.name}</span>
                    <span className="memex-sidebar-item-count">{count}</span>
                  </button>
                );
              }
              return (
                <NavLink
                  key={space.id}
                  to={spacePath(space.id)}
                  className={itemClass}
                >
                  <span className="memex-sidebar-item-label">{space.name}</span>
                  <span className="memex-sidebar-item-count">{count}</span>
                </NavLink>
              );
            })}

            {isCreating && (
              <div className="memex-sidebar-create">
                <InlineCreateForm
                  placeholder="Space name…"
                  pending={createProfile.isPending}
                  onSubmit={handleCreateSpace}
                  onCancel={() => setIsCreating(false)}
                />
              </div>
            )}

            {spaces.length === 0 && !isCreating && (
              <button
                type="button"
                className="memex-sidebar-empty"
                onClick={() => setIsCreating(true)}
              >
                Create your first space
              </button>
            )}
          </div>
        </div>
      </div>

      {toast !== null && (
        <FeedbackToast
          message={toast.message}
          phase={toast.phase}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </nav>
  );
};

export default MemexSidebar;
