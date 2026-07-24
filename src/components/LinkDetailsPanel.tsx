import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkWithTag, Profile, Tag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import { getTagsForLink } from '../utils/linkTags';
import LinkListRow from './LinkListRow';
import TagSelector from './TagSelector';
import { isUrlLike, normalizeUrlInput } from '../utils/urlInput';

const TAG_SELECTOR_WIDTH = 308;
const TAG_SELECTOR_VIEWPORT_PADDING = 12;
const TAG_SELECTOR_OFFSET_Y = 8;

interface LinkDetailsPanelProps {
  link: LinkWithTag;
  scrapedData?: ScrapedUrlData;
  membershipRows: { profile_id: string; link_id: string }[];
  profiles: Profile[];
  availableTags: Tag[];
  onUpdateUrl: (url: string) => Promise<void>;
  onToggleSuperFavorite: (next: boolean) => Promise<void>;
  onUpdateTags: (tagIds: string[]) => Promise<void>;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  onDeleteTag?: (tagId: string) => Promise<void>;
  onDeleteLink: () => Promise<void>;
  urlPending?: boolean;
  superFavoritePending?: boolean;
  deletePending?: boolean;
}

const LinkDetailsPanel = ({
  link,
  scrapedData,
  membershipRows,
  profiles,
  availableTags,
  onUpdateUrl,
  onToggleSuperFavorite,
  onUpdateTags,
  onCreateTag,
  onDeleteTag,
  onDeleteLink,
  urlPending = false,
  superFavoritePending = false,
  deletePending = false,
}: LinkDetailsPanelProps) => {
  const [urlDraft, setUrlDraft] = useState(link.url);
  const [urlDirty, setUrlDirty] = useState(false);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  const mergedTags = useMemo(() => getTagsForLink(link), [link]);
  const profileNames = useMemo(() => {
    const ids = new Set(
      membershipRows.filter((row) => row.link_id === link.id).map((r) => r.profile_id),
    );
    return (profiles ?? [])
      .filter((p) => ids.has(p.id))
      .map((p) => p.name)
      .sort((a, b) => a.localeCompare(b));
  }, [link.id, membershipRows, profiles]);

  const isSuper = Boolean(link.is_super_favorite);
  const formattedUpdated = useMemo(
    () =>
      new Date(link.updated_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [link.updated_at],
  );

  useEffect(() => {
    setUrlDraft(link.url);
    setUrlDirty(false);
  }, [link.id, link.url]);

  const updateSelectorPosition = () => {
    if (!tagButtonRef.current) return;
    const rect = tagButtonRef.current.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(TAG_SELECTOR_VIEWPORT_PADDING, rect.left),
      window.innerWidth - TAG_SELECTOR_WIDTH - TAG_SELECTOR_VIEWPORT_PADDING,
    );
    setSelectorPosition({
      top: rect.bottom + TAG_SELECTOR_OFFSET_Y,
      left: nextLeft,
    });
  };

  useEffect(() => {
    if (!isTagSelectorOpen || !tagButtonRef.current) return;
    const handlePositionUpdate = () => updateSelectorPosition();
    handlePositionUpdate();
    window.addEventListener('resize', handlePositionUpdate);
    return () => window.removeEventListener('resize', handlePositionUpdate);
  }, [isTagSelectorOpen]);

  const handleSaveUrl = async () => {
    const normalized = normalizeUrlInput(urlDraft.trim());
    if (!normalized || !isUrlLike(urlDraft.trim())) {
      return;
    }
    if (normalized === link.url) {
      setUrlDirty(false);
      return;
    }
    await onUpdateUrl(normalized);
    setUrlDirty(false);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        'Delete this bookmark permanently? This cannot be undone.',
      )
    ) {
      return;
    }
    await onDeleteLink();
  };

  const selectedTagIds = mergedTags.map((t) => t.id);

  return (
    <div className="bookmark-link-details">
      <div className="bookmark-link-details-card">
        <LinkListRow
          link={link}
          index={0}
          scrapedData={scrapedData}
          readOnly
          hideActions
          onOpen={() => {}}
          onToggleSelect={() => {}}
        />
      </div>

      <div className="bookmark-link-details-body">
        <section className="bookmark-detail-section">
          <h3 className="bookmark-detail-label">URL</h3>
          <div className="bookmark-detail-url-row">
            <input
              type="text"
              className="bookmark-detail-input"
              value={urlDraft}
              onChange={(e) => {
                setUrlDraft(e.target.value);
                setUrlDirty(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSaveUrl();
                }
              }}
              spellCheck={false}
              autoComplete="off"
              disabled={urlPending}
              aria-label="Bookmark URL"
            />
            <button
              type="button"
              className="bookmark-detail-save-url"
              onClick={() => void handleSaveUrl()}
              disabled={
                urlPending ||
                !urlDirty ||
                !isUrlLike(urlDraft.trim()) ||
                normalizeUrlInput(urlDraft.trim()) === link.url
              }
            >
              {urlPending ? 'Saving…' : 'Save URL'}
            </button>
          </div>
        </section>

        <section className="bookmark-detail-section">
          <h3 className="bookmark-detail-label">Last updated</h3>
          <p className="bookmark-detail-value">{formattedUpdated}</p>
        </section>

        <section className="bookmark-detail-section">
          <h3 className="bookmark-detail-label">Tags</h3>
          <div className="bookmark-detail-tags-row">
            {mergedTags.length > 0 ? (
              <div className="bookmark-detail-tag-chips">
                {mergedTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bookmark-detail-tag-chip"
                    style={
                      tag.color
                        ? { borderColor: tag.color, color: tag.color }
                        : undefined
                    }
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="bookmark-detail-muted">No tags</span>
            )}
            <button
              ref={tagButtonRef}
              type="button"
              className="bookmark-detail-tag-edit"
              onClick={() => {
                updateSelectorPosition();
                setIsTagSelectorOpen(true);
              }}
            >
              Edit tags…
            </button>
          </div>
        </section>

        <section className="bookmark-detail-section">
          <h3 className="bookmark-detail-label">Profiles</h3>
          {profileNames.length > 0 ? (
            <ul className="bookmark-detail-profile-list">
              {profileNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="bookmark-detail-muted">Not in any profile</p>
          )}
        </section>

        <section className="bookmark-detail-section">
          <div className="bookmark-detail-toggle-row">
            <div>
              <h3 className="bookmark-detail-label">SuperFavorite</h3>
              <p className="bookmark-detail-hint">
                Shows this site’s icon in the header for quick access.
              </p>
            </div>
            <label className="bookmark-detail-switch">
              <input
                type="checkbox"
                checked={isSuper}
                disabled={superFavoritePending}
                onChange={(e) => void onToggleSuperFavorite(e.target.checked)}
              />
              <span className="bookmark-detail-switch-ui" />
            </label>
          </div>
        </section>

        <section className="bookmark-detail-section bookmark-detail-section--danger">
          <button
            type="button"
            className="bookmark-detail-delete"
            onClick={() => void handleDelete()}
            disabled={deletePending}
          >
            {deletePending ? 'Deleting…' : 'Delete link'}
          </button>
        </section>
      </div>

      {isTagSelectorOpen &&
        createPortal(
          <TagSelector
            tags={availableTags}
            selectedTagIds={selectedTagIds}
            onChange={(ids) => void onUpdateTags(ids)}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onClose={() => setIsTagSelectorOpen(false)}
            position={selectorPosition}
          />,
          document.body,
        )}
    </div>
  );
};

export default LinkDetailsPanel;
