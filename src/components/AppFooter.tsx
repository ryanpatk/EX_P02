import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';
import CanvasColorPicker from './CanvasColorPicker';
import DarkModeToggle from './DarkModeToggle';
import supabase from '../supabase';

const AppFooter = () => {
  const text = 'memex v1.0.0 - produced by Extension Systems, LLC © 2026';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

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
      setIsMenuOpen(false);
      window.location.assign('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const userLabel =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    null;

  return (
    <footer className="desktop-footer" role="contentinfo">
      <span className="desktop-footer-text" translate="no">
        {text}
      </span>

      <div className="desktop-footer-settings-wrap" ref={menuRef}>
        <button
          type="button"
          className="desktop-footer-settings"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          aria-label="Open settings menu"
        >
          Settings
        </button>

        {isMenuOpen && (
          <div className="bookmark-account-menu">
            {userLabel && (
              <div className="bookmark-account-menu-section">
                <p className="bookmark-account-menu-kicker">SIGNED IN</p>
                <p className="bookmark-account-menu-value">{userLabel}</p>
                {user?.email && user.email !== userLabel && (
                  <p className="bookmark-account-menu-meta">{user.email}</p>
                )}
              </div>
            )}
            <div className="bookmark-account-menu-section">
              <CanvasColorPicker />
              <DarkModeToggle className="bookmark-account-menu-action" />
              {user && (
                <button
                  type="button"
                  className="bookmark-account-menu-action"
                  onClick={handleLogout}
                >
                  LOG OUT
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};

export default AppFooter;
