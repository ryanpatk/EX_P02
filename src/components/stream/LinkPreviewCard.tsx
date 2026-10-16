import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Check, PanelRight } from 'lucide-react';
import type { LinkWithTag } from '../../types/database';
import { getHostname, getLinkTitle } from '../../utils/linkDisplay';

interface LinkPreviewCardProps {
  link: LinkWithTag;
  onActivate: () => void;
  onOpenDetails: () => void;
  /** Image failed to load — the stream swaps in the compact card. */
  onImageError: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}

/**
 * A link with a preview image: the image is the card. Title and host sit on
 * a frosted caption over the bottom of the image — revealed on hover/focus or
 * always shown, per the html[data-link-captions] preference (utils/linkCaptions).
 */
const LinkPreviewCard = ({
  link,
  onActivate,
  onOpenDetails,
  onImageError,
  isSelected = false,
  selectionMode = false,
}: LinkPreviewCardProps) => {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const host = getHostname(link.url);
  const title = getLinkTitle(link);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    onActivate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  };

  const favicon =
    link.favicon_url && !faviconFailed ? (
      <img src={link.favicon_url} alt="" onError={() => setFaviconFailed(true)} />
    ) : (
      <span aria-hidden="true">{host.slice(0, 1).toUpperCase()}</span>
    );

  return (
    <article
      className={`memex-pv${isSelected ? ' is-selected' : ''}${selectionMode ? ' is-selection-mode' : ''}${
        link.id.startsWith('temp-') ? ' is-new' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={selectionMode ? `Select ${title}` : `Open ${title}`}
      aria-pressed={selectionMode ? isSelected : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img
        className="memex-pv-image"
        src={link.preview_image_url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={onImageError}
      />

      <span className="memex-pv-badge" aria-hidden="true">
        <span className="memex-pv-favicon">{favicon}</span>
        <span className="memex-pv-badge-host">{host}</span>
      </span>

      <div className="memex-pv-caption">
        <span className="memex-pv-host">
          <span className="memex-pv-favicon">{favicon}</span>
          <span>{host}</span>
        </span>
        <span className="memex-pv-title" title={title}>
          {title}
        </span>
      </div>

      {selectionMode ? (
        <span className="memex-pv-check" aria-hidden="true">
          {isSelected && <Check />}
        </span>
      ) : (
        <div className="memex-pv-actions">
          <button
            type="button"
            className="memex-pv-action"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails();
            }}
            aria-label={`Details for ${title}`}
            title="Details"
          >
            <PanelRight aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
};

export default LinkPreviewCard;
