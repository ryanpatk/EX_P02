import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { SHOW_TAGS_UI, type ItemType } from '../constants/modules';
import type { Tag } from '../types/database';

const MAX_VISIBLE_TAGS = 3;

interface StreamCardProps {
  /** Drives the `memex-card--{type}` modifier. */
  type: ItemType;
  /** Optional 16:9 preview image (links with scraped previews). */
  previewUrl?: string | null;
  onPreviewError?: () => void;
  /** 24px leading slot in the header: favicon, type glyph, or checkbox. */
  leading: ReactNode;
  /** Muted caption beside the leading slot: host, date, due date… */
  meta?: ReactNode;
  metaTitle?: string;
  title: string;
  /** Optional clamped body text under the title (note excerpt, task detail). */
  excerpt?: string;
  tags: Tag[];
  /** Hover-revealed controls in the top-right corner. */
  actions?: ReactNode;
  /** Main activation (open, toggle select…). Omit for inert cards. */
  onActivate?: () => void;
  isSelected?: boolean;
  selectionMode?: boolean;
  isDone?: boolean;
  isDetailsActive?: boolean;
  /** Extra class names appended to the article. */
  className?: string;
  ariaLabel?: string;
}

/**
 * The one card every stream item renders through. Anatomy (top → bottom):
 * optional preview → header (leading slot + meta) → title → optional
 * excerpt → tag footer, with hover actions pinned top-right. Links, notes,
 * and tasks differ only in what they put in each slot.
 */
const StreamCard = ({
  type,
  previewUrl,
  onPreviewError,
  leading,
  meta,
  metaTitle,
  title,
  excerpt,
  tags,
  actions,
  onActivate,
  isSelected = false,
  selectionMode = false,
  isDone = false,
  isDetailsActive = false,
  className,
  ariaLabel,
}: StreamCardProps) => {
  const interactive = typeof onActivate === 'function';

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!interactive) return;
    // Ignore clicks that originated in nested controls (checkbox, actions)
    if ((event.target as HTMLElement).closest('button, a, input')) return;
    onActivate();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  };

  const classes = [
    'memex-card',
    `memex-card--${type}`,
    isSelected ? 'is-selected' : '',
    selectionMode ? 'is-selection-mode' : '',
    isDone ? 'is-done' : '',
    isDetailsActive ? 'is-details-active' : '',
    interactive ? '' : 'is-static',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classes}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive && selectionMode ? isSelected : undefined}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {previewUrl && (
        <div className="memex-card-preview">
          <img src={previewUrl} alt="" loading="lazy" onError={onPreviewError} />
        </div>
      )}

      <div className="memex-card-header">
        <span className="memex-card-favicon">{leading}</span>
        {meta !== undefined && meta !== null && (
          <span className="memex-card-sub" title={metaTitle}>
            {meta}
          </span>
        )}
      </div>

      <p className="memex-card-title" title={title}>
        {title}
      </p>

      {excerpt && <p className="memex-card-excerpt">{excerpt}</p>}

      <div className="memex-card-footer">
        {SHOW_TAGS_UI && tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
          <span
            key={tag.id}
            className="bookmark-list-row-tag"
            style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
            title={tag.name}
          >
            {tag.name}
          </span>
        ))}
        {SHOW_TAGS_UI && tags.length > MAX_VISIBLE_TAGS && (
          <span className="bookmark-list-row-tag is-more">
            +{tags.length - MAX_VISIBLE_TAGS}
          </span>
        )}
      </div>

      {actions && <div className="memex-card-actions">{actions}</div>}
    </article>
  );
};

export default StreamCard;
