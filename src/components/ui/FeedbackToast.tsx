import type { AnimationEvent } from 'react';

export type FeedbackToastPhase = 'entering' | 'exiting';

interface FeedbackToastProps {
  message: string;
  phase: FeedbackToastPhase;
  onAnimationEnd?: (event: AnimationEvent<HTMLDivElement>) => void;
  /** Optional inline action, e.g. Undo after a delete. */
  action?: { label: string; onClick: () => void };
}

/**
 * Bottom-right feedback toast. Presentational only — the caller owns timing
 * and phase transitions (see useFeedbackToast).
 */
const FeedbackToast = ({ message, phase, onAnimationEnd, action }: FeedbackToastProps) => (
  <div
    className={`bookmark-bulk-feedback is-${phase}${action ? ' has-action' : ''}`}
    role="status"
    aria-live="polite"
    onAnimationEnd={onAnimationEnd}
  >
    <span className="bookmark-bulk-feedback-mark" aria-hidden="true">
      OK
    </span>
    <span className="bookmark-bulk-feedback-text">{message}</span>
    {action && (
      <button type="button" className="bookmark-bulk-feedback-action" onClick={action.onClick}>
        {action.label}
      </button>
    )}
  </div>
);

export default FeedbackToast;
