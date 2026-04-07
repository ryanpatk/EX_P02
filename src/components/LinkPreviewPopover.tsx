import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LinkWithTag } from '../types/database';
import { ScrapedUrlData } from '../hooks/useUrlScraper';

type ScrollParent = HTMLElement | Window;

interface LinkPreviewPopoverProps {
  link: LinkWithTag;
  scrapedData?: ScrapedUrlData;
  anchorEl: HTMLElement;
  onClose: () => void;
}

const getPortalRoot = (): HTMLElement | null =>
  typeof document !== 'undefined' ? document.body : null;

const getScrollParents = (element: HTMLElement | null): ScrollParent[] => {
  const parents: ScrollParent[] = [];
  let current = element?.parentElement ?? null;

  while (current) {
    const { overflow, overflowX, overflowY } = window.getComputedStyle(current);
    const isScrollable = /(auto|scroll|overlay)/.test(
      `${overflow}${overflowX}${overflowY}`,
    );
    if (isScrollable) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(window);
  return parents;
};

const computePopoverBox = (anchor: DOMRect) => {
  const PAD = 12;
  const GAP = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const minW = 260;
  const minH = 200;

  const availW = vw - PAD * 2;
  const availH = vh - PAD * 2;
  let width = Math.min(500, availW);
  let height = Math.min(440, availH);
  width = Math.max(minW, width);
  height = Math.max(minH, height);

  const belowTop = anchor.bottom + GAP;
  const belowSpace = vh - PAD - belowTop;
  const aboveSpace = anchor.top - GAP - PAD;

  let top: number;
  if (belowSpace >= minH && belowSpace >= aboveSpace) {
    top = belowTop;
    height = Math.min(height, belowSpace);
  } else if (aboveSpace >= minH) {
    height = Math.min(height, aboveSpace);
    top = anchor.top - GAP - height;
  } else {
    top = belowTop;
    height = Math.max(minH, Math.min(height, belowSpace));
    if (top + height > vh - PAD) {
      top = Math.max(PAD, vh - PAD - height);
    }
  }

  top = Math.max(PAD, Math.min(top, vh - PAD - height));

  let left = anchor.left;
  if (left + width > vw - PAD) {
    left = vw - PAD - width;
  }
  left = Math.max(PAD, left);
  width = Math.min(width, vw - PAD * 2);
  height = Math.min(height, vh - PAD * 2);

  return {
    top,
    left,
    width: Math.max(minW, width),
    height: Math.max(minH, height),
  };
};

const toIframeSrc = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return 'about:blank';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const getHostname = (url: string): string => {
  try {
    const withProto = url.includes('://') ? url : `https://${url}`;
    return new URL(withProto).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 48) || 'Link';
  }
};

const LinkPreviewPopover = ({
  link,
  scrapedData,
  anchorEl,
  onClose,
}: LinkPreviewPopoverProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [box, setBox] = useState(() => computePopoverBox(anchorEl.getBoundingClientRect()));
  const panelRef = useRef<HTMLDivElement>(null);
  const iframeSrc = useMemo(() => toIframeSrc(link.url), [link.url]);
  const displayTitle = scrapedData?.title || link.title || getHostname(link.url);

  const updatePosition = useCallback(() => {
    if (!anchorEl.isConnected) {
      onClose();
      return;
    }
    setBox(computePopoverBox(anchorEl.getBoundingClientRect()));
  }, [anchorEl, onClose]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, link.id]);

  useEffect(() => {
    setIframeLoaded(false);
  }, [iframeSrc]);

  useEffect(() => {
    const scrollParents = getScrollParents(anchorEl);
    scrollParents.forEach((parent) => {
      parent.addEventListener('scroll', updatePosition, { passive: true });
    });
    window.addEventListener('resize', updatePosition);
    return () => {
      scrollParents.forEach((parent) => {
        parent.removeEventListener('scroll', updatePosition);
      });
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorEl, updatePosition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [anchorEl, onClose]);

  const root = getPortalRoot();
  if (!root) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      className="bookmark-link-preview-panel bookmark-link-preview-panel--popover"
      role="dialog"
      aria-label={`Preview: ${displayTitle}`}
      style={{
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      }}
    >
      <header className="bookmark-link-preview-header">
        <div className="bookmark-link-preview-heading">
          <p className="bookmark-link-preview-title" title={displayTitle}>
            {displayTitle}
          </p>
          <p className="bookmark-link-preview-url" title={iframeSrc}>
            {iframeSrc}
          </p>
        </div>
        <div className="bookmark-link-preview-header-actions">
          <button
            type="button"
            className="bookmark-link-preview-header-button"
            onClick={() => window.open(iframeSrc, '_blank', 'noopener,noreferrer')}
          >
            OPEN
          </button>
          <button
            type="button"
            className="bookmark-link-preview-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      </header>

      <div className="bookmark-link-preview-frame-wrap">
        {!iframeLoaded && (
          <div className="bookmark-link-preview-loading" aria-hidden="true">
            Loading preview…
          </div>
        )}
        <iframe
          key={iframeSrc}
          title={displayTitle}
          className={`bookmark-link-preview-iframe ${iframeLoaded ? 'is-loaded' : ''}`}
          src={iframeSrc}
          onLoad={() => setIframeLoaded(true)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="bookmark-link-preview-footnote">
        Some sites block embedded previews. Use OPEN if the page stays blank.
      </p>
    </div>,
    root,
  );
};

export default LinkPreviewPopover;
