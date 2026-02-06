import { useEffect, useMemo, useState } from 'react'
import { useAddLinksToProfile, useProfileLinks, useRemoveLinkFromProfile } from '../hooks/useProfileLinks'
import { useCreateProfile, useProfiles, useUpdateProfile } from '../hooks/useProfiles'
import { LinkWithTag, Profile } from '../types/database'

const getHostname = (url: string, removeWww: boolean = false): string => {
  if (!url || typeof url !== 'string') {
    return 'Unknown'
  }

  try {
    const urlWithProtocol = url.includes('://') ? url : `https://${url}`
    let hostname = new URL(urlWithProtocol).hostname
    if (removeWww) {
      hostname = hostname.replace('www.', '')
    }
    return hostname
  } catch (error) {
    let cleaned = url.replace(/^https?:\/\//, '').split('/')[0]
    if (removeWww) {
      cleaned = cleaned.replace('www.', '')
    }
    return cleaned || 'Unknown'
  }
}

interface ProfilesPaneProps {
  selectedLinkIds: string[]
}

const ProfileLinkTile = ({
  link,
  onRemove,
}: {
  link: LinkWithTag
  onRemove: () => void
}) => {
  const imageUrl = link.preview_image_url
  const faviconUrl = link.favicon_url
  const title = link.title || getHostname(link.url, true)
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className="profile-link-tile">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={title}
          className="profile-link-image"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            setImageFailed(true)
          }}
        />
      ) : (
        <div className="profile-link-fallback">
          {faviconUrl && (
            <img
              src={faviconUrl}
              alt=""
              className="profile-link-favicon"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <span className="profile-link-title">{title}</span>
        </div>
      )}
      <div className="profile-link-footer">
        {faviconUrl && (
          <img
            src={faviconUrl}
            alt=""
            className="profile-link-favicon"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <span className="profile-link-title">{title}</span>
      </div>
      <button
        type="button"
        className="profile-link-remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        title="Remove from profile"
      >
        ×
      </button>
    </div>
  )
}

const ProfileRow = ({
  profile,
  selectedLinkIds,
}: {
  profile: Profile
  selectedLinkIds: string[]
}) => {
  const { data: profileLinks } = useProfileLinks(profile.id)
  const updateProfile = useUpdateProfile()
  const addLinks = useAddLinksToProfile()
  const removeLink = useRemoveLinkFromProfile()

  const [name, setName] = useState(profile.name)

  useEffect(() => {
    setName(profile.name)
  }, [profile.name])

  const links = useMemo(
    () => (profileLinks || []).map((pl) => pl.link).filter(Boolean) as LinkWithTag[],
    [profileLinks],
  )

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(profile.name)
      return
    }
    if (trimmed !== profile.name) {
      updateProfile.mutate({ id: profile.id, updates: { name: trimmed } })
    }
  }

  const handleOpenAll = () => {
    links.forEach((link) => {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    })
  }

  const handleAddSelected = () => {
    if (selectedLinkIds.length === 0) return
    addLinks.mutate({ profileId: profile.id, linkIds: selectedLinkIds })
  }

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
            if (e.key === 'Escape') {
              setName(profile.name)
              e.currentTarget.blur()
            }
          }}
          className="profile-name-input"
          aria-label="Profile name"
        />
        <div className="profile-actions">
          <button
            type="button"
            onClick={handleOpenAll}
            className="profile-action"
            disabled={links.length === 0}
          >
            Open all
          </button>
          <button
            type="button"
            onClick={handleAddSelected}
            className="profile-action profile-action-primary"
            disabled={selectedLinkIds.length === 0 || addLinks.isPending}
          >
            Add selected{selectedLinkIds.length > 0 ? ` (${selectedLinkIds.length})` : ''}
          </button>
        </div>
      </div>
      <div className="profile-links-row">
        {links.length === 0 && (
          <div className="profile-empty">
            Add links from the library to build a launch-ready tab set.
          </div>
        )}
        {links.map((link) => (
          <button
            key={link.id}
            type="button"
            className="profile-link-button"
            onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
          >
            <ProfileLinkTile
              link={link}
              onRemove={() => removeLink.mutate({ profileId: profile.id, linkId: link.id })}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

const ProfilesPane = ({ selectedLinkIds }: ProfilesPaneProps) => {
  const { data: profiles } = useProfiles()
  const createProfile = useCreateProfile()

  const [isCreating, setIsCreating] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const handleCreateProfile = async () => {
    const trimmed = newProfileName.trim()
    if (!trimmed) return

    try {
      await createProfile.mutateAsync({ name: trimmed })
      setNewProfileName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create profile:', error)
    }
  }

  return (
    <div className="profiles-pane">
      <div className="profiles-pane-header">
        <div>
          <p className="pane-title">Profiles</p>
          <p className="pane-subtitle">Curated launch sets for fast context switching.</p>
        </div>
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="profile-action profile-action-primary"
          >
            New profile
          </button>
        ) : (
          <div className="profiles-create">
            <input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Profile name"
              className="profile-name-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateProfile()
                }
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewProfileName('')
                }
              }}
              autoFocus
            />
            <div className="profiles-create-actions">
              <button
                type="button"
                onClick={handleCreateProfile}
                className="profile-action profile-action-primary"
                disabled={!newProfileName.trim() || createProfile.isPending}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewProfileName('')
                }}
                className="profile-action"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profiles-pane-list">
        {profiles && profiles.length > 0 ? (
          profiles.map((profile) => (
            <ProfileRow
              key={profile.id}
              profile={profile}
              selectedLinkIds={selectedLinkIds}
            />
          ))
        ) : (
          <div className="profiles-empty">
            No profiles yet. Create one to group links into an instant workspace.
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilesPane
