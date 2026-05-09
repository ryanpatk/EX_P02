import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LinkWithTag, Tag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import { getTagIdsForLink } from '../utils/linkTags';
import LinkListRow from './LinkListRow';
import LinkPreviewPopover from './LinkPreviewPopover';

interface LinksListProps {
  links: LinkWithTag[];
  scrapedDataMap: Record<string, ScrapedUrlData>;
  onDeleteLink: (linkId: string) => void;
  onOpenLink: (link: LinkWithTag, index: number) => void;
  onUpdateLinkTags?: (linkId: string, tagIds: string[]) => void;
  onBulkTagDelta?: (
    linkIds: string[],
    delta: { added: string[]; removed: string[] },
  ) => void;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  onDeleteTag?: (tagId: string) => Promise<void>;
  onVisibleLinksChange?: (visibleLinks: LinkWithTag[]) => void;
  selectedLinkIds?: string[];
  emptyTitle?: string;
  emptySubtitle?: string;
  onToggleSelect: (linkId: string, index: number) => void;
  selectionMode?: boolean;
}

export interface LinksListRef {
  scrollToIndex: (index: number) => void;
}

const ROW_HEIGHT = 84;
const ROW_GAP = 10;

const LinksList = forwardRef<LinksListRef, LinksListProps>(
  (
    {
      links,
      scrapedDataMap,
      onDeleteLink,
      onOpenLink,
      onUpdateLinkTags,
      onBulkTagDelta,
      availableTags = [],
      onCreateTag,
      onDeleteTag,
      onVisibleLinksChange,
      selectedLinkIds = [],
      emptyTitle = 'No links yet',
      emptySubtitle = 'Add a link to get started',
      onToggleSelect,
      selectionMode = false,
    },
    ref,
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [preview, setPreview] = useState<{
      linkId: string;
      anchorEl: HTMLElement;
    } | null>(null);

    const previewLink = useMemo(
      () => (preview ? links.find((l) => l.id === preview.linkId) : undefined),
      [links, preview],
    );

    useEffect(() => {
      if (preview && !links.some((l) => l.id === preview.linkId)) {
        setPreview(null);
      }
    }, [links, preview]);

    const virtualizer = useVirtualizer({
      count: links.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => ROW_HEIGHT + ROW_GAP,
      overscan: 6,
    });

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (index: number) => {
          if (index < 0 || index >= links.length) return;
          virtualizer.scrollToIndex(index, { align: 'center', behavior: 'smooth' });
        },
      }),
      [links.length, virtualizer],
    );

    const virtualItems = virtualizer.getVirtualItems();

    const bulkTagUnionIds = useMemo(() => {
      if (!selectionMode || selectedLinkIds.length <= 1) return undefined;
      const union = new Set<string>();
      for (const id of selectedLinkIds) {
        const link = links.find((l) => l.id === id);
        if (!link) continue;
        getTagIdsForLink(link).forEach((tid) => union.add(tid));
      }
      return Array.from(union);
    }, [links, selectionMode, selectedLinkIds]);

    const visibleLinks = useMemo(() => {
      if (virtualItems.length === 0) return [];
      return virtualItems
        .map((vi) => links[vi.index])
        .filter(Boolean) as LinkWithTag[];
    }, [links, virtualItems]);

    const prevVisibleLinkIdsRef = useRef<string>('');
    useEffect(() => {
      const currentLinkIds = visibleLinks
        .map((link) => link.id)
        .sort()
        .join(',');

      if (currentLinkIds !== prevVisibleLinkIdsRef.current && onVisibleLinksChange) {
        prevVisibleLinkIdsRef.current = currentLinkIds;
        onVisibleLinksChange(visibleLinks);
      }
    }, [onVisibleLinksChange, visibleLinks]);

    if (links.length === 0) {
      return (
        <div className="bookmark-list-empty">
          <p className="bookmark-list-empty-title">{emptyTitle}</p>
          <p className="bookmark-list-empty-subtitle">{emptySubtitle}</p>
        </div>
      );
    }

    return (
      <>
        <div
          ref={parentRef}
          className="bookmark-list-scroll"
          style={{ '--bookmark-list-row-gap': `${ROW_GAP}px` } as React.CSSProperties}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative',
              width: '100%',
            }}
          >
            {virtualItems.map((vi) => {
              const link = links[vi.index];
              return (
                <div
                  key={vi.key}
                  data-index={vi.index}
                  ref={virtualizer.measureElement}
                  className="bookmark-list-virtual-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <LinkListRow
                    link={link}
                    index={vi.index}
                    scrapedData={scrapedDataMap[link.url]}
                    onDelete={onDeleteLink}
                    onOpen={onOpenLink}
                    onToggleSelect={onToggleSelect}
                    onOpenPreview={(anchorEl) => {
                      setPreview((prev) =>
                        prev?.linkId === link.id ? null : { linkId: link.id, anchorEl },
                      );
                    }}
                    isPreviewOpen={preview?.linkId === link.id}
                    onUpdateTags={onUpdateLinkTags}
                    onBulkTagDelta={onBulkTagDelta}
                    bulkTagEditTargetIds={
                      selectionMode &&
                      selectedLinkIds.length > 1 &&
                      selectedLinkIds.includes(link.id)
                        ? selectedLinkIds
                        : undefined
                    }
                    bulkTagUnionIds={bulkTagUnionIds}
                    availableTags={availableTags}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                    isSelected={selectedLinkIds.includes(link.id)}
                    selectionMode={selectionMode}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {previewLink && preview && (
          <LinkPreviewPopover
            link={previewLink}
            scrapedData={scrapedDataMap[previewLink.url]}
            anchorEl={preview.anchorEl}
            onClose={() => setPreview(null)}
          />
        )}
      </>
    );
  },
);

LinksList.displayName = 'LinksList';

export default LinksList;
