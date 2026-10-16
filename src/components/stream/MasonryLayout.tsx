import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface MasonryItem {
  key: string;
  /** 2 = spans two columns (an expanded card). Falls back to 1 on a single column. */
  span?: 1 | 2;
  node: ReactNode;
}

interface MasonryLayoutProps {
  items: MasonryItem[];
  /** Columns are added while each can stay at least this wide. */
  minColumnWidth?: number;
  /** Changing this value animates every card to its new position (e.g. the expanded key). */
  animateKey?: string | null;
  className?: string;
}

interface Placement {
  x: number;
  y: number;
  width: number;
}

const ANIMATION_WINDOW_MS = 900;

const parsePx = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Shortest-column masonry with explicit positions. Cards are absolutely
 * placed with transforms, so when one changes size (expanding in place) the
 * neighbours glide to their new spots instead of jumping. Gaps come from the
 * container's CSS `column-gap` / `row-gap`, keeping spacing on theme tokens.
 */
const MasonryLayout = ({ items, minColumnWidth = 232, animateKey, className }: MasonryLayoutProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [width, setWidth] = useState(0);
  const [placements, setPlacements] = useState<Map<string, Placement>>(new Map());
  const [height, setHeight] = useState(0);
  const [measureTick, setMeasureTick] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [ready, setReady] = useState(false);

  // Container width
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Card size changes (images loading, content edits) trigger a re-layout
  const cardObserver = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    cardObserver.current = new ResizeObserver(() => setMeasureTick((t) => t + 1));
    nodeRefs.current.forEach((node) => cardObserver.current?.observe(node));
    return () => cardObserver.current?.disconnect();
  }, []);

  // One stable ref callback per key, so React doesn't detach/re-attach (and
  // the observer doesn't re-fire) on every render
  const refCallbacks = useRef(new Map<string, (node: HTMLDivElement | null) => void>());
  const setNodeRef = useCallback((key: string) => {
    let callback = refCallbacks.current.get(key);
    if (!callback) {
      callback = (node: HTMLDivElement | null) => {
        const map = nodeRefs.current;
        const previous = map.get(key);
        if (previous && previous !== node) cardObserver.current?.unobserve(previous);
        if (node) {
          map.set(key, node);
          cardObserver.current?.observe(node);
        } else {
          map.delete(key);
          refCallbacks.current.delete(key);
        }
      };
      refCallbacks.current.set(key, callback);
    }
    return callback;
  }, []);

  // Animate positions only around deliberate changes, not image loads
  const firstAnimateKey = useRef(animateKey);
  useEffect(() => {
    if (firstAnimateKey.current === animateKey) return;
    firstAnimateKey.current = animateKey;
    setAnimating(true);
    const timer = window.setTimeout(() => setAnimating(false), ANIMATION_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [animateKey]);

  const container = containerRef.current;
  const style = container ? getComputedStyle(container) : null;
  const columnGap = style ? parsePx(style.columnGap) : 12;
  const rowGap = style ? parsePx(style.rowGap) : 12;
  const columns = Math.max(1, Math.floor((width + columnGap) / (minColumnWidth + columnGap)));
  const columnWidth = width > 0 ? (width - columnGap * (columns - 1)) / columns : 0;

  const widthFor = (span: 1 | 2) =>
    span === 2 && columns > 1 ? columnWidth * 2 + columnGap : columnWidth;

  useLayoutEffect(() => {
    if (!columnWidth) return;
    const heights = new Array<number>(columns).fill(0);
    const next = new Map<string, Placement>();

    items.forEach((item) => {
      const node = nodeRefs.current.get(item.key);
      const cardHeight = node ? node.offsetHeight : 0;
      const span = item.span === 2 && columns > 1 ? 2 : 1;
      let column = 0;
      let top = 0;
      if (span === 2) {
        let best = Infinity;
        for (let c = 0; c < columns - 1; c += 1) {
          const candidate = Math.max(heights[c], heights[c + 1]);
          if (candidate < best) {
            best = candidate;
            column = c;
          }
        }
        top = best;
        heights[column] = top + cardHeight + rowGap;
        heights[column + 1] = top + cardHeight + rowGap;
      } else {
        column = heights.indexOf(Math.min(...heights));
        top = heights[column];
        heights[column] = top + cardHeight + rowGap;
      }
      next.set(item.key, {
        x: column * (columnWidth + columnGap),
        y: top,
        width: widthFor(span),
      });
    });

    setPlacements(next);
    setHeight(Math.max(0, Math.max(...heights) - rowGap));
    setReady(true);
    // widthFor is derived from the listed values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, columns, columnWidth, columnGap, rowGap, measureTick]);

  return (
    <div
      ref={containerRef}
      className={`memex-masonry${animating ? ' is-animating' : ''}${ready ? ' is-ready' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={{ height }}
    >
      {items.map((item) => {
        const placement = placements.get(item.key);
        const span = item.span === 2 && columns > 1 ? 2 : 1;
        return (
          <div
            key={item.key}
            ref={setNodeRef(item.key)}
            className={`memex-masonry-cell${span === 2 ? ' is-wide' : ''}`}
            style={{
              width: placement?.width ?? widthFor(span),
              transform: placement ? `translate3d(${placement.x}px, ${placement.y}px, 0)` : undefined,
              visibility: placement ? undefined : 'hidden',
            }}
          >
            {item.node}
          </div>
        );
      })}
    </div>
  );
};

export default MasonryLayout;
