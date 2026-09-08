import { useRef } from 'react';

export interface OmnibarAction {
  label: string;
  pendingLabel?: string;
  show: boolean;
  pending?: boolean;
  disabled?: boolean;
  /** Visual weight; the first shown action defaults to primary. */
  variant?: 'primary' | 'secondary';
  onRun: () => void | Promise<void>;
}

interface OmnibarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Single capture action (kept for existing callers). */
  action?: OmnibarAction;
  /** Several capture actions ("Add link" / "New note" / "New task"). Enter runs the first runnable one. */
  actions?: OmnibarAction[];
  /** Trailing controls rendered at the right end of the bar. */
  trailing?: React.ReactNode;
}

/**
 * The stream search + capture bar: a tall single-row input at the top of the
 * frosted stack, with optional prominent capture actions. Enter triggers the
 * first runnable action. A clear (×) control appears whenever there is input.
 */
const Omnibar = ({
  value,
  onChange,
  placeholder,
  ariaLabel,
  action,
  actions,
  trailing,
}: OmnibarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const allActions = (actions ?? (action ? [action] : [])).filter((a) => a.show);
  const isRunnable = (a: OmnibarAction) => !a.disabled && !a.pending;
  const primary = allActions.find(isRunnable);

  const clear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (primary) {
      event.preventDefault();
      void primary.onRun();
    }
  };

  return (
    <div className="bookmark-omnibar">
      <div
        className={`bookmark-omnibar-row${allActions.length > 0 ? ' bookmark-omnibar-row--with-add' : ''}`}
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
        {allActions.map((a, index) => {
          const variant = a.variant ?? (index === 0 ? 'primary' : 'secondary');
          return (
            <button
              key={a.label}
              type="button"
              className={`bookmark-omnibar-add${variant === 'secondary' ? ' is-secondary' : ''}`}
              onClick={() => void a.onRun()}
              disabled={a.disabled || a.pending}
            >
              {a.pending ? a.pendingLabel ?? a.label : a.label}
            </button>
          );
        })}
        {trailing}
      </div>
    </div>
  );
};

export default Omnibar;
