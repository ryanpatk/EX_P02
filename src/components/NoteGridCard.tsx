import { useMemo } from 'react';
import { NoteWithTags } from '../types/database';
import { markdownExcerpt, noteDisplayTitle } from '../utils/markdown';
import { mergeTags } from '../utils/streamItems';
import StreamCard from './StreamCard';
import { NoteGlyph } from './StreamGlyphs';

interface NoteGridCardProps {
  note: NoteWithTags;
  onOpen: (note: NoteWithTags) => void;
  onDelete?: (noteId: string) => void;
  hideActions?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (noteId: string) => void;
}

/** Note as a stream card: note glyph, title, excerpt, tags. */
const NoteGridCard = ({
  note,
  onOpen,
  onDelete,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: NoteGridCardProps) => {
  const tags = useMemo(() => mergeTags(note.note_tags, note.tags), [note]);
  const title = noteDisplayTitle(note);
  const excerpt = useMemo(() => markdownExcerpt(note.body, 160), [note.body]);

  const activate = () => {
    if (selectionMode) {
      onToggleSelect?.(note.id);
      return;
    }
    onOpen(note);
  };

  return (
    <StreamCard
      type="note"
      isNew={note.id.startsWith('temp-')}
      leading={<NoteGlyph />}
      title={title}
      excerpt={excerpt || undefined}
      tags={tags}
      onActivate={activate}
      isSelected={isSelected}
      selectionMode={selectionMode}
      actions={
        !hideActions && onDelete ? (
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
        ) : undefined
      }
    />
  );
};

export default NoteGridCard;
