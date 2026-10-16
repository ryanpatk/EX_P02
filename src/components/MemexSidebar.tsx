import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CircleUser, Settings } from 'lucide-react';
import { HOME_PATH, spacePath } from '../constants/modules';
import { useFeedbackToast } from '../hooks/useFeedbackToast';
import { useAddLinksToProfile, useProfileLinkMembership } from '../hooks/useProfileLinks';
import { useAddNotesToProfile, useProfileNoteMembership } from '../hooks/useProfileNotes';
import { useAddTasksToProfile, useProfileTaskMembership } from '../hooks/useProfileTasks';
import { useProfiles } from '../hooks/useProfiles';
import { useAppStore } from '../store';
import { parseItemKey } from '../utils/streamItems';
import { cue } from '../utils/sound';
import { useSpaceColors } from '../hooks/useSpaceColors';
import { useSession } from '../context/SessionContext';
import supabase from '../supabase';
import { FeedbackToast } from './ui';
import ApiTokensModal from './ApiTokensModal';
import SettingsMenu from './SettingsMenu';
import { userDisplayName } from '../utils/userDisplay';
import NewSpaceModal from './NewSpaceModal';
import { HomeIcon, PlusIcon } from './icons';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'memex-sidebar-item is-active' : 'memex-sidebar-item';

/**
 * App navigation: Home (everything) on top, then the segmented list of
 * spaces. While a stream selection is active, spaces turn into bulk-assign
 * targets — clicking one adds the selected items to that space instead of
 * navigating (the same dashed-chip affordance the old rails used).
 */
const MemexSidebar = () => {
  const { data: profiles } = useProfiles();
  const spaceColors = useSpaceColors();
  const { data: linkMembership } = useProfileLinkMembership();
  const { data: noteMembership } = useProfileNoteMembership();
  const { data: taskMembership } = useProfileTaskMembership();
  const addLinks = useAddLinksToProfile();
  const addNotes = useAddNotesToProfile();
  const addTasks = useAddTasksToProfile();
  const { toast, flash, handleAnimationEnd } = useFeedbackToast();

  const selectionMode = useAppStore((state) => state.selectionMode);
  const selectedItemKeys = useAppStore((state) => state.selectedItemKeys);
  const bulkAssignActive = selectionMode && selectedItemKeys.length > 0;

  const [isCreating, setIsCreating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const user = session?.user ?? null;

  // Settings popover: dismiss on outside click and Escape
  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!footRef.current?.contains(event.target as Node)) setSettingsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [settingsOpen]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Phone bottom bar scrolls horizontally: bring the active item into view
  // whenever the route changes so the current space is never off-screen
  useEffect(() => {
    if (!window.matchMedia('(max-width: 899px)').matches) return;
    const active = scrollRef.current?.querySelector<HTMLElement>('.memex-sidebar-item.is-active');
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [location.pathname]);

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

      if (newlyAdded > 0) cue('move');
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

      <div className="memex-sidebar-scroll" ref={scrollRef}>
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
                  className={(state) => `${itemClass(state)}${count === 0 ? ' is-empty' : ''}`}
                >
                  <span
                    className="memex-space-dot"
                    style={{ background: spaceColors.get(space.id) }}
                    aria-hidden="true"
                  />
                  <span className="memex-sidebar-item-label">{space.name}</span>
                  <span className="memex-sidebar-item-count">{count}</span>
                </NavLink>
              );
            })}

            {spaces.length === 0 && (
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

      <div className="memex-sidebar-foot" ref={footRef}>
        {settingsOpen && (
          <div className="bookmark-account-menu memex-sidebar-settings" role="dialog" aria-label="Settings">
            <SettingsMenu
              user={user}
              onOpenTokens={() => {
                setSettingsOpen(false);
                setTokensOpen(true);
              }}
              onLogout={handleLogout}
            />
          </div>
        )}
        <button
          type="button"
          className="memex-sidebar-account"
          onClick={() => setSettingsOpen((open) => !open)}
          aria-expanded={settingsOpen}
          aria-haspopup="dialog"
          aria-label="Open settings"
        >
          <CircleUser aria-hidden="true" className="memex-sidebar-account-avatar" />
          <span className="memex-sidebar-account-name">{userDisplayName(user)}</span>
          <Settings aria-hidden="true" className="memex-sidebar-account-gear" />
        </button>
      </div>

      <ApiTokensModal isOpen={tokensOpen} onClose={() => setTokensOpen(false)} />

      <NewSpaceModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onFeedback={flash}
      />

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
