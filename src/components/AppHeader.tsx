import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import SoundToggle from './SoundToggle';
import CanvasColorPicker from './CanvasColorPicker';
import ApiTokensModal from './ApiTokensModal';
import type { LinkWithTag } from '../types/database';
import supabase from '../supabase';

interface AppHeaderProps {
  user: User | null;
  superFavoriteLinks?: LinkWithTag[];
  onSuperFavoriteOpen?: (link: LinkWithTag) => void;
  /** Custom toolbar-center content (replaces the super-favorites strip). */
  center?: React.ReactNode;
  /** Custom toolbar-right content, rendered before the (mobile-only) settings chip. */
  right?: React.ReactNode;
}

// const SelectIcon = () => (
//   <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
//     <path d="M3 3.25h6.5v1.5H4.5v5H3v-6.5Z" />
//     <path d="M13 12.75H6.5v-1.5h5v-5H13v6.5Z" />
//   </svg>
// );

// const DoneIcon = () => (
//   <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
//     <path d="M4 8.25 6.5 10.75 12 5.25" />
//   </svg>
// );

const faviconInitials = (link: LinkWithTag) => {
  const label =
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
  onOpen,
}: {
  link: LinkWithTag;
  onOpen: (link: LinkWithTag) => void;
}) => {
  const [failed, setFailed] = useState(false);
  const favicon = link.favicon_url;
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
          {faviconInitials(link)}
        </span>
      )}
    </button>
  );
};

const AppHeader = ({
  user,
  superFavoriteLinks = [],
  onSuperFavoriteOpen,
  center,
  right,
}: AppHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTokensOpen, setIsTokensOpen] = useState(false);
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

  const handleSuperFav = (link: LinkWithTag) => {
    if (onSuperFavoriteOpen) {
      onSuperFavoriteOpen(link);
    }
  };

  return (
    <header className="bookmark-toolbar">
      <div className="bookmark-toolbar-brand-wrap">
        <div className="bookmark-toolbar-brand-shell">
          {/* <span className="bookmark-toolbar-brand-emoji" aria-hidden="true">
            🌼
          </span> */}
          <span className="bookmark-toolbar-brand" translate="no">
            memex
          </span>
        </div>
      </div>

      {center ? (
        <div className="bookmark-toolbar-center">{center}</div>
      ) : (
        <div className="bookmark-toolbar-center" aria-label="Super favorites">
          <div className="bookmark-toolbar-super-favorites">
            {superFavoriteLinks.map((link) => (
              <SuperFavoriteButton
                key={link.id}
                link={link}
                onOpen={handleSuperFav}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bookmark-toolbar-status" ref={menuRef}>
        {right}

        {/* On desktop (≥768px) settings lives in the app footer instead */}
        <button
          type="button"
          className="bookmark-toolbar-cta is-secondary is-chip bookmark-toolbar-settings-mobile"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          aria-label="Open settings menu"
        >
          Settings
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
              <SoundToggle className="bookmark-account-menu-action" />
              <button
                type="button"
                className="bookmark-account-menu-action"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTokensOpen(true);
                }}
              >
                ACCESS TOKENS…
              </button>
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

      <ApiTokensModal
        isOpen={isTokensOpen}
        onClose={() => setIsTokensOpen(false)}
      />
    </header>
  );
};

export default AppHeader;
