/**
 * Repaint the favicon squircle with the current canvas theme: the same
 * top→base vertical gradient as the app background, inside the brand-bubble
 * silhouette from public/favicon.svg. Rendered as an inline data: URI on the
 * SVG icon link, so it updates instantly with no network fetch.
 *
 * Safari ignores runtime favicon swaps and keeps the static neutral icon —
 * that is expected and fine (progressive nicety).
 */
/** Keep the browser UI (mobile address bar, PWA chrome) matching the canvas. */
export function updateThemeColorMeta(baseColor: string): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = baseColor;
}

export function updateThemedFavicon(
  topColor: string,
  baseColor: string,
  darkMode: boolean,
): void {
  if (typeof document === 'undefined') return;

  const stroke = darkMode ? '#ffffff' : '#62667a';
  const strokeOpacity = darkMode ? 0.34 : 0.42;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${topColor}"/>` +
    `<stop offset="0.95" stop-color="${baseColor}"/>` +
    `<stop offset="1" stop-color="${baseColor}"/>` +
    `</linearGradient></defs>` +
    `<rect x="3.5" y="3.5" width="57" height="57" rx="13.5" fill="url(#g)" ` +
    `stroke="${stroke}" stroke-opacity="${strokeOpacity}" stroke-width="3"/>` +
    `</svg>`;

  // Chrome picks ONE icon among all declared links and ignores href changes
  // on the others — so drop every static rel="icon" (ico + pngs included)
  // and insert a single fresh link node per update. apple-touch-icon and the
  // manifest icons are untouched.
  document
    .querySelectorAll('link[rel="icon"]')
    .forEach((el) => el.parentElement?.removeChild(el));

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  document.head.appendChild(link);
}
