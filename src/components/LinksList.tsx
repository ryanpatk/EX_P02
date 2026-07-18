import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { LinkWithTag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';
import LinkListRow from './LinkListRow';

interface LinksListProps {
  links: LinkWithTag[];
  scrapedDataMap: Record<string, ScrapedUrlData>;
  onDeleteLink?: (linkId: string) => void;
  onOpenLink: (link: LinkWithTag, index: number) => void;
  onOpenLinkDetails?: (link: LinkWithTag, index: number) => void;
  activeDetailsLinkId?: string | null;
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

const ROW_HEIGHT = 92;
const ROW_GAP = 10;

const LinksList = forwardRef<LinksListRef, LinksListProps>(
  (
    {
      links,
      scrapedDataMap,
      onDeleteLink,
      onOpenLink,
      onOpenLinkDetails,
      activeDetailsLinkId = null,
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

    const renderListScroll = () => (
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
                  onOpenDetails={onOpenLinkDetails}
                  isDetailsActive={activeDetailsLinkId === link.id}
                  isSelected={selectedLinkIds.includes(link.id)}
                  selectionMode={selectionMode}
                />
              </div>
            );
          })}
        </div>
      </div>
    );

    return renderListScroll();
  },
);

LinksList.displayName = 'LinksList';

export default LinksList;
