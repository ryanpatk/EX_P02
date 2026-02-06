import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkWithTag, Tag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import TagSelector from './TagSelector';

interface LinkCardProps {
  link: LinkWithTag;
  scrapedData?: ScrapedUrlData;
  onDelete: (linkId: string) => void;
  onUpdateTags?: (linkId: string, tagIds: string[]) => void;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  isSelected?: boolean;
  isCursor?: boolean;
}

const getHostname = (url: string, removeWww: boolean = false): string => {
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
  } catch (error) {
    let cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
    if (removeWww) {
      cleaned = cleaned.replace('www.', '');
    }
    return cleaned || 'Unknown';
  }
};

const LinkCard = ({
  link,
  scrapedData,
  onDelete,
  onUpdateTags,
  availableTags = [],
  onCreateTag,
  isSelected = false,
  isCursor = false,
}: LinkCardProps) => {
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [localTagIds, setLocalTagIds] = useState<string[] | null>(null);

  const imageUrl = scrapedData?.image || link.preview_image_url;
  const faviconUrl = scrapedData?.logo || link.favicon_url;
  const showFullLink = isHoveringCard && !isHoveringButton;

  const mergedTags = useMemo(() => {
    if (link.tags && link.tags.length > 0) return link.tags;

    const tagMap = new Map<string, Tag>();
    if (link.tag) {
      tagMap.set(link.tag.id, link.tag);
    }
    if (link.link_tags) {
      link.link_tags.forEach((linkTag) => {
        if (linkTag.tag) {
          tagMap.set(linkTag.tag.id, linkTag.tag);
        }
      });
    }
    return Array.from(tagMap.values());
  }, [link]);

  const selectedTagIds = mergedTags.map((tag) => tag.id);
  const effectiveTagIds = localTagIds ?? selectedTagIds;

  const displayTags = useMemo(() => {
    if (!localTagIds) return mergedTags;
    const tagMap = new Map(availableTags.map((tag) => [tag.id, tag]));
    return localTagIds.map((id) => tagMap.get(id)).filter(Boolean) as Tag[];
  }, [availableTags, localTagIds, mergedTags]);

  const handleTagButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateTags || !onCreateTag) return;

    if (tagButtonRef.current) {
      const rect = tagButtonRef.current.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - 280);
      setSelectorPosition({
        top: rect.bottom + 8,
        left,
      });
    }
    setLocalTagIds(selectedTagIds);
    setIsTagSelectorOpen(true);
  };

  const handleTagChange = (tagIds: string[]) => {
    if (!onUpdateTags) return;
    setLocalTagIds(tagIds);
    onUpdateTags(link.id, tagIds);
  };

  useEffect(() => {
    if (!isTagSelectorOpen) {
      setLocalTagIds(null);
    }
  }, [isTagSelectorOpen]);

  return (
    <div
      className={`link-card ${showFullLink ? 'is-hovered' : ''}`}
      onMouseEnter={() => setIsHoveringCard(true)}
      onMouseLeave={() => setIsHoveringCard(false)}
    >
      {isSelected && <div className="link-card-selected" />}
      {isCursor && <div className="link-card-cursor" />}

      <div className="link-card-media">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={scrapedData?.title || ''}
            className={`link-card-image ${showFullLink ? 'is-hidden' : ''}`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setImageFailed(true);
            }}
          />
        ) : (
          <div className={`link-card-fallback ${showFullLink ? 'is-hidden' : ''}`}>
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="link-card-favicon"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <p className="link-card-domain">
              {scrapedData?.title || getHostname(link.url)}
            </p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(link.id);
          }}
          className="link-card-delete"
          title="Delete link"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className={`link-card-overlay ${showFullLink ? 'is-visible' : ''}`}>
          <div className="link-card-overlay-content">
            {scrapedData?.title ? (
              <h3 className="link-card-title">{scrapedData.title}</h3>
            ) : scrapedData?.description || link.description ? (
              <p className="link-card-description">
                {scrapedData?.description || link.description}
              </p>
            ) : (
              <p className="link-card-url">{link.url}</p>
            )}
          </div>
        </div>
      </div>

      <div className="link-card-footer">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(link.url, '_blank', 'noopener,noreferrer');
          }}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
          className="link-card-open"
        >
          <div className="link-card-open-text">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                className="link-card-open-icon"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="truncate">
              {scrapedData?.title || getHostname(link.url, true)}
            </span>
          </div>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div className="link-card-tags">
          {displayTags.map((tag) => (
            <span key={tag.id} className="tag-chip">
              <span className="tag-dot" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </span>
          ))}
          <button
            ref={tagButtonRef}
            type="button"
            onClick={handleTagButtonClick}
            className="tag-chip tag-chip-button"
            title="Edit tags"
          >
            + Tag
          </button>
        </div>
      </div>

      {isTagSelectorOpen && onCreateTag &&
        createPortal(
          <TagSelector
            tags={availableTags}
            selectedTagIds={effectiveTagIds}
            onChange={handleTagChange}
            onCreateTag={onCreateTag}
            onClose={() => setIsTagSelectorOpen(false)}
            position={selectorPosition}
          />,
          document.body
        )}
    </div>
  );
};

export default LinkCard;
