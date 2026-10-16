import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Tag, NoteWithTags } from '../types/database';
import { markdownExcerpt, noteDisplayTitle } from '../utils/markdown';

interface NoteListRowProps {
  note: NoteWithTags;
  onOpen: (note: NoteWithTags) => void;
  onDelete: (noteId: string) => void;
  hideActions?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (noteId: string) => void;
}

const getTagsForNote = (note: NoteWithTags): Tag[] => {
  if (note.tags && note.tags.length > 0) {
    return note.tags;
  }
  const map = new Map<string, Tag>();
  (note.note_tags ?? []).forEach((noteTag) => {
    if (noteTag.tag) {
      map.set(noteTag.tag.id, noteTag.tag);
    }
  });
  return Array.from(map.values());
};

const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

const NoteListRow = ({
  note,
  onOpen,
  onDelete,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: NoteListRowProps) => {
  const tags = useMemo(() => getTagsForNote(note), [note]);
  const title = noteDisplayTitle(note);
  const excerpt = useMemo(() => markdownExcerpt(note.body), [note.body]);

  const activate = () => {
    if (selectionMode) {
      onToggleSelect?.(note.id);
      return;
    }
    onOpen(note);
  };

  return (
    <article
      className={`memex-note-row${isSelected ? ' is-selected' : ''}${
        selectionMode ? ' is-selection-mode' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={selectionMode ? isSelected : undefined}
      onClick={activate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate();
        }
      }}
    >
      <div className="memex-note-row-body">
        <p className="memex-note-row-title" title={title}>
          {title}
        </p>
        {excerpt && <p className="memex-note-row-excerpt">{excerpt}</p>}
        <div className="memex-note-row-meta">
          <span className="memex-note-row-time">{relativeTime(note.updated_at)}</span>
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="bookmark-list-row-tag"
              style={tag.color ? ({ '--edge': tag.color, color: tag.color } as CSSProperties) : undefined}
              title={tag.name}
            >
              {tag.name}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="bookmark-list-row-tag is-more">+{tags.length - 3}</span>
          )}
        </div>
      </div>

      {!hideActions && (
      <div className="memex-note-row-actions">
        <button
          type="button"
          className="bookmark-list-row-action"
          onClick={(event) => {
            event.stopPropagation();
            if (
              !window.confirm('Delete this note permanently? This cannot be undone.')
            ) {
              return;
            }
            onDelete(note.id);
          }}
          aria-label={`Delete “${title}”`}
          title="Delete note"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8" />
            <path d="M12 4 4 12" />
          </svg>
        </button>
      </div>
      )}
    </article>
  );
};

export default NoteListRow;
