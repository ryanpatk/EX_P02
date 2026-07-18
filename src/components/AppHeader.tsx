import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import CanvasColorPicker from './CanvasColorPicker';
import type { LinkWithTag } from '../types/database';
import type { ScrapedUrlData } from '../hooks/useUrlScraper';
import supabase from '../supabase';

interface AppHeaderProps {
  user: User | null;
  selectedCount: number;
  selectionMode: boolean;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  superFavoriteLinks?: LinkWithTag[];
  scrapedDataMap?: Record<string, ScrapedUrlData>;
  onSuperFavoriteOpen?: (link: LinkWithTag) => void;
}

// const SelectIcon = () => (
//   <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
//     <path d="M3 3.25h6.5v1.5H4.5v5H3v-6.5Z" />
//     <path d="M13 12.75H6.5v-1.5h5v-5H13v6.5Z" />
//   </svg>
// );

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8" />
    <path d="M12 4 4 12" />
  </svg>
);

// const DoneIcon = () => (
//   <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
//     <path d="M4 8.25 6.5 10.75 12 5.25" />
//   </svg>
// );

const faviconInitials = (link: LinkWithTag, scraped?: ScrapedUrlData) => {
  const label =
    scraped?.title?.trim() ||
    link.title?.trim() ||
    link.url.replace(/^https?:\/\//, '').split('/')[0] ||
    '?';
  return (
    label
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '◆'
  );
};

const SuperFavoriteButton = ({
  link,
  scraped,
  onOpen,
}: {
  link: LinkWithTag;
  scraped?: ScrapedUrlData;
  onOpen: (link: LinkWithTag) => void;
}) => {
  const [failed, setFailed] = useState(false);
  const favicon = scraped?.logo ?? link.favicon_url;
  const label = link.title?.trim() || link.url;

  return (
    <button
      type="button"
      className="bookmark-toolbar-super-fav"
      onClick={() => onOpen(link)}
      title={label}
      aria-label={`Open ${label}`}
    >
      {favicon && !failed ? (
        <img src={favicon} alt="" onError={() => setFailed(true)} />
      ) : (
        <span className="bookmark-toolbar-super-fav-initials">
          {faviconInitials(link, scraped)}
        </span>
      )}
    </button>
  );
};

const AppHeader = ({
  user,
  selectedCount,
  selectionMode,
  onToggleSelectionMode,
  onClearSelection,
  superFavoriteLinks = [],
  scrapedDataMap = {},
  onSuperFavoriteOpen,
}: AppHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  const showSelectionCta = true;
  const showClearCta = selectionMode;
  const canClearSelection = selectedCount > 0;

  const handleSuperFav = (link: LinkWithTag) => {
    if (onSuperFavoriteOpen) {
      onSuperFavoriteOpen(link);
    }
  };

  return (
    <header className="bookmark-toolbar">
      <div className="bookmark-toolbar-brand-wrap" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Open account menu"
        >
          {/* <span className="bookmark-toolbar-brand-emoji" aria-hidden="true">
            🌼
          </span> */}
          <span className="bookmark-toolbar-brand">superlinks</span>
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
              <CanvasColorPicker />
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

      <div className="bookmark-toolbar-center" aria-label="Super favorites">
        <div className="bookmark-toolbar-super-favorites">
          {superFavoriteLinks.map((link) => (
            <SuperFavoriteButton
              key={link.id}
              link={link}
              scraped={scrapedDataMap[link.url]}
              onOpen={handleSuperFav}
            />
          ))}
        </div>
      </div>

      <div className="bookmark-toolbar-status">
        {showClearCta && (
          <button
            type="button"
            className="bookmark-toolbar-cta is-secondary"
            onClick={onClearSelection}
            disabled={!canClearSelection}
          >
            <span className="bookmark-toolbar-cta-icon" aria-hidden="true">
              <CloseIcon />
            </span>
            <span>CLEAR</span>
          </button>
        )}
        {showSelectionCta && (
          <button
            type="button"
            className="bookmark-toolbar-cta is-accent is-chip"
            onClick={onToggleSelectionMode}
          >
            <span>{selectionMode ? 'Done' : 'Select'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
