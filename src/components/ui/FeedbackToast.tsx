import type { AnimationEvent } from 'react';

export type FeedbackToastPhase = 'entering' | 'exiting';

interface FeedbackToastProps {
  message: string;
  phase: FeedbackToastPhase;
  onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
}

/**
 * Bottom-right feedback toast. Presentational only — the caller owns timing
 * and phase transitions (see useFeedbackToast).
 */
const FeedbackToast = ({ message, phase, onAnimationEnd }: FeedbackToastProps) => (
  <div
    className={`bookmark-bulk-feedback is-${phase}`}
    role="status"
    aria-live="polite"
    onAnimationEnd={onAnimationEnd}
  >
    <span className="bookmark-bulk-feedback-mark" aria-hidden="true">
      OK
    </span>
    <span className="bookmark-bulk-feedback-text">{message}</span>
  </div>
);

export default FeedbackToast;
