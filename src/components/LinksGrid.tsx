import { useRef, useMemo, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LinkWithTag, Tag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import LinkCard from './LinkCard';

interface LinksGridProps {
  links: LinkWithTag[];
  scrapedDataMap: Record<string, ScrapedUrlData>;
  onDeleteLink: (linkId: string) => void;
  onUpdateLinkTags?: (linkId: string, tagIds: string[]) => void;
  availableTags?: Tag[];
  onCreateTag?: (name: string, color: string) => Promise<Tag>;
  onVisibleLinksChange?: (visibleLinks: LinkWithTag[]) => void;
  selectedLinkIds?: string[];
  cursorIndex?: number | null;
  emptyTitle?: string;
  emptySubtitle?: string;
  onColumnChange?: (columns: number) => void;
  onToggleSelect?: (linkId: string, index: number) => void;
}

export interface LinksGridRef {
  scrollToIndex: (index: number) => void;
}

const LinksGrid = forwardRef<LinksGridRef, LinksGridProps>(({
  links,
  scrapedDataMap,
  onDeleteLink,
  onUpdateLinkTags,
  availableTags = [],
  onCreateTag,
  onVisibleLinksChange,
  selectedLinkIds = [],
  cursorIndex = null,
  emptyTitle = 'No links yet',
  emptySubtitle = 'Add a link to get started',
  onColumnChange,
  onToggleSelect,
}, ref) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Calculate number of columns based on container width
  const columns = useMemo(() => {
    if (containerWidth === 0) return 4; // Default
    if (containerWidth < 640) return 2; // Mobile (< 640px)
    if (containerWidth < 1024) return 3; // Tablet (640px - 1024px)
    return 4; // Desktop (>= 1024px)
  }, [containerWidth]);

  useEffect(() => {
    if (onColumnChange) {
      onColumnChange(columns);
    }
  }, [columns, onColumnChange]);

  // Calculate row height based on card dimensions
  // Card has: image (aspect 16:9) + footer section (fixed height)
  const cardHeight = useMemo(() => {
    if (containerWidth === 0) return 250; // Default estimate
    const horizontalPadding = 32;
    const columnGap = 16;
    const totalGap = columnGap * Math.max(columns - 1, 0);
    const availableWidth = Math.max(containerWidth - horizontalPadding - totalGap, 0);
    const cardWidth = availableWidth / columns;
    const imageHeight = cardWidth * (9 / 16);
    const footerHeight = 110; // Approx footer size (open button + tags row + padding)
    const rowGap = 16;
    return imageHeight + footerHeight + rowGap;
  }, [containerWidth, columns]);

  // Calculate number of rows
  const rowCount = Math.ceil(links.length / columns);

  // Measure container width
  useEffect(() => {
    if (!parentRef.current) return;

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
    estimateSize: () => cardHeight,
    overscan: 2, // Render 2 extra rows above and below viewport
  });

  // Recalculate virtualizer when card height or columns change (responsive to screen width)
  useEffect(() => {
    if (cardHeight > 0 && rowCount > 0 && containerWidth > 0) {
      // Force virtualizer to recalculate all row sizes when dimensions change
      virtualizer.measure();
    }
  }, [cardHeight, columns, containerWidth, virtualizer]);

  // Ensure we have at least the first row visible on initial render
  useEffect(() => {
    if (rowCount > 0 && virtualizer.getVirtualItems().length === 0 && parentRef.current) {
      // Force initial measurement - measure() will recalculate all items
      virtualizer.measure();
    }
  }, [rowCount, virtualizer]);

  // Expose scrollToIndex method via ref
  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      if (index < 0 || index >= links.length || containerWidth === 0) return;
      const rowIndex = Math.floor(index / columns);
      virtualizer.scrollToIndex(rowIndex, {
        align: 'center',
        behavior: 'smooth',
      });
    },
  }), [links.length, columns, containerWidth, virtualizer]);

  // Auto-scroll when cursor index changes (for up/down navigation)
  // Track previous cursor index to detect vertical movement
  const prevCursorIndexRef = useRef<number | null>(null);
  useEffect(() => {
    if (cursorIndex !== null && cursorIndex >= 0 && cursorIndex < links.length && containerWidth > 0 && rowCount > 0) {
      const prevIndex = prevCursorIndexRef.current;

      // Calculate row indices
      const currentRow = Math.floor(cursorIndex / columns);
      const prevRow = prevIndex !== null ? Math.floor(prevIndex / columns) : null;

      // Only scroll for vertical movement (up/down) or if this is the first cursor position
      if (prevRow === null || currentRow !== prevRow) {
        // Ensure row is within bounds
        if (currentRow >= 0 && currentRow < rowCount) {
          // Use requestAnimationFrame to ensure virtualizer and DOM are ready
          const rafId = requestAnimationFrame(() => {
            if (parentRef.current && virtualizer) {
              try {
                virtualizer.scrollToIndex(currentRow, {
                  align: 'center',
                  behavior: 'smooth',
                });
              } catch (error) {
                // Fallback: scroll manually if virtualizer fails
                console.warn('Virtualizer scroll failed, using manual scroll', error);
                const rowHeight = cardHeight;
                const targetScroll = currentRow * rowHeight;
                if (parentRef.current) {
                  parentRef.current.scrollTo({
                    top: Math.max(0, targetScroll - (parentRef.current.clientHeight / 2) + (rowHeight / 2)),
                    behavior: 'smooth',
                  });
                }
              }
            }
          });

          prevCursorIndexRef.current = cursorIndex;

          return () => cancelAnimationFrame(rafId);
        }
      }
      prevCursorIndexRef.current = cursorIndex;
    } else {
      prevCursorIndexRef.current = null;
    }
  }, [cursorIndex, links.length, columns, containerWidth, rowCount, cardHeight, virtualizer]);

  // Calculate visible links based on virtualized rows
  const virtualItems = virtualizer.getVirtualItems();
  const visibleLinks = useMemo(() => {
    if (virtualItems.length === 0) return [];

    const visibleLinksList: LinkWithTag[] = [];
    virtualItems.forEach((virtualRow) => {
      const startIndex = virtualRow.index * columns;
      const endIndex = Math.min(startIndex + columns, links.length);
      for (let i = startIndex; i < endIndex; i++) {
        if (links[i]) {
          visibleLinksList.push(links[i]);
        }
      }
    });
    return visibleLinksList;
  }, [virtualItems, links, columns]);

  // Notify parent of visible links for scraping (only when link IDs actually change)
  const prevVisibleLinkIdsRef = useRef<string>('');
  useEffect(() => {
    // Create a stable string representation of visible link IDs
    const currentLinkIds = visibleLinks.map(l => l.id).sort().join(',');

    // Only call if the visible link IDs actually changed
    if (currentLinkIds !== prevVisibleLinkIdsRef.current && onVisibleLinksChange) {
      prevVisibleLinkIdsRef.current = currentLinkIds;
      onVisibleLinksChange(visibleLinks);
    }
  }, [visibleLinks, onVisibleLinksChange]);

  if (links.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">{emptyTitle}</p>
          <p className="text-sm text-gray-400 mt-1">{emptySubtitle}</p>
        </div>
      </div>
    );
  }

  // If container width not measured yet, show a simple grid (non-virtualized) until measurement
  if (containerWidth === 0 && links.length > 0) {
    return (
      <div className="relative w-full h-full">
        <div
          ref={parentRef}
          className="w-full h-full overflow-auto"
          style={{ paddingBottom: '120px' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max p-4">
            {links.map((link, index) => {
              const isSelected = selectedLinkIds.includes(link.id);
              const isCursor = cursorIndex === index;
              return (
                <div
                  key={link.id}
                  data-link-index={index}
                  onClick={() => onToggleSelect?.(link.id, index)}
                >
                  <LinkCard
                    link={link}
                    scrapedData={scrapedDataMap[link.url]}
                    onDelete={onDeleteLink}
                    onUpdateTags={onUpdateLinkTags}
                    availableTags={availableTags}
                    onCreateTag={onCreateTag}
                    isSelected={isSelected}
                    isCursor={isCursor}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
        <div
          ref={parentRef}
          className="w-full h-full overflow-auto"
          style={{ paddingBottom: '120px' }}
        >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columns;
            const endIndex = Math.min(startIndex + columns, links.length);
            const rowLinks = links.slice(startIndex, endIndex);

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="grid h-full"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: '16px',
                    padding: '0 16px',
                  }}
                >
                  {rowLinks.map((link, linkIndex) => {
                    const globalIndex = startIndex + linkIndex;
                    const isSelected = selectedLinkIds.includes(link.id);
                    const isCursor = cursorIndex === globalIndex;
                    return (
                      <div
                        key={link.id}
                        onClick={() => onToggleSelect?.(link.id, globalIndex)}
                      >
                        <LinkCard
                          link={link}
                          scrapedData={scrapedDataMap[link.url]}
                          onDelete={onDeleteLink}
                          onUpdateTags={onUpdateLinkTags}
                          availableTags={availableTags}
                          onCreateTag={onCreateTag}
                          isSelected={isSelected}
                          isCursor={isCursor}
                        />
                      </div>
                    );
                  })}
                  {/* Fill empty cells in the last row */}
                  {Array.from({ length: columns - rowLinks.length }).map(
                    (_, idx) => (
                      <div key={`empty-${idx}`} />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

LinksGrid.displayName = 'LinksGrid';

export default LinksGrid;
