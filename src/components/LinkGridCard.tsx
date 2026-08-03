import { useMemo, useState } from 'react';
import { LinkWithTag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import { getTagsForLink } from '../utils/linkTags';

interface LinkGridCardProps {
  link: LinkWithTag;
  scrapedData?: ScrapedUrlData;
  onActivate: () => void;
  onOpenDetails?: () => void;
  isDetailsActive?: boolean;
  isSelected?: boolean;
  hideActions?: boolean;
}

const getHostname = (url: string): string => {
  try {
    const withProtocol = url.includes('://') ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace('www.', '');
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] || 'Unknown';
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

const LinkGridCard = ({
  link,
  scrapedData,
  onActivate,
  onOpenDetails,
  isDetailsActive = false,
  isSelected = false,
  hideActions = false,
}: LinkGridCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  const tags = useMemo(() => getTagsForLink(link), [link]);
  const faviconUrl = scrapedData?.logo || link.favicon_url;
  const host = getHostname(link.url);
  const title = scrapedData?.title || link.title || host;

  return (
    <article
      className={`memex-card memex-card--link${isSelected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      <div className="memex-card-header">
        <span className="memex-card-favicon">
          {faviconUrl && !imageFailed ? (
            <img src={faviconUrl} alt="" onError={() => setImageFailed(true)} />
          ) : (
            <span className="memex-card-favicon-initials">{getInitials(host)}</span>
          )}
        </span>
        <span className="memex-card-sub" title={host}>
          {host}
        </span>
      </div>

      <p className="memex-card-title" title={title}>
        {title}
      </p>

      <div className="memex-card-footer">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="bookmark-list-row-tag"
            style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
            title={tag.name}
          >
            {tag.name}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="bookmark-list-row-tag is-more">+{tags.length - 3}</span>
        )}
      </div>

      {!hideActions && onOpenDetails && (
        <div className="memex-card-actions">
          <button
            type="button"
            className={`bookmark-list-row-action ${isDetailsActive ? 'is-open' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails();
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
        </div>
      )}
    </article>
  );
};

export default LinkGridCard;
