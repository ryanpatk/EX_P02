/**
 * The memex wordmark: Nunito Black in Joyful Systems blue with a white keyline,
 * a soft blue drop, and a split-gloss highlight on the upper half of each
 * letter (a duplicate layer with a white→clear gradient clipped to the glyphs).
 * Size comes from the parent's font-size. Styles: components.css → “Wordmark”.
 */
const Wordmark = ({ className }: { className?: string }) => (
  <span className={className ? `memex-wordmark ${className}` : 'memex-wordmark'} translate="no">
    memex
    <span className="memex-wordmark-gloss" aria-hidden="true">
      memex
    </span>
  </span>
);

export default Wordmark;
