import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Profile } from '../types/database';

interface ProfilePickerPopoverProps {
  profiles: Profile[];
  selectedCount: number;
  onPickProfile: (profileId: string) => void | Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
  anchorRef: RefObject<HTMLElement | null>;
  isBusy?: boolean;
}

const ProfileGlyph = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="profile-picker-glyph">
    <path d="M2.5 4.5h3l1 1h7v6.75H2.5z" />
  </svg>
);

const ProfilePickerPopover = ({
  profiles,
  selectedCount,
  onPickProfile,
  onClose,
  position,
  anchorRef,
  isBusy = false,
}: ProfilePickerPopoverProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [anchorRef, onClose]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const query = searchQuery.toLowerCase();
    return profiles.filter((p) => p.name.toLowerCase().includes(query));
  }, [searchQuery, profiles]);

  const handlePick = async (profileId: string) => {
    if (isBusy) return;
    await onPickProfile(profileId);
  };

  return (
    <div
      ref={containerRef}
      className="tag-selector profile-picker"
      role="dialog"
      aria-label="Add bookmarks to a profile"
      aria-busy={isBusy}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
        event.stopPropagation();
      }}
    >
      <div className="tag-selector-header">
        <div>
          <p className="tag-selector-title">PROFILES</p>
          <p className="tag-selector-subtitle">
            Add {selectedCount} selected bookmark{selectedCount === 1 ? '' : 's'} to a profile.
            Duplicates in that profile are skipped.
          </p>
        </div>
        <button
          type="button"
          className="tag-selector-close"
          onClick={onClose}
          aria-label="Close profile picker"
        >
          ×
        </button>
      </div>

      <div className="tag-selector-search">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search profiles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tag-selector-input"
          onClick={(e) => e.stopPropagation()}
          disabled={isBusy}
        />
      </div>

      <div className="tag-selector-list">
        {filteredProfiles.length === 0 && (
          <div className="tag-selector-empty">
            {profiles.length === 0 ? 'No profiles yet. Create one in the Profiles tab.' : 'No profiles match.'}
          </div>
        )}
        {filteredProfiles.map((profile) => (
          <div key={profile.id} className="tag-selector-item">
            <button
              type="button"
              className="tag-selector-toggle profile-picker-profile-button"
              onClick={() => handlePick(profile.id)}
              disabled={isBusy}
            >
              <span className="profile-picker-glyph-wrap" aria-hidden>
                <ProfileGlyph />
              </span>
              <span className="tag-selector-name">{profile.name}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePickerPopover;
