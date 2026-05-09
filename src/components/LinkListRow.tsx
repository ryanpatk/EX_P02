import { useMemo, useState } from 'react';
import { LinkWithTag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import { getTagsForLink } from '../utils/linkTags';

interface LinkListRowProps {
  link: LinkWithTag;
  index: number;
  scrapedData?: ScrapedUrlData;
  onDelete?: (linkId: string) => void;
  onOpen: (link: LinkWithTag, index: number) => void;
  onToggleSelect: (linkId: string, index: number) => void;
  onOpenDetails?: (link: LinkWithTag, index: number) => void;
  isDetailsActive?: boolean;
  readOnly?: boolean;
  hideActions?: boolean;
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

const LinkListRow = ({
  link,
  index,
  scrapedData,
  onDelete,
  onOpen,
  onToggleSelect,
  onOpenDetails,
  isDetailsActive = false,
  readOnly = false,
  hideActions = false,
  isSelected = false,
  selectionMode = false,
}: LinkListRowProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  const mergedTags = useMemo(() => getTagsForLink(link), [link]);
  const faviconUrl = scrapedData?.logo || link.favicon_url;
  const title = scrapedData?.title || link.title || getHostname(link.url, true);
  const secondaryLabel = getPathLabel(link.url);
  const placeholderLabel = getInitials(getHostname(link.url, true));

  const handleRowActivate = () => {
    if (readOnly) {
      return;
    }
    if (selectionMode) {
      onToggleSelect(link.id, index);
      return;
    }
    onOpen(link, index);
  };

  return (
    <article
      className={`bookmark-list-row ${isSelected ? 'is-selected' : ''} ${
        readOnly ? 'is-read-only' : ''
      }`}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onClick={handleRowActivate}
      onKeyDown={(event) => {
        if (readOnly) return;
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

      {!hideActions && (
      <div className="bookmark-list-row-actions">
        {onOpenDetails && (
          <button
            type="button"
            className={`bookmark-list-row-action ${isDetailsActive ? 'is-open' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(link, index);
            }}
            aria-label="Link details"
            title="Link details"
            aria-pressed={isDetailsActive}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="3.75" />
              <path d="m10.1 10.1 3.4 3.4" />
            </svg>
          </button>
        )}
        {onDelete && (
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
        )}
      </div>
      )}
    </article>
  );
};

export default LinkListRow;
