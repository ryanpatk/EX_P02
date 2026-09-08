import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  useCreateSelfMessage,
  useDeleteSelfMessage,
  useSelfMessages,
} from '../hooks/useSelfMessages';
import type { SelfMessage } from '../types/database';
import { EmptyState, FrostedStack } from './ui';

interface NotesToSelfPanelProps {
  /** Space id, or null for the Home (general) feed. */
  scopeId: string | null;
  /** Display name of the scope ("Home" or the space's name). */
  scopeName: string;
  onClose: () => void;
}

const MAX_COMPOSER_ROWS = 6;

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?])/gi;

const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8" />
    <path d="M12 4 4 12" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2.75 8h9.5" />
    <path d="M8.75 4.5 12.25 8l-3.5 3.5" />
  </svg>
);

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const formatDay = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return 'Today';
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Plain text with bare URLs turned into links; everything else untouched. */
const Linkified = ({ text }: { text: string }) => {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a key={index} href={href} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
};

/**
 * "Notes to Self": a chat-style feed of short messages the user leaves for
 * themself, docked beside the stream. One feed per scope — Home has the
 * general feed, each space has its own. Newest last, composer at the bottom,
 * Enter sends (Shift+Enter for a new line).
 */
const NotesToSelfPanel = ({ scopeId, scopeName, onClose }: NotesToSelfPanelProps) => {
  const { messages, isLoading } = useSelfMessages(scopeId);
  const createMessage = useCreateSelfMessage();
  const deleteMessage = useDeleteSelfMessage();

  const [draft, setDraft] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The feed is a column-reverse scroller (newest first in the DOM), so the
  // browser anchors it to the newest message and keeps it there as messages
  // arrive. Switching scope just snaps back to that anchor.
  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTop = 0;
  }, [scopeId]);

  // Fresh scope → fresh draft, focus the composer
  useEffect(() => {
    setDraft('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [scopeId]);

  // Auto-grow the composer up to a few rows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = lineHeight * MAX_COMPOSER_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [draft]);

  const send = useCallback(() => {
    const body = draft.trim();
    if (!body || createMessage.isPending) return;
    setDraft('');
    createMessage.mutate(
      { body, profile_id: scopeId },
      {
        onError: () => setDraft(body),
      },
    );
  }, [createMessage, draft, scopeId]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return;
    if (event.shiftKey) return; // newline
    event.preventDefault();
    send();
  };

  const handleDelete = (message: SelfMessage) => {
    if (message.id.startsWith('temp-')) return;
    if (!window.confirm('Delete this note to self? This cannot be undone.')) return;
    deleteMessage.mutate(message.id);
  };

  // Group consecutive messages by day for a light divider. Groups and their
  // items are emitted newest-first because the feed renders column-reverse:
  // first in the DOM = bottom of the screen.
  const groupedReversed = useMemo(() => {
    const groups: { day: string; label: string; items: SelfMessage[] }[] = [];
    messages.forEach((message) => {
      const day = dayKey(message.created_at);
      const last = groups[groups.length - 1];
      if (last && last.day === day) {
        last.items.push(message);
      } else {
        groups.push({ day, label: formatDay(message.created_at), items: [message] });
      }
    });
    return groups.reverse().map((group) => ({ ...group, items: [...group.items].reverse() }));
  }, [messages]);

  const canSend = draft.trim().length > 0 && !createMessage.isPending;

  return (
    <FrostedStack className="memex-self-notes" aria-label={`Notes to Self · ${scopeName}`}>
      <div className="memex-self-notes-header">
        <div className="memex-self-notes-heading">
          <span className="memex-self-notes-title">Notes to Self</span>
          <span className="memex-self-notes-scope" title={scopeName}>
            {scopeName}
          </span>
        </div>
        <button
          type="button"
          className="memex-self-notes-close"
          onClick={onClose}
          aria-label="Close Notes to Self"
          title="Close"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="memex-self-notes-feed" ref={feedRef} role="log" aria-live="polite">
        {isLoading ? (
          <p className="memex-self-notes-status">Loading…</p>
        ) : messages.length === 0 ? (
          <EmptyState
            title="No notes to self yet"
            subtitle={
              scopeId
                ? `Anything you jot here stays with “${scopeName}”.`
                : 'A running thread for anything on your mind. Jot something below.'
            }
          />
        ) : (
          groupedReversed.map((group) => (
            <Fragment key={group.day}>
              {/* Items first, divider last: in column-reverse the divider lands above its day */}
              {group.items.map((message) => (
                <article
                  key={message.id}
                  className={`memex-self-note${
                    message.id.startsWith('temp-') ? ' is-pending' : ''
                  }`}
                >
                  <div className="memex-self-note-bubble">
                    <Linkified text={message.body} />
                  </div>
                  <div className="memex-self-note-meta">
                    <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                    <button
                      type="button"
                      className="memex-self-note-delete"
                      onClick={() => handleDelete(message)}
                      aria-label="Delete this note to self"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              <div className="memex-self-notes-day" aria-hidden="true">
                <span>{group.label}</span>
              </div>
            </Fragment>
          ))
        )}
      </div>

      <form
        className="memex-self-notes-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <textarea
          ref={textareaRef}
          className="memex-self-notes-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note to self…"
          aria-label={`New note to self in ${scopeName}`}
          rows={1}
          autoComplete="off"
        />
        <button
          type="submit"
          className="memex-self-notes-send"
          disabled={!canSend}
          aria-label="Send note to self"
          title="Send (Enter)"
        >
          <SendIcon />
        </button>
      </form>
    </FrostedStack>
  );
};

export default NotesToSelfPanel;
