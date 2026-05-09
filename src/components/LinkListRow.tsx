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

interface LinkListRowProps {
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

const LinkListRow = ({
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
}: LinkListRowProps) => {
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

  const handleRowActivate = () => {
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
      className={`bookmark-list-row ${isSelected ? 'is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleRowActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleRowActivate();
        }
      }}
    >
      <div className={`bookmark-list-row-media ${isSelected ? 'is-selected' : ''}`}>
        {faviconUrl && !imageFailed ? (
          <img
            src={faviconUrl}
            alt=""
            className="bookmark-list-row-favicon"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              setImageFailed(true);
            }}
          />
        ) : (
          <span className="bookmark-list-row-placeholder">{placeholderLabel}</span>
        )}
      </div>

      <div className="bookmark-list-row-body">
        <p className="bookmark-list-row-title" title={title}>
          {title}
        </p>
        <p className="bookmark-list-row-subtitle" title={secondaryLabel}>
          {secondaryLabel}
        </p>
        {mergedTags.length > 0 && (
          <div className="bookmark-list-row-tags">
            {mergedTags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="bookmark-list-row-tag"
                style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
              >
                {tag.name}
              </span>
            ))}
            {mergedTags.length > 3 && (
              <span className="bookmark-list-row-tag is-more">+{mergedTags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="bookmark-list-row-actions">
        {onOpenPreview && (
          <button
            ref={previewButtonRef}
            type="button"
            className={`bookmark-list-row-action ${isPreviewOpen ? 'is-open' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              if (previewButtonRef.current) {
                onOpenPreview(previewButtonRef.current);
              }
            }}
            aria-label="Preview page"
            title="Preview page"
            aria-expanded={isPreviewOpen}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="3.75" />
              <path d="m10.1 10.1 3.4 3.4" />
            </svg>
          </button>
        )}
        {onUpdateTags && onCreateTag && (
          <button
            ref={tagButtonRef}
            type="button"
            className="bookmark-list-row-action"
            onClick={handleTagButtonClick}
            aria-label="Edit tags"
            title="Edit tags"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10" />
              <path d="M3 8h10" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="bookmark-list-row-action"
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

export default LinkListRow;
