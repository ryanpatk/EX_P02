import { useMemo, useState } from 'react';
import { LinkWithTag } from '../types/database';
import { getTagsForLink } from '../utils/linkTags';
import { getHostname, getLinkTitle } from '../utils/linkDisplay';
import StreamCard from './StreamCard';
import { getInitials } from '../utils/streamCardFormat';
import { ExternalLink } from 'lucide-react';

interface LinkGridCardProps {
  link: LinkWithTag;
  /** Card body: expand details, or toggle selection in selection mode. */
  onActivate: () => void;
  isDetailsActive?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  hideActions?: boolean;
}

/** Link as a stream card: favicon + host, title, tag footer, optional preview. */
const LinkGridCard = ({
  link,
  onActivate,
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
        !hideActions ? (
          <a
            className="bookmark-list-row-action"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            aria-label={`Open ${title} in a new tab`}
            title="Open link"
          >
            <ExternalLink aria-hidden="true" />
          </a>
        ) : undefined
      }
    />
  );
};

export default LinkGridCard;
