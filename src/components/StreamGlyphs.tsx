/* Type glyphs for the stream card leading slot (notes, links). */

const GLYPH_PROPS = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export const NoteGlyph = () => (
  <svg {...GLYPH_PROPS} className="memex-card-glyph">
    <path d="M4 2.75h8a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75H4a.75.75 0 0 1-.75-.75v-9A.75.75 0 0 1 4 2.75Z" />
    <path d="M5.75 6h4.5" />
    <path d="M5.75 8.5h4.5" />
    <path d="M5.75 11h2.5" />
  </svg>
);

export const LinkGlyph = () => (
  <svg {...GLYPH_PROPS} className="memex-card-glyph">
    <path d="M6.75 9.25 9.25 6.75" />
    <path d="M7.5 4.75 8.9 3.35a2.3 2.3 0 0 1 3.25 3.25L10.75 8" />
    <path d="M8.5 11.25 7.1 12.65a2.3 2.3 0 0 1-3.25-3.25L5.25 8" />
  </svg>
);
