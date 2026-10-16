import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Square,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { useCreateSelfMessage, useSelfMessages } from '../../hooks/useSelfMessages';
import type { SelfMessage, TaskWithTags } from '../../types/database';
import { getLinkTitle } from '../../utils/linkDisplay';
import { noteDisplayTitle } from '../../utils/markdown';
import type { StreamItem } from '../../utils/streamItems';
import { cue } from '../../utils/sound';
import { dayKeyOf, fromDayKey, shiftDay, toDayKey } from '../../utils/timeGroups';

const MAX_COMPOSER_ROWS = 6;
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;"')\]!?])/gi;

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const weekdayNarrow = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });

/** Plain text with bare URLs turned into links. */
const Linkified = ({ text }: { text: string }) => (
  <>
    {text.split(URL_PATTERN).map((part, index) => {
      if (index % 2 === 1) {
        const href = part.startsWith('www.') ? `https://${part}` : part;
        return (
          <a key={index} href={href} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    })}
  </>
);

const createdAtOf = (item: StreamItem) => {
  if (item.type === 'link') return item.link.created_at;
  if (item.type === 'note') return item.note.created_at;
  return item.task.created_at;
};

interface TodayPanelProps {
  /** Space id, or null for Home. */
  scopeId: string | null;
  scopeName: string;
  /** The day being viewed (YYYY-MM-DD). */
  day: string;
  onChangeDay: (day: string) => void;
  /** Stream items in the current scope (for captured / completed / open tasks). */
  items: StreamItem[];
  /** Jot ids hidden while their delete can still be undone. */
  hiddenJotIds: Set<string>;
  onOpenItem: (item: StreamItem) => void;
  onToggleTask: (task: TaskWithTags) => void;
  onConvertJot: (jot: SelfMessage, kind: 'note' | 'task') => void;
  onDeleteJot: (jot: SelfMessage) => void;
  onClose: () => void;
}

/**
 * The Today column (8D): a daily log for the current scope. Jots (formerly
 * Notes to Self) sit beside what you captured and finished that day, with
 * open tasks on today. Any day is reachable — arrows, the week strip, or the
 * date picker — and the viewed day lives in the URL (?day=).
 */
const TodayPanel = ({
  scopeId,
  scopeName,
  day,
  onChangeDay,
  items,
  hiddenJotIds,
  onOpenItem,
  onToggleTask,
  onConvertJot,
  onDeleteJot,
  onClose,
}: TodayPanelProps) => {
  const { messages, isLoading } = useSelfMessages(scopeId);
  const createMessage = useCreateSelfMessage();
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayKey = toDayKey(new Date());
  const isToday = day === todayKey;
  const viewed = fromDayKey(day);

  const jots = useMemo(() => messages.filter((m) => !hiddenJotIds.has(m.id)), [hiddenJotIds, messages]);

  // Days with any activity, for the week strip dots
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    jots.forEach((jot) => set.add(dayKeyOf(jot.created_at)));
    items.forEach((item) => set.add(dayKeyOf(createdAtOf(item))));
    return set;
  }, [items, jots]);

  const dayJots = useMemo(
    () => jots.filter((jot) => dayKeyOf(jot.created_at) === day).reverse(),
    [day, jots],
  );
  const captured = useMemo(
    () =>
      items
        .filter((item) => dayKeyOf(createdAtOf(item)) === day)
        .sort((a, b) => createdAtOf(b).localeCompare(createdAtOf(a))),
    [day, items],
  );
  const completed = useMemo(
    () =>
      items.filter(
        (item): item is Extract<StreamItem, { type: 'task' }> =>
          item.type === 'task' && item.task.is_done && dayKeyOf(item.task.updated_at) === day,
      ),
    [day, items],
  );
  const openTasks = useMemo(
    () =>
      isToday
        ? items.filter(
            (item): item is Extract<StreamItem, { type: 'task' }> =>
              item.type === 'task' && !item.task.is_done,
          )
        : [],
    [isToday, items],
  );

  // Week strip: the Monday-start week containing the viewed day
  const week = useMemo(() => {
    const start = fromDayKey(day);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [day]);

  // Focus the composer when landing on today
  useEffect(() => {
    if (isToday) requestAnimationFrame(() => textareaRef.current?.focus());
  }, [isToday, scopeId]);

  // Auto-grow the composer
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = lineHeight * MAX_COMPOSER_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [draft]);

  const send = () => {
    const body = draft.trim();
    if (!body || createMessage.isPending) return;
    setDraft('');
    cue('confirm');
    createMessage.mutate(
      { body, profile_id: scopeId },
      {
        onError: () => {
          cue('error');
          setDraft(body);
        },
      },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    send();
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  const itemIcon = (item: StreamItem) => {
    if (item.type === 'link') {
      return item.link.favicon_url ? (
        <img src={item.link.favicon_url} alt="" />
      ) : (
        <LinkIcon aria-hidden="true" />
      );
    }
    if (item.type === 'note') return <StickyNote aria-hidden="true" />;
    return item.task.is_done ? <Check aria-hidden="true" /> : <Square aria-hidden="true" />;
  };

  const itemTitle = (item: StreamItem) =>
    item.type === 'link'
      ? getLinkTitle(item.link)
      : item.type === 'note'
        ? noteDisplayTitle(item.note)
        : item.task.title;

  const nothing =
    !isLoading && dayJots.length === 0 && captured.length === 0 && completed.length === 0 && !isToday;

  return (
    <section className="memex-today" aria-label={`${isToday ? 'Today' : dateFormat.format(viewed)} · ${scopeName}`}>
      <header className="memex-today-head">
        <div className="memex-today-title-row">
          <div className="memex-today-title">
            <h2>{isToday ? 'Today' : weekdayFormat.format(viewed)}</h2>
            <button
              type="button"
              className="memex-today-date"
              onClick={openDatePicker}
              title="Pick a day"
            >
              <CalendarDays aria-hidden="true" />
              {dateFormat.format(viewed)}
            </button>
            <input
              ref={dateInputRef}
              className="memex-today-date-input"
              type="date"
              value={day}
              max={todayKey}
              onChange={(event) => event.target.value && onChangeDay(event.target.value)}
              tabIndex={-1}
              aria-label="Go to date"
            />
          </div>
          <div className="memex-today-nav">
            {!isToday && (
              <button type="button" className="memex-today-jump" onClick={() => onChangeDay(todayKey)}>
                Today
              </button>
            )}
            <button
              type="button"
              className="memex-icon-button"
              onClick={() => onChangeDay(shiftDay(day, -1))}
              aria-label="Previous day"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="memex-icon-button"
              onClick={() => onChangeDay(shiftDay(day, 1))}
              disabled={isToday}
              aria-label="Next day"
            >
              <ChevronRight aria-hidden="true" />
            </button>
            <button type="button" className="memex-icon-button" onClick={onClose} aria-label="Close Today">
              <X aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="memex-today-week" role="group" aria-label="Week">
          {week.map((date) => {
            const key = toDayKey(date);
            const future = key > todayKey;
            return (
              <button
                key={key}
                type="button"
                className={`memex-today-weekday${key === day ? ' is-selected' : ''}${
                  key === todayKey ? ' is-today' : ''
                }`}
                onClick={() => onChangeDay(key)}
                disabled={future}
                aria-pressed={key === day}
                aria-label={`${weekdayFormat.format(date)}, ${dateFormat.format(date)}${
                  activeDays.has(key) ? ' — has activity' : ''
                }`}
              >
                <span className="memex-today-weekday-letter" aria-hidden="true">
                  {weekdayNarrow.format(date)}
                </span>
                <span className="memex-today-weekday-num" aria-hidden="true">
                  {date.getDate()}
                </span>
                <span
                  className={`memex-today-weekday-dot${activeDays.has(key) ? ' is-on' : ''}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </header>

      <div className="memex-today-body">
        {isToday && (
          <div className="memex-today-composer">
            <textarea
              ref={textareaRef}
              className="memex-self-notes-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={scopeId ? `What's on your mind about ${scopeName}?` : "What's on your mind?"}
              rows={1}
              aria-label="Jot something"
            />
            <span className="memex-today-composer-hint" aria-hidden="true">
              ↵ to jot · ⇧↵ new line
            </span>
          </div>
        )}

        {(dayJots.length > 0 || isToday) && (
          <div className="memex-today-section">
            <h3 className="memex-today-label">
              Jots <span className="memex-today-count">{dayJots.length}</span>
            </h3>
            {isLoading ? (
              <p className="memex-today-empty">Loading…</p>
            ) : dayJots.length === 0 ? (
              <p className="memex-today-empty">Nothing jotted yet today.</p>
            ) : (
              <ul className="memex-jots">
                {dayJots.map((jot) => (
                  <li key={jot.id} className={`memex-jot${jot.id.startsWith('temp-') ? ' is-new' : ''}`}>
                    <time className="memex-jot-time" dateTime={jot.created_at}>
                      {timeFormat.format(new Date(jot.created_at))}
                    </time>
                    <p className="memex-jot-body">
                      <Linkified text={jot.body} />
                    </p>
                    {!jot.id.startsWith('temp-') && (
                      <span className="memex-jot-actions">
                        <button
                          type="button"
                          className="memex-jot-action"
                          onClick={() => onConvertJot(jot, 'note')}
                          title="Turn into a note"
                        >
                          <StickyNote aria-hidden="true" /> Note
                        </button>
                        <button
                          type="button"
                          className="memex-jot-action"
                          onClick={() => onConvertJot(jot, 'task')}
                          title="Turn into a task"
                        >
                          <Square aria-hidden="true" /> Task
                        </button>
                        <button
                          type="button"
                          className="memex-jot-action is-icon"
                          onClick={() => onDeleteJot(jot)}
                          aria-label="Delete jot"
                          title="Delete"
                        >
                          <Trash2 aria-hidden="true" />
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {captured.length > 0 && (
          <div className="memex-today-section">
            <h3 className="memex-today-label">
              Captured <span className="memex-today-count">{captured.length}</span>
            </h3>
            <ul className="memex-today-items">
              {captured.slice(0, 12).map((item) => (
                <li key={item.key}>
                  <button type="button" className="memex-today-item" onClick={() => onOpenItem(item)}>
                    <span className="memex-today-item-icon">{itemIcon(item)}</span>
                    <span className="memex-today-item-title">{itemTitle(item)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {captured.length > 12 && (
              <p className="memex-today-more">+{captured.length - 12} more</p>
            )}
          </div>
        )}

        {completed.length > 0 && (
          <div className="memex-today-section">
            <h3 className="memex-today-label">
              Completed <span className="memex-today-count">{completed.length}</span>
            </h3>
            <ul className="memex-today-items">
              {completed.map((item) => (
                <li key={item.key} className="memex-today-item is-done">
                  <span className="memex-today-item-icon">
                    <Check aria-hidden="true" />
                  </span>
                  <span className="memex-today-item-title">{item.task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {openTasks.length > 0 && (
          <div className="memex-today-section">
            <h3 className="memex-today-label">
              Open tasks <span className="memex-today-count">{openTasks.length}</span>
            </h3>
            <ul className="memex-today-items">
              {openTasks.map((item) => (
                <li key={item.key} className="memex-today-task">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={false}
                    className="memex-task-check"
                    onClick={() => onToggleTask(item.task)}
                    aria-label={`Mark “${item.task.title}” done`}
                  >
                    <Check aria-hidden="true" />
                  </button>
                  <span className="memex-today-item-title">{item.task.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {nothing && <p className="memex-today-empty is-day">Nothing happened on this day.</p>}
      </div>
    </section>
  );
};

export default TodayPanel;
