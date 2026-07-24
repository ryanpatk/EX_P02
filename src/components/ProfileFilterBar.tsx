import { useEffect, useRef, useState } from 'react';
import { useCreateProfile } from '../hooks/useProfiles';
import { Profile } from '../types/database';

interface ProfileFilterBarProps {
  profiles: Profile[];
  profileCounts: Record<string, number>;
  selectedProfileId: string | null;
  onToggleProfile: (profileId: string) => void;
  bulkAssignMode?: boolean;
}

interface ProfileChipProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  bulkTarget?: boolean;
}

const ProfileChip = ({
  active,
  label,
  count,
  onClick,
  disabled,
  title,
  bulkTarget,
}: ProfileChipProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    data-cuelume-hover="tick"
    className={`bookmark-profile-chip ${active ? 'is-active' : ''}${
      bulkTarget ? ' is-bulk-target' : ''
    }`}
  >
    <span className="bookmark-profile-chip-label">{label}</span>
    <span className="bookmark-profile-chip-count">{count}</span>
  </button>
);

const ProfileFilterBar = ({
  profiles,
  profileCounts,
  selectedProfileId,
  onToggleProfile,
  bulkAssignMode = false,
}: ProfileFilterBarProps) => {
  const createProfile = useCreateProfile();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) {
      return;
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isCreating]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    try {
      await createProfile.mutateAsync({ name });
      setNewName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  return (
    <div className="bookmark-profile-filter">
      <div className="bookmark-profile-filter-inner">
        {profiles.map((profile) => (
          <ProfileChip
            key={profile.id}
            active={!bulkAssignMode && selectedProfileId === profile.id}
            label={profile.name}
            count={profileCounts[profile.id] ?? 0}
            onClick={() => onToggleProfile(profile.id)}
            bulkTarget={bulkAssignMode}
            title={
              bulkAssignMode
                ? `Add selection to “${profile.name}”`
                : `Filter by “${profile.name}”`
            }
          />
        ))}
      </div>

      <div className="bookmark-profile-filter-footer">
        {isCreating ? (
          <div className="bookmark-profile-create">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleCreate();
                }
                if (event.key === 'Escape') {
                  setIsCreating(false);
                  setNewName('');
                }
              }}
              placeholder="Profile name"
              className="bookmark-profile-create-input"
              disabled={createProfile.isPending}
            />
            <div className="bookmark-profile-create-actions">
              <button
                type="button"
                className="bookmark-profile-create-button is-primary"
                onClick={() => void handleCreate()}
                disabled={!newName.trim() || createProfile.isPending}
              >
                Add
              </button>
              <button
                type="button"
                className="bookmark-profile-create-button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="bookmark-profile-new"
            onClick={() => setIsCreating(true)}
          >
            New profile
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileFilterBar;
