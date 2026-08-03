import { useRef } from 'react';

export interface OmnibarAction {
  label: string;
  pendingLabel?: string;
  show: boolean;
  pending?: boolean;
  disabled?: boolean;
  onRun: () => void | Promise<void>;
}

interface OmnibarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  action?: OmnibarAction;
  /** Trailing controls rendered at the right end of the bar (e.g. a view toggle). */
  trailing?: React.ReactNode;
}

/**
 * The module search + capture bar: a tall single-row input at the top of the
 * frosted stack, with an optional prominent capture action ("Add bookmark",
 * "New task", …). Enter triggers the action when it is shown and runnable.
 * A clear (×) control appears at the right edge whenever there is input.
 */
const Omnibar = ({ value, onChange, placeholder, ariaLabel, action, trailing }: OmnibarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canRun = !!action && action.show && !action.disabled && !action.pending;

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const runAction = () => {
    if (!canRun) return;
    void action.onRun();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (canRun) {
      event.preventDefault();
      runAction();
    }
  };

  return (
    <div className="bookmark-omnibar">
      <div
        className={`bookmark-omnibar-row${action?.show ? ' bookmark-omnibar-row--with-add' : ''}`}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bookmark-omnibar-input"
          autoComplete="off"
          spellCheck={false}
          aria-label={ariaLabel ?? placeholder}
        />
        {value.length > 0 && (
          <button
            type="button"
            className="memex-omnibar-clear"
            onClick={clear}
            aria-label="Clear search"
            title="Clear"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4.5 4.5l7 7" />
              <path d="M11.5 4.5l-7 7" />
            </svg>
          </button>
        )}
        {action?.show && (
          <button
            type="button"
            className="bookmark-omnibar-add"
            onClick={runAction}
            disabled={action.disabled || action.pending}
          >
            {action.pending ? action.pendingLabel ?? action.label : action.label}
          </button>
        )}
        {trailing}
      </div>
    </div>
  );
};

export default Omnibar;
