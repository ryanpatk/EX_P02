import { useQueries } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  profileLinksApi,
  profileLinkKeys,
  useAddLinksToProfile,
  useRemoveLinkFromProfile,
} from '../hooks/useProfileLinks';
import {
  useCreateProfile,
  useDeleteProfile,
  useProfiles,
  useUpdateProfile,
} from '../hooks/useProfiles';
import { LinkWithTag, Profile, Tag } from '../types/database';

interface ProfilesPaneProps {
  selectedLinkIds: string[];
  selectionMode?: boolean;
  searchQuery: string;
  selectedTagIds: string[];
  includeUntagged: boolean;
}

interface ProfileRecord {
  profile: Profile;
  links: LinkWithTag[];
}

interface ProfileCardData extends ProfileRecord {
  visibleLinks: LinkWithTag[];
}

const getHostname = (url: string, removeWww = false): string => {
  if (!url || typeof url !== 'string') {
    return 'Unknown';
  }

  try {
    const urlWithProtocol = url.includes('://') ? url : `https://${url}`;
    let hostname = new URL(urlWithProtocol).hostname;
    if (removeWww) {
      hostname = hostname.replace('www.', '');
    }
    return hostname;
  } catch {
    let cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
    if (removeWww) {
      cleaned = cleaned.replace('www.', '');
    }
    return cleaned || 'Unknown';
  }
};

const getPathLabel = (url: string) => {
  try {
    const urlWithProtocol = url.includes('://') ? url : `https://${url}`;
    const parsed = new URL(urlWithProtocol);
    const value = `${parsed.pathname}${parsed.search}`.trim();

    if (!value || value === '/') {
      return parsed.hostname.replace('www.', '');
    }

    return value;
  } catch {
    const withoutOrigin = url.replace(/^https?:\/\//, '');
    const slashIndex = withoutOrigin.indexOf('/');
    return slashIndex >= 0 ? withoutOrigin.slice(slashIndex) : withoutOrigin;
  }
};

const mergeLinkTags = (link: LinkWithTag) => {
  if (link.tags && link.tags.length > 0) {
    return link.tags;
  }

  const tagMap = new Map<string, Tag>();

  if (link.tag) {
    tagMap.set(link.tag.id, link.tag);
  }

  link.link_tags?.forEach((linkTag) => {
    if (linkTag.tag) {
      tagMap.set(linkTag.tag.id, linkTag.tag);
    }
  });

  return Array.from(tagMap.values());
};

const isLinkWithTag = (value: LinkWithTag | undefined): value is LinkWithTag =>
  Boolean(value);

const linkMatchesQuery = (link: LinkWithTag, query: string) => {
  if (!query) {
    return true;
  }

  const hostname = getHostname(link.url, true).toLowerCase();
  const pathLabel = getPathLabel(link.url).toLowerCase();
  const title = (link.title || '').toLowerCase();
  const description = (link.description || '').toLowerCase();

  return (
    hostname.includes(query) ||
    pathLabel.includes(query) ||
    title.includes(query) ||
    description.includes(query) ||
    link.url.toLowerCase().includes(query)
  );
};

const linkMatchesTags = (
  link: LinkWithTag,
  selectedTagIds: string[],
  includeUntagged: boolean,
) => {
  if (selectedTagIds.length === 0 && !includeUntagged) {
    return true;
  }

  const tagIds = mergeLinkTags(link).map((tag) => tag.id);
  const hasTags = tagIds.length > 0;
  const matchesSelectedTag = selectedTagIds.some((tagId) => tagIds.includes(tagId));
  const matchesUntagged = includeUntagged && !hasTags;

  return matchesSelectedTag || matchesUntagged;
};

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    {expanded ? (
      <path d="m4.5 6 3.5 4 3.5-4" />
    ) : (
      <path d="m6 4.5 4 3.5-4 3.5" />
    )}
  </svg>
);

const OpenIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5 3.5h7.5V11" />
    <path d="M12.5 3.5 7 9" />
    <path d="M3.5 6.5v6h6" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m10.9 3.1 2 2" />
    <path d="m4.5 11.5 1.2-3.8 5.6-5.6 2 2-5.6 5.6-3.2 1.8Z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 4.5h9" />
    <path d="M6 4.5v-1h4v1" />
    <path d="M5 6.5v5.5" />
    <path d="M8 6.5v5.5" />
    <path d="M11 6.5v5.5" />
    <path d="M4.5 4.5 5 13h6l.5-8.5" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4.25 4.25 11.75 11.75" />
    <path d="M11.75 4.25 4.25 11.75" />
  </svg>
);

const ProfilePreviewCard = ({
  link,
  profileName,
  onRemove,
}: {
  link: LinkWithTag;
  profileName: string;
  onRemove: () => void;
}) => {
  const title = link.title || getHostname(link.url, true);
  const pathLabel = getPathLabel(link.url);

  return (
    <article className="bookmark-profile-preview-card">
      <button
        type="button"
        className="bookmark-profile-preview-link"
        onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
      >
        <div className="bookmark-profile-preview-media" />
        <div className="bookmark-profile-preview-meta">
          <p className="bookmark-profile-preview-title" title={title}>
            {title}
          </p>
          <p className="bookmark-profile-preview-subtitle" title={pathLabel}>
            {pathLabel}
          </p>
        </div>
      </button>

      <button
        type="button"
        className="bookmark-profile-preview-remove"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${title} from ${profileName}`}
        title="Remove link from profile"
      >
        <CloseIcon />
      </button>
    </article>
  );
};

const ProfileCard = ({
  profile,
  links,
  visibleLinks,
  selectedLinkIds,
  selectionMode = false,
}: {
  profile: Profile;
  links: LinkWithTag[];
  visibleLinks: LinkWithTag[];
  selectedLinkIds: string[];
  selectionMode?: boolean;
}) => {
  const addLinks = useAddLinksToProfile();
  const removeLink = useRemoveLinkFromProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();

  const [name, setName] = useState(profile.name);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
  }, [profile.name]);

  useEffect(() => {
    if (!isEditingName) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = name.trim();
    setIsEditingName(false);

    if (!trimmed) {
      setName(profile.name);
      return;
    }

    if (trimmed !== profile.name) {
      updateProfile.mutate({ id: profile.id, updates: { name: trimmed } });
    }
  };

  const handleAddSelected = () => {
    if (selectedLinkIds.length === 0) {
      return;
    }

    addLinks.mutate({ profileId: profile.id, linkIds: selectedLinkIds });
  };

  const handleOpenAll = () => {
    links.forEach((link) => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      `Delete the "${profile.name}" profile? Links will remain in your library.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProfile.mutateAsync(profile.id);
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const showAddSelected = selectionMode && selectedLinkIds.length > 0;

  return (
    <section className={`bookmark-profile-main-card ${isExpanded ? 'is-expanded' : ''}`}>
      <header className="bookmark-profile-main-header">
        <div className="bookmark-profile-main-heading">
          <button
            type="button"
            className="bookmark-profile-main-toggle"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label={isExpanded ? 'Collapse profile' : 'Expand profile'}
            title={isExpanded ? 'Collapse profile' : 'Expand profile'}
          >
            <ChevronIcon expanded={isExpanded} />
          </button>

          <div className="bookmark-profile-main-meta">
            {isEditingName ? (
              <input
                ref={inputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }

                  if (event.key === 'Escape') {
                    setName(profile.name);
                    setIsEditingName(false);
                  }
                }}
                className="bookmark-profile-main-name-input"
                aria-label="Profile name"
              />
            ) : (
              <button
                type="button"
                className="bookmark-profile-main-name"
                onClick={() => setIsEditingName(true)}
                title="Rename profile"
              >
                {profile.name.toUpperCase()}
              </button>
            )}
            <span className="bookmark-profile-main-count">
              {links.length} {links.length === 1 ? 'LINK' : 'LINKS'}
            </span>
          </div>
        </div>

        <div className="bookmark-profile-main-actions">
          <button
            type="button"
            className="bookmark-profile-main-action"
            onClick={handleOpenAll}
            disabled={links.length === 0}
          >
            <OpenIcon />
            <span>OPEN ALL</span>
          </button>

          {showAddSelected && (
            <button
              type="button"
              className="bookmark-profile-main-action"
              onClick={handleAddSelected}
              disabled={addLinks.isPending}
            >
              <span>ADD SELECTED</span>
            </button>
          )}

          <button
            type="button"
            className="bookmark-profile-main-icon"
            onClick={() => setIsEditingName(true)}
            aria-label={`Rename ${profile.name}`}
            title="Rename profile"
          >
            <EditIcon />
          </button>

          <button
            type="button"
            className="bookmark-profile-main-icon is-danger"
            onClick={handleDeleteProfile}
            aria-label={`Delete ${profile.name}`}
            title="Delete profile"
          >
            <TrashIcon />
          </button>
        </div>
      </header>

      {isExpanded && (
        <div className="bookmark-profile-main-body">
          {visibleLinks.length === 0 ? (
            <div className="bookmark-profile-main-empty">
              No links match the current filters for this profile.
            </div>
          ) : (
            <div className="bookmark-profile-preview-grid">
              {visibleLinks.map((link) => (
                <ProfilePreviewCard
                  key={link.id}
                  link={link}
                  profileName={profile.name}
                  onRemove={() =>
                    removeLink.mutate({ profileId: profile.id, linkId: link.id })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const ProfilesPane = ({
  selectedLinkIds,
  selectionMode = false,
  searchQuery,
  selectedTagIds,
  includeUntagged,
}: ProfilesPaneProps) => {
  const { data: profiles = [] } = useProfiles();
  const createProfile = useCreateProfile();

  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const profileLinkQueries = useQueries({
    queries: profiles.map((profile) => ({
      queryKey: profileLinkKeys.byProfile(profile.id),
      queryFn: () => profileLinksApi.getByProfile(profile.id),
      enabled: !!profile.id,
    })),
  });

  const profileRecords = useMemo<ProfileRecord[]>(() => {
    return profiles.map((profile, index) => {
      const profileLinks = profileLinkQueries[index]?.data || [];
      const links = profileLinks
        .map((profileLink) => profileLink.link)
        .filter(isLinkWithTag)
        .map((link) => ({
          ...link,
          tags: mergeLinkTags(link),
        })) as LinkWithTag[];

      return {
        profile,
        links,
      };
    });
  }, [profileLinkQueries, profiles]);

  const filteredProfiles = useMemo<ProfileCardData[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const hasTagFilters = selectedTagIds.length > 0 || includeUntagged;

    return profileRecords
      .map(({ profile, links }) => {
        const tagFilteredLinks = hasTagFilters
          ? links.filter((link) => linkMatchesTags(link, selectedTagIds, includeUntagged))
          : links;

        const nameMatches = normalizedQuery
          ? profile.name.toLowerCase().includes(normalizedQuery)
          : true;

        const searchFilteredLinks = normalizedQuery
          ? tagFilteredLinks.filter((link) => linkMatchesQuery(link, normalizedQuery))
          : tagFilteredLinks;

        const visibleLinks = normalizedQuery
          ? nameMatches
            ? tagFilteredLinks
            : searchFilteredLinks
          : tagFilteredLinks;

        const shouldInclude = (() => {
          if (hasTagFilters && tagFilteredLinks.length === 0) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return nameMatches || searchFilteredLinks.length > 0;
        })();

        return shouldInclude
          ? {
              profile,
              links,
              visibleLinks,
            }
          : null;
      })
      .filter(Boolean) as ProfileCardData[];
  }, [includeUntagged, profileRecords, searchQuery, selectedTagIds]);

  const isLoadingProfiles = profileLinkQueries.some((query) => query.isLoading);

  const handleCreateProfile = async () => {
    const trimmed = newProfileName.trim();

    if (!trimmed) {
      return;
    }

    try {
      await createProfile.mutateAsync({ name: trimmed });
      setNewProfileName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  return (
    <section className="bookmark-profiles-panel">
      <div className="bookmark-profiles-view">
        <div className="bookmark-profiles-view-header">
          <div className="bookmark-profiles-view-heading">
            <h2 className="bookmark-profiles-view-title">ALL PROFILES</h2>
            {selectionMode && selectedLinkIds.length > 0 && (
              <p className="bookmark-profiles-view-selection-note">
                {selectedLinkIds.length} SELECTED LINKS READY TO ADD
              </p>
            )}
          </div>

          <button
            type="button"
            className="bookmark-profiles-new-button"
            onClick={() => setIsCreating((prev) => !prev)}
          >
            <span className="bookmark-profiles-new-button-icon" aria-hidden="true">
              +
            </span>
            <span>NEW PROFILE</span>
          </button>
        </div>

        {isCreating && (
          <div className="bookmark-profile-creator">
            <input
              type="text"
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleCreateProfile();
                }

                if (event.key === 'Escape') {
                  setIsCreating(false);
                  setNewProfileName('');
                }
              }}
              placeholder="Name the new profile..."
              className="bookmark-profile-creator-input"
              autoFocus
            />

            <div className="bookmark-profile-creator-actions">
              <button
                type="button"
                className="bookmark-profile-creator-button is-primary"
                onClick={handleCreateProfile}
                disabled={!newProfileName.trim() || createProfile.isPending}
              >
                CREATE
              </button>
              <button
                type="button"
                className="bookmark-profile-creator-button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName('');
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        <div className="bookmark-profiles-stack">
          {isLoadingProfiles && profiles.length === 0 ? (
            <div className="bookmark-profile-main-empty-state">Loading profiles...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bookmark-profile-main-empty-state">
              {profiles.length === 0
                ? 'Create a profile to start grouping links.'
                : 'No profiles match the current filters.'}
            </div>
          ) : (
            filteredProfiles.map(({ profile, links, visibleLinks }) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                links={links}
                visibleLinks={visibleLinks}
                selectedLinkIds={selectedLinkIds}
                selectionMode={selectionMode}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfilesPane;
