import { useState } from 'react';
import { useCreateProfile } from '../hooks/useProfiles';
import { Profile } from '../types/database';
import { FilterChip, InlineCreateForm } from './ui';

interface ProfileFilterBarProps {
  profiles: Profile[];
  profileCounts: Record<string, number>;
  selectedProfileId: string | null;
  onToggleProfile: (profileId: string) => void;
  bulkAssignMode?: boolean;
}

const ProfileFilterBar = ({
  profiles,
  profileCounts,
  selectedProfileId,
  onToggleProfile,
  bulkAssignMode = false,
}: ProfileFilterBarProps) => {
  const createProfile = useCreateProfile();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (name: string) => {
    try {
      await createProfile.mutateAsync({ name });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create space:', error);
    }
  };

  return (
    <div className="bookmark-profile-filter">
      <div className="bookmark-profile-filter-inner">
        {profiles.map((profile) => (
          <FilterChip
            key={profile.id}
            variant="space"
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
          <InlineCreateForm
            placeholder="Space name…"
            pending={createProfile.isPending}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <button
            type="button"
            className="bookmark-profile-new"
            onClick={() => setIsCreating(true)}
          >
            New space
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileFilterBar;
