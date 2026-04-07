import {
  CSSProperties,
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
import LinkCard from './LinkCard';
import LinkPreviewPopover from './LinkPreviewPopover';

type GridDensity = 'compact' | 'comfortable';

interface LinksGridProps {
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
  onColumnChange?: (columns: number) => void;
  onToggleSelect: (linkId: string, index: number) => void;
  selectionMode?: boolean;
  density?: GridDensity;
}

export interface LinksGridRef {
  scrollToIndex: (index: number) => void;
}

const COMPACT_MIN_CARD_WIDTH = 124;
const COMFORTABLE_MIN_CARD_WIDTH = 156;
const COMPACT_GAP = 10;
const COMFORTABLE_GAP = 14;
const CARD_META_HEIGHT = 31;

const LinksGrid = forwardRef<LinksGridRef, LinksGridProps>(
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
      onColumnChange,
      onToggleSelect,
      selectionMode = false,
      density = 'compact',
    },
    ref,
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
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

    const gap = density === 'compact' ? COMPACT_GAP : COMFORTABLE_GAP;
    const minCardWidth =
      density === 'compact' ? COMPACT_MIN_CARD_WIDTH : COMFORTABLE_MIN_CARD_WIDTH;

    const columns = useMemo(() => {
      if (!containerWidth) {
        return density === 'compact' ? 7 : 5;
      }

      return Math.max(
        1,
        Math.floor((containerWidth + gap) / (minCardWidth + gap)),
      );
    }, [containerWidth, density, gap, minCardWidth]);

    useEffect(() => {
      onColumnChange?.(columns);
    }, [columns, onColumnChange]);

    const cardMetrics = useMemo(() => {
      if (!containerWidth) {
        const mediaSize = minCardWidth;
        return {
          mediaSize,
          rowHeight: mediaSize + CARD_META_HEIGHT + gap,
        };
      }

      const totalGap = gap * Math.max(columns - 1, 0);
      const availableWidth = Math.max(containerWidth - totalGap, 0);
      const mediaSize = availableWidth / columns;

      return {
        mediaSize,
        rowHeight: mediaSize + CARD_META_HEIGHT + gap,
      };
    }, [columns, containerWidth, gap, minCardWidth]);

    const gridStyle = useMemo<CSSProperties>(
      () =>
        ({
          '--bookmark-grid-gap': `${gap}px`,
          '--bookmark-card-media-size': `${cardMetrics.mediaSize}px`,
        }) as CSSProperties,
      [cardMetrics.mediaSize, gap],
    );

    const rowCount = Math.ceil(links.length / columns);

    useEffect(() => {
      if (!parentRef.current) return;

      setContainerWidth(parentRef.current.getBoundingClientRect().width);

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });

      resizeObserver.observe(parentRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    const virtualizer = useVirtualizer({
      count: rowCount,
      getScrollElement: () => parentRef.current,
      estimateSize: () => cardMetrics.rowHeight,
      overscan: 3,
    });

    useEffect(() => {
      if (rowCount > 0 && containerWidth > 0) {
        virtualizer.measure();
      }
    }, [rowCount, containerWidth, columns, links.length, cardMetrics.rowHeight, virtualizer]);

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: (index: number) => {
          if (index < 0 || index >= links.length || !containerWidth) return;
          const rowIndex = Math.floor(index / columns);
          virtualizer.scrollToIndex(rowIndex, {
            align: 'center',
            behavior: 'smooth',
          });
        },
      }),
      [containerWidth, columns, links.length, virtualizer],
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

      const nextVisibleLinks: LinkWithTag[] = [];

      virtualItems.forEach((virtualRow) => {
        const startIndex = virtualRow.index * columns;
        const endIndex = Math.min(startIndex + columns, links.length);

        for (let index = startIndex; index < endIndex; index += 1) {
          if (links[index]) {
            nextVisibleLinks.push(links[index]);
          }
        }
      });

      return nextVisibleLinks;
    }, [columns, links, virtualItems]);

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
        <div className="bookmark-grid-empty">
          <p className="bookmark-grid-empty-title">{emptyTitle}</p>
          <p className="bookmark-grid-empty-subtitle">{emptySubtitle}</p>
        </div>
      );
    }

    if (containerWidth === 0) {
      const fallbackColumns = density === 'compact' ? 6 : 4;

      return (
        <>
          <div ref={parentRef} className="bookmark-grid-scroll" style={gridStyle}>
            <div
              className="bookmark-grid-fallback"
              style={{ gridTemplateColumns: `repeat(${fallbackColumns}, minmax(0, 1fr))` }}
            >
              {links.map((link, index) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={index}
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
              ))}
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
    }

    return (
      <>
      <div ref={parentRef} className="bookmark-grid-scroll" style={gridStyle}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
            width: '100%',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const endIndex = Math.min(startIndex + columns, links.length);
            const rowLinks = links.slice(startIndex, endIndex);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  left: 0,
                  position: 'absolute',
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%',
                }}
              >
                <div
                  className="bookmark-grid-row"
                  style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {rowLinks.map((link, linkIndex) => {
                    const globalIndex = startIndex + linkIndex;

                    return (
                      <LinkCard
                        key={link.id}
                        link={link}
                        index={globalIndex}
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
                    );
                  })}

                  {Array.from({ length: columns - rowLinks.length }).map((_, index) => (
                    <div key={`bookmark-grid-spacer-${virtualRow.index}-${index}`} />
                  ))}
                </div>
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

LinksGrid.displayName = 'LinksGrid';

export default LinksGrid;
