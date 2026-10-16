import { useMemo, useState } from 'react';
import { LinkWithTag } from '../types/database';
import { getTagsForLink } from '../utils/linkTags';
import { getHostname, getLinkTitle } from '../utils/linkDisplay';
import StreamCard from './StreamCard';
import { getInitials } from '../utils/streamCardFormat';
import { PanelRight } from 'lucide-react';

interface LinkGridCardProps {
  link: LinkWithTag;
  onActivate: () => void;
  onOpenDetails?: () => void;
  isDetailsActive?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  hideActions?: boolean;
}

/** Link as a stream card: favicon + host, title, tag footer, optional preview. */
const LinkGridCard = ({
  link,
  onActivate,
  onOpenDetails,
  isDetailsActive = false,
  isSelected = false,
  selectionMode = false,
  hideActions = false,
}: LinkGridCardProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const tags = useMemo(() => getTagsForLink(link), [link]);
  const faviconUrl = link.favicon_url;
  const previewUrl = link.preview_image_url;
  const host = getHostname(link.url);
  const title = getLinkTitle(link);

  return (
    <StreamCard
      type="link"
      isNew={link.id.startsWith('temp-')}
      previewUrl={previewFailed ? null : previewUrl}
      onPreviewError={() => setPreviewFailed(true)}
      leading={
        faviconUrl && !imageFailed ? (
          <img src={faviconUrl} alt="" onError={() => setImageFailed(true)} />
        ) : (
          <span className="memex-card-favicon-initials">{getInitials(host)}</span>
        )
      }
      meta={host}
      metaTitle={host}
      title={title}
      tags={tags}
      onActivate={onActivate}
      isSelected={isSelected}
      selectionMode={selectionMode}
      isDetailsActive={isDetailsActive}
      actions={
        !hideActions && onOpenDetails ? (
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
            <PanelRight aria-hidden="true" />
          </button>
        ) : undefined
      }
    />
  );
};

export default LinkGridCard;
