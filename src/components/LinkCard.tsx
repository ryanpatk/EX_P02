import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkWithTag, Tag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import { getTagsForLink } from '../utils/linkTags';
import TagSelector from './TagSelector';

const TAG_SELECTOR_WIDTH = 308;
const TAG_SELECTOR_VIEWPORT_PADDING = 12;
const TAG_SELECTOR_OFFSET_Y = 8;

type ScrollParent = HTMLElement | Window;

interface LinkCardProps {
  link: LinkWithTag;
  index: number;
  scrapedData?: ScrapedUrlData;
  onDelete: (linkId: string) => void;
  onOpen: (link: LinkWithTag, index: number) => void;
  onToggleSelect: (linkId: string, index: number) => void;
  onOpenPreview?: (anchor: HTMLButtonElement) => void;
  isPreviewOpen?: boolean;
  onUpdateTags?: (linkId: string, tagIds: string[]) => void;
  onBulkTagDelta?: (
    linkIds: string[],
    delta: { added: string[]; removed: string[] },
  ) => void;
  bulkTagEditTargetIds?: string[];
  bulkTagUnionIds?: string[];
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  onDeleteTag?: (tagId: string) => Promise<void>;
  isSelected?: boolean;
  selectionMode?: boolean;
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

const getInitials = (value: string) =>
  value
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '::';

const getScrollParents = (element: HTMLElement | null): ScrollParent[] => {
  const parents: ScrollParent[] = [];
  let current = element?.parentElement ?? null;

  while (current) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(current);
    const isScrollable = /(auto|scroll|overlay)/.test(
      `${overflow}${overflowX}${overflowY}`,
    );

    if (isScrollable) {
      parents.push(current);
    }

    current = current.parentElement;
  }

  parents.push(window);
  return parents;
};

const LinkCard = ({
  link,
  index,
  scrapedData,
  onDelete,
  onOpen,
  onToggleSelect,
  onOpenPreview,
  isPreviewOpen = false,
  onUpdateTags,
  onBulkTagDelta,
  bulkTagEditTargetIds,
  bulkTagUnionIds,
  availableTags = [],
  onCreateTag,
  onDeleteTag,
  isSelected = false,
  selectionMode = false,
}: LinkCardProps) => {
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const [localTagIds, setLocalTagIds] = useState<string[] | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const initialBulkUnionRef = useRef<string[] | null>(null);

  const mergedTags = useMemo(() => getTagsForLink(link), [link]);

  const selectedTagIds = mergedTags.map((tag) => tag.id);
  const isBulkTagEdit =
    !!bulkTagEditTargetIds &&
    bulkTagEditTargetIds.length > 1 &&
    !!onBulkTagDelta &&
    bulkTagEditTargetIds.includes(link.id);

  const effectiveTagIds =
    localTagIds ?? (isBulkTagEdit ? (bulkTagUnionIds ?? []) : selectedTagIds);
  const faviconUrl = scrapedData?.logo || link.favicon_url;
  const title = scrapedData?.title || link.title || getHostname(link.url, true);
  const secondaryLabel = getPathLabel(link.url);
  const placeholderLabel = getInitials(getHostname(link.url, true));

  const updateSelectorPosition = () => {
    if (!tagButtonRef.current) {
      return;
    }

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
    if (!isTagSelectorOpen) {
      setLocalTagIds(null);
    }
  }, [isTagSelectorOpen]);

  useEffect(() => {
    if (!isTagSelectorOpen || !tagButtonRef.current) {
      return;
    }

    const scrollParents = getScrollParents(tagButtonRef.current);
    const handlePositionUpdate = () => {
      updateSelectorPosition();
    };

    handlePositionUpdate();

    scrollParents.forEach((parent) => {
      parent.addEventListener('scroll', handlePositionUpdate, { passive: true });
    });

    window.addEventListener('resize', handlePositionUpdate);

    return () => {
      scrollParents.forEach((parent) => {
        parent.removeEventListener('scroll', handlePositionUpdate);
      });
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [isTagSelectorOpen]);

  const handleCardActivate = () => {
    if (selectionMode) {
      onToggleSelect(link.id, index);
      return;
    }
    onOpen(link, index);
  };

  const handleTagButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onUpdateTags || !onCreateTag || !tagButtonRef.current) {
      return;
    }

    updateSelectorPosition();
    if (isBulkTagEdit) {
      const union = bulkTagUnionIds ?? [];
      initialBulkUnionRef.current = [...union];
      setLocalTagIds([...union]);
    } else {
      initialBulkUnionRef.current = null;
      setLocalTagIds(selectedTagIds);
    }
    setIsTagSelectorOpen(true);
  };

  const handleTagChange = (tagIds: string[]) => {
    if (!onUpdateTags) return;

    if (isBulkTagEdit && onBulkTagDelta && bulkTagEditTargetIds) {
      const prev = localTagIds ?? initialBulkUnionRef.current ?? [];
      const removed = prev.filter((id) => !tagIds.includes(id));
      const added = tagIds.filter((id) => !prev.includes(id));
      setLocalTagIds(tagIds);
      if (removed.length > 0 || added.length > 0) {
        onBulkTagDelta(bulkTagEditTargetIds, { added, removed });
      }
      return;
    }

    setLocalTagIds(tagIds);
    onUpdateTags(link.id, tagIds);
  };

  return (
    <article
      className={`bookmark-card ${isSelected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardActivate();
        }
      }}
    >
      <div className={`bookmark-card-preview ${isSelected ? 'is-selected' : ''}`}>
        {onOpenPreview && (
          <div className="bookmark-card-actions-left">
            <button
              ref={previewButtonRef}
              type="button"
              className={`bookmark-card-action ${isPreviewOpen ? 'is-open' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                if (previewButtonRef.current) {
                  onOpenPreview(previewButtonRef.current);
                }
              }}
              aria-label="Preview page in floating window"
              title="Preview page"
              aria-expanded={isPreviewOpen}
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="3.75" />
                <path d="m10.1 10.1 3.4 3.4" />
              </svg>
            </button>
          </div>
        )}
        <div className="bookmark-card-actions">
          {onUpdateTags && onCreateTag && (
            <button
              ref={tagButtonRef}
              type="button"
              className="bookmark-card-action"
              onClick={handleTagButtonClick}
              aria-label={
                isBulkTagEdit
                  ? `Edit tags for ${bulkTagEditTargetIds?.length ?? 0} bookmarks`
                  : 'Edit tags'
              }
              title={
                isBulkTagEdit
                  ? `Edit tags for ${bulkTagEditTargetIds?.length ?? 0} bookmarks`
                  : 'Edit tags'
              }
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 3v10" />
                <path d="M3 8h10" />
              </svg>
            </button>
          )}

          <button
            type="button"
            className="bookmark-card-action"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(link.id);
            }}
            aria-label="Delete link"
            title="Delete link"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8" />
              <path d="M12 4 4 12" />
            </svg>
          </button>
        </div>

        {faviconUrl && !imageFailed ? (
          <img
            src={faviconUrl}
            alt=""
            className="bookmark-card-favicon"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              setImageFailed(true);
            }}
          />
        ) : (
          <span className="bookmark-card-placeholder">{placeholderLabel}</span>
        )}

        {mergedTags.length > 0 && (
          <span className="bookmark-card-tag-indicator">{mergedTags.length}</span>
        )}
      </div>

      <div className="bookmark-card-meta">
        <p className="bookmark-card-title" title={title}>
          {title}
        </p>
        <p className="bookmark-card-subtitle" title={secondaryLabel}>
          {secondaryLabel}
        </p>
      </div>

      {isTagSelectorOpen &&
        onCreateTag &&
        createPortal(
          <TagSelector
            tags={availableTags}
            selectedTagIds={effectiveTagIds}
            onChange={handleTagChange}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onClose={() => setIsTagSelectorOpen(false)}
            position={selectorPosition}
            subtitle={
              isBulkTagEdit
                ? `Changes apply to ${bulkTagEditTargetIds?.length ?? 0} selected bookmarks.`
                : undefined
            }
          />,
          document.body,
        )}
    </article>
  );
};

export default LinkCard;
