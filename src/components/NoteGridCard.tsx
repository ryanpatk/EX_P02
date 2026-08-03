import { useMemo } from 'react';
import { NoteWithTags, Tag } from '../types/database';
import { markdownExcerpt, noteDisplayTitle } from '../utils/markdown';

interface NoteGridCardProps {
  note: NoteWithTags;
  onOpen: (note: NoteWithTags) => void;
  onDelete?: (noteId: string) => void;
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

const NoteGridCard = ({
  note,
  onOpen,
  onDelete,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: NoteGridCardProps) => {
  const tags = useMemo(() => getTagsForNote(note), [note]);
  const title = noteDisplayTitle(note);
  const excerpt = useMemo(() => markdownExcerpt(note.body, 220), [note.body]);

  const activate = () => {
    if (selectionMode) {
      onToggleSelect?.(note.id);
      return;
    }
    onOpen(note);
  };

  return (
    <article
      className={`memex-card memex-card--note${isSelected ? ' is-selected' : ''}${
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
      <p className="memex-card-title" title={title}>
        {title}
      </p>

      {excerpt && <p className="memex-card-excerpt">{excerpt}</p>}

      <div className="memex-card-footer">
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="bookmark-list-row-tag"
            style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
            title={tag.name}
          >
            {tag.name}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="bookmark-list-row-tag is-more">+{tags.length - 3}</span>
        )}
      </div>

      {!hideActions && onDelete && (
        <div className="memex-card-actions">
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

export default NoteGridCard;
