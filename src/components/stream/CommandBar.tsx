import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { CornerDownLeft, Search, X } from 'lucide-react';

export interface CommandCreateAction {
  key: string;
  label: ReactNode;
  icon: ReactNode;
  /** Keyboard hint shown on the row, e.g. "⌘↵". */
  hint: string;
  pending?: boolean;
  onRun: () => void;
}

export interface CommandResult {
  key: string;
  icon: ReactNode;
  title: string;
  meta?: string;
  onRun: () => void;
}

export interface CommandResultGroup {
  key: string;
  label: string;
  total: number;
  results: CommandResult[];
  onSeeAll?: () => void;
}

interface CommandBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  createActions: CommandCreateAction[];
  groups: CommandResultGroup[];
  /** True when the input is a URL — the create row (Add link) is the default. */
  preferCreate?: boolean;
}

type Row =
  | { kind: 'create'; id: string; action: CommandCreateAction }
  | { kind: 'result'; id: string; result: CommandResult };

/**
 * Search-first command bar (4A). Typing filters the stream live and opens a
 * palette: explicit create rows on top (⌘↵ note, ⇧⌘↵ task, or Add link for a
 * URL), then matches across every type. Enter runs the highlighted row; the
 * highlight starts on the first match, so Enter never creates by accident.
 */
const CommandBar = ({
  value,
  onChange,
  placeholder,
  createActions,
  groups,
  preferCreate = false,
}: CommandBarProps) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = createActions.map((action) => ({
      kind: 'create',
      id: `create-${action.key}`,
      action,
    }));
    groups.forEach((group) =>
      group.results.forEach((result) =>
        list.push({ kind: 'result', id: `result-${group.key}-${result.key}`, result }),
      ),
    );
    return list;
  }, [createActions, groups]);

  const firstResultIndex = rows.findIndex((row) => row.kind === 'result');
  const defaultIndex = preferCreate || firstResultIndex === -1 ? 0 : firstResultIndex;

  // Reset the highlight whenever the query (and so the rows) change
  useEffect(() => {
    setActive(defaultIndex);
  }, [value, defaultIndex]);

  const showPalette = open && value.trim().length > 0 && rows.length > 0;

  // Close when focus/pointer leaves the bar
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  // "/" focuses search from anywhere outside a text field
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = (row: Row | undefined) => {
    if (!row) return;
    if (row.kind === 'create') {
      if (row.action.pending) return;
      row.action.onRun();
    } else {
      row.result.onRun();
    }
    setOpen(false);
  };

  const runCreate = (key: string) => {
    const action = createActions.find((a) => a.key === key) ?? createActions[0];
    if (action && !action.pending) {
      action.onRun();
      setOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (rows.length ? (index + 1) % rows.length : 0));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (rows.length ? (index - 1 + rows.length) % rows.length : 0));
      return;
    }
    if (event.key === 'Enter') {
      if (!value.trim()) return;
      event.preventDefault();
      if (event.metaKey || event.ctrlKey) {
        runCreate(event.shiftKey ? 'task' : preferCreate ? 'link' : 'note');
        return;
      }
      run(rows[active]);
      return;
    }
    if (event.key === 'Escape') {
      if (showPalette) {
        event.preventDefault();
        setOpen(false);
      } else if (value) {
        event.preventDefault();
        onChange('');
      } else {
        inputRef.current?.blur();
      }
    }
  };

  let rowIndex = -1;
  const renderRow = (row: Row) => {
    rowIndex += 1;
    const index = rowIndex;
    const isActive = index === active;
    const common = {
      id: `${listId}-${row.id}`,
      role: 'option' as const,
      'aria-selected': isActive,
      className: `memex-palette-row${isActive ? ' is-active' : ''}${
        row.kind === 'create' ? ' is-create' : ''
      }`,
      onMouseMove: () => setActive(index),
      onMouseDown: (event: ReactMouseEvent) => event.preventDefault(),
      onClick: () => run(row),
    };
    if (row.kind === 'create') {
      return (
        <div key={row.id} {...common}>
          <span className="memex-palette-icon">{row.action.icon}</span>
          <span className="memex-palette-text">
            {row.action.pending ? 'Adding…' : row.action.label}
          </span>
          <kbd className="memex-kbd">{row.action.hint}</kbd>
        </div>
      );
    }
    return (
      <div key={row.id} {...common}>
        <span className="memex-palette-icon">{row.result.icon}</span>
        <span className="memex-palette-text">{row.result.title}</span>
        {row.result.meta && <span className="memex-palette-meta">{row.result.meta}</span>}
      </div>
    );
  };

  const activeRow = rows[active];

  return (
    <div className="memex-command" ref={rootRef}>
      <div className="memex-command-field">
        <Search aria-hidden="true" className="memex-command-icon" />
        <input
          ref={inputRef}
          className="memex-command-input"
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search or capture"
          role="combobox"
          aria-expanded={showPalette}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPalette && activeRow ? `${listId}-${activeRow.id}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {value ? (
          <button
            type="button"
            className="memex-command-clear"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <kbd className="memex-kbd memex-command-shortcut" aria-hidden="true">
            /
          </kbd>
        )}
      </div>

      {showPalette && (
        <div className="memex-palette" id={listId} role="listbox" aria-label="Results">
          {rows
            .filter((row) => row.kind === 'create')
            .map((row) => renderRow(row))}
          {groups.map((group) =>
            group.results.length === 0 ? null : (
              <div key={group.key} className="memex-palette-group" role="group" aria-label={group.label}>
                <div className="memex-palette-label">
                  <span>{group.label}</span>
                  <span className="memex-palette-count">{group.total}</span>
                  {group.onSeeAll && group.total > group.results.length && (
                    <button
                      type="button"
                      className="memex-palette-more"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        group.onSeeAll?.();
                        setOpen(false);
                      }}
                    >
                      See all
                    </button>
                  )}
                </div>
                {rows
                  .filter((row) => row.kind === 'result' && row.id.startsWith(`result-${group.key}-`))
                  .map((row) => renderRow(row))}
              </div>
            ),
          )}
          {firstResultIndex === -1 && (
            <p className="memex-palette-empty">No matches — create it instead.</p>
          )}
          <div className="memex-palette-foot" aria-hidden="true">
            <span>
              <CornerDownLeft /> open
            </span>
            <span>↑↓ move</span>
            <span>{preferCreate ? '⌘↵ add link' : '⌘↵ note · ⇧⌘↵ task'}</span>
            <span>esc close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandBar;
