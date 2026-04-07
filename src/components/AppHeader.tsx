import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { useDarkMode } from '../hooks/useDarkMode';
import type { Profile } from '../types/database';
import supabase from '../supabase';
import ProfilePickerPopover from './ProfilePickerPopover';

type GridDensity = 'compact' | 'comfortable';
type DashboardView = 'links' | 'profiles';

interface AppHeaderProps {
  user: any;
  activeView: DashboardView;
  summaryLabel: string;
  selectedCount: number;
  selectionMode: boolean;
  density: GridDensity;
  isComposerOpen: boolean;
  profiles?: Profile[];
  onAddSelectedToProfile?: (profileId: string) => Promise<void>;
  addToProfilePending?: boolean;
  onSetActiveView: (view: DashboardView) => void;
  onSetDensity: (density: GridDensity) => void;
  onToggleSelectionMode: () => void;
  onToggleComposer: () => void;
  onClearSelection: () => void;
}

interface ToolbarIconButtonProps {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

interface ViewTabProps {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolbarIconButton = ({
  active = false,
  title,
  onClick,
  children,
}: ToolbarIconButtonProps) => (
  <button
    type="button"
    className={`bookmark-tool-button ${active ? 'is-active' : ''}`}
    onClick={onClick}
    title={title}
    aria-label={title}
  >
    {children}
  </button>
);

const ViewTab = ({ active, label, title, onClick, children }: ViewTabProps) => (
  <button
    type="button"
    className={`bookmark-view-tab ${active ? 'is-active' : ''}`}
    onClick={onClick}
    title={title}
    aria-pressed={active}
  >
    <span className="bookmark-view-tab-icon" aria-hidden="true">
      {children}
    </span>
    <span>{label}</span>
  </button>
);

const CompactGridIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="2" y="2" width="4" height="4" />
    <rect x="10" y="2" width="4" height="4" />
    <rect x="2" y="10" width="4" height="4" />
    <rect x="10" y="10" width="4" height="4" />
  </svg>
);

const ComfortableGridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2.5" y="3" width="11" height="2.25" rx="0.5" />
    <rect x="2.5" y="7" width="11" height="2.25" rx="0.5" />
    <rect x="2.5" y="11" width="11" height="2.25" rx="0.5" />
  </svg>
);

const SelectIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3.25h6.5v1.5H4.5v5H3v-6.5Z" />
    <path d="M13 12.75H6.5v-1.5h5v-5H13v6.5Z" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M11.8 10.14A5.6 5.6 0 1 1 5.86 4.2a4.45 4.45 0 0 0 5.94 5.94Z" />
  </svg>
);

const LinkViewIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6.2 9.8 4.6 11.4a2.1 2.1 0 1 1-2.97-2.97L3.9 6.16" />
    <path d="M9.8 6.2 11.4 4.6a2.1 2.1 0 0 1 2.97 2.97L12.1 9.84" />
    <path d="m5.5 10.5 5-5" />
  </svg>
);

const ProfileViewIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2.5 4.5h3l1 1h7v6.75H2.5z" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10" />
    <path d="M3 8h10" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8" />
    <path d="M12 4 4 12" />
  </svg>
);

const PROFILE_PICKER_WIDTH = 308;
const PROFILE_PICKER_VIEWPORT_PADDING = 12;
const PROFILE_PICKER_OFFSET_Y = 8;

const AppHeader = ({
  user,
  activeView,
  summaryLabel,
  selectedCount,
  selectionMode,
  density,
  isComposerOpen,
  profiles = [],
  onAddSelectedToProfile,
  addToProfilePending = false,
  onSetActiveView,
  onSetDensity,
  onToggleSelectionMode,
  onToggleComposer,
  onClearSelection,
}: AppHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [profilePickerPosition, setProfilePickerPosition] = useState({
    top: 0,
    left: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const profilePickerButtonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!selectionMode || activeView !== 'links') {
      setIsProfilePickerOpen(false);
    }
  }, [selectionMode, activeView]);

  const updateProfilePickerPosition = () => {
    if (!profilePickerButtonRef.current) {
      return;
    }
    const rect = profilePickerButtonRef.current.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(
        PROFILE_PICKER_VIEWPORT_PADDING,
        rect.right - PROFILE_PICKER_WIDTH,
      ),
      window.innerWidth -
        PROFILE_PICKER_WIDTH -
        PROFILE_PICKER_VIEWPORT_PADDING,
    );
    setProfilePickerPosition({
      top: rect.bottom + PROFILE_PICKER_OFFSET_Y,
      left: nextLeft,
    });
  };

  useEffect(() => {
    if (!isProfilePickerOpen) {
      return;
    }

    const run = () => {
      updateProfilePickerPosition();
    };

    run();
    const raf = requestAnimationFrame(run);
    window.addEventListener('resize', run);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', run);
    };
  }, [isProfilePickerOpen]);

  const handleProfilePickerToggle = () => {
    setIsProfilePickerOpen((prev) => !prev);
  };

  const handlePickProfile = async (profileId: string) => {
    if (!onAddSelectedToProfile || selectedCount === 0) return;
    try {
      await onAddSelectedToProfile(profileId);
      setIsProfilePickerOpen(false);
    } catch {
      // Keep popover open on failure
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const userLabel =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Signed in';

  const showPrimaryCta = activeView === 'links';
  const showClearCta = showPrimaryCta && selectionMode;
  const canClearSelection = selectedCount > 0;
  const showProfilePickerButton =
    showPrimaryCta && selectionMode && Boolean(onAddSelectedToProfile);
  const canAddToProfile = selectedCount > 0;

  return (
    <header className="bookmark-toolbar">
      <div className="bookmark-toolbar-brand-wrap" ref={menuRef}>
        <button
          type="button"
          className="bookmark-toolbar-brand"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Open account menu"
        >
          EX_P02
        </button>

        {isMenuOpen && (
          <div className="bookmark-account-menu">
            <div className="bookmark-account-menu-section">
              <p className="bookmark-account-menu-kicker">SIGNED IN</p>
              <p className="bookmark-account-menu-value">{userLabel}</p>
              {user?.email && user?.email !== userLabel && (
                <p className="bookmark-account-menu-meta">{user.email}</p>
              )}
            </div>
            <div className="bookmark-account-menu-section">
              <DarkModeToggle className="bookmark-account-menu-action" />
              <button
                type="button"
                className="bookmark-account-menu-action"
                onClick={handleLogout}
              >
                LOG OUT
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bookmark-toolbar-center" aria-label="Dashboard controls">
        <div className="bookmark-view-switch">
          <ViewTab
            active={activeView === 'links'}
            label="LINKS"
            title="Show links view"
            onClick={() => onSetActiveView('links')}
          >
            <LinkViewIcon />
          </ViewTab>
          <ViewTab
            active={activeView === 'profiles'}
            label="PROFILES"
            title="Show profiles view"
            onClick={() => onSetActiveView('profiles')}
          >
            <ProfileViewIcon />
          </ViewTab>
        </div>

        <div className="bookmark-toolbar-tools">
          <div className="bookmark-tool-group">
            <ToolbarIconButton
              active={density === 'compact'}
              title="Compact grid"
              onClick={() => onSetDensity('compact')}
            >
              <CompactGridIcon />
            </ToolbarIconButton>
            <ToolbarIconButton
              active={density === 'comfortable'}
              title="Comfortable grid"
              onClick={() => onSetDensity('comfortable')}
            >
              <ComfortableGridIcon />
            </ToolbarIconButton>
          </div>

          <div className="bookmark-tool-group">
            <ToolbarIconButton
              active={selectionMode}
              title={
                selectionMode ? 'Exit selection mode' : 'Enter selection mode'
              }
              onClick={onToggleSelectionMode}
            >
              <SelectIcon />
            </ToolbarIconButton>
          </div>

          <ToolbarIconButton
            active={isDark}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDarkMode}
          >
            <MoonIcon />
          </ToolbarIconButton>
        </div>
      </div>

      <div className="bookmark-toolbar-status">
        <span className="bookmark-toolbar-summary">{summaryLabel}</span>
        {showProfilePickerButton && (
          <>
            <button
              ref={profilePickerButtonRef}
              type="button"
              className={`bookmark-toolbar-cta bookmark-toolbar-profile-cta is-secondary ${
                isProfilePickerOpen ? 'is-open' : ''
              }`}
              onClick={handleProfilePickerToggle}
              disabled={!canAddToProfile || addToProfilePending}
              title="Add selected bookmarks to a profile"
              aria-label="Add selected bookmarks to a profile"
              aria-expanded={isProfilePickerOpen}
            >
              <span className="bookmark-toolbar-cta-icon" aria-hidden="true">
                <ProfileViewIcon />
              </span>
              <span>PROFILE</span>
            </button>
            {isProfilePickerOpen &&
              createPortal(
                <ProfilePickerPopover
                  profiles={profiles}
                  selectedCount={selectedCount}
                  onPickProfile={handlePickProfile}
                  onClose={() => setIsProfilePickerOpen(false)}
                  position={profilePickerPosition}
                  anchorRef={profilePickerButtonRef}
                  isBusy={addToProfilePending}
                />,
                document.body,
              )}
          </>
        )}
        {showPrimaryCta && (
          <button
            type="button"
            className={`bookmark-toolbar-cta ${
              showClearCta ? 'is-secondary' : 'is-primary'
            } ${isComposerOpen ? 'is-open' : ''}`}
            onClick={showClearCta ? onClearSelection : onToggleComposer}
            disabled={showClearCta && !canClearSelection}
          >
            <span className="bookmark-toolbar-cta-icon" aria-hidden="true">
              {showClearCta ? <CloseIcon /> : <PlusIcon />}
            </span>
            <span>{showClearCta ? 'CLEAR' : 'ADD'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
