import { useCallback, useEffect, useState } from 'react';

/**
 * Link preview card captions (title + host over the image):
 * - 'hover'  — image-first; the frosted caption slides up on hover/focus (7C)
 * - 'always' — the frosted caption is always overlaid (7A)
 * Touch devices always show captions. Flip the default here, or per user in
 * Settings → “Link titles”.
 */
export type LinkCaptionMode = 'hover' | 'always';

export const DEFAULT_LINK_CAPTION_MODE: LinkCaptionMode = 'hover';

const STORAGE_KEY = 'memex.link-captions';
const EVENT = 'memex:link-captions';

export const getLinkCaptionMode = (): LinkCaptionMode => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'hover' || stored === 'always') return stored;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LINK_CAPTION_MODE;
};

const apply = (mode: LinkCaptionMode) => {
  document.documentElement.dataset.linkCaptions = mode;
};

export const initLinkCaptions = () => apply(getLinkCaptionMode());

export const setLinkCaptionMode = (mode: LinkCaptionMode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
  apply(mode);
  window.dispatchEvent(new Event(EVENT));
};

export const useLinkCaptionMode = () => {
  const [mode, setMode] = useState<LinkCaptionMode>(getLinkCaptionMode);
  useEffect(() => {
    const sync = () => setMode(getLinkCaptionMode());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const update = useCallback((next: LinkCaptionMode) => setLinkCaptionMode(next), []);
  return [mode, update] as const;
};
