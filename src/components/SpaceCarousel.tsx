import { useEffect, useRef, useState } from 'react';
import { Profile } from '../types/database';

interface SpaceCarouselProps {
  spaces: Profile[];
  selectedSpaceId: string | null;
  onSelect: (spaceId: string) => void;
  /** When true, the carousel shows the new-space input instead of the switcher. */
  isCreating: boolean;
  onCreate: (name: string) => Promise<void> | void;
  onCancelCreate: () => void;
  createPending?: boolean;
}

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M9.5 4 5.5 8l4 4" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6.5 4l4 4-4 4" />
  </svg>
);

/** Header-center space switcher: ← Space name → with wrap-around. */
const SpaceCarousel = ({
  spaces,
  selectedSpaceId,
  onSelect,
  isCreating,
  onCreate,
  onCancelCreate,
  createPending = false,
}: SpaceCarouselProps) => {
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) {
      setDraftName('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isCreating]);

  const submitCreate = async () => {
    const name = draftName.trim();
    if (!name || createPending) return;
    await onCreate(name);
  };

  if (isCreating) {
    return (
      <div className="memex-space-carousel">
        <input
          ref={inputRef}
          type="text"
          className="memex-space-carousel-input"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void submitCreate();
            }
            if (event.key === 'Escape') {
              onCancelCreate();
            }
          }}
          onBlur={onCancelCreate}
          placeholder="Space name…"
          aria-label="New space name"
          autoComplete="off"
          spellCheck={false}
          disabled={createPending}
        />
      </div>
    );
  }

  if (spaces.length === 0) {
    return <span className="memex-space-carousel-empty">No spaces yet</span>;
  }

  const index = Math.max(
    0,
    spaces.findIndex((space) => space.id === selectedSpaceId),
  );
  const current = spaces[index];

  const step = (delta: number) => {
    const next = (index + delta + spaces.length) % spaces.length;
    onSelect(spaces[next].id);
  };

  return (
    <div className="memex-space-carousel">
      <div className="memex-space-carousel-row">
        <button
          type="button"
          className="memex-space-carousel-arrow"
          onClick={() => step(-1)}
          disabled={spaces.length < 2}
          aria-label="Previous space"
        >
          <ChevronLeft />
        </button>

        <span className="memex-space-carousel-name" aria-live="polite" title={current?.name}>
          {current?.name}
        </span>

        <button
          type="button"
          className="memex-space-carousel-arrow"
          onClick={() => step(1)}
          disabled={spaces.length < 2}
          aria-label="Next space"
        >
          <ChevronRight />
        </button>
      </div>

      {spaces.length > 1 && (
        <div
          className="memex-space-carousel-dots"
          aria-label={`Space ${index + 1} of ${spaces.length}`}
        >
          {spaces.map((space, i) => (
            <span
              key={space.id}
              className={`memex-space-carousel-dot${i === index ? ' is-active' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpaceCarousel;
