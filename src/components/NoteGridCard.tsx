import { useMemo } from 'react';
import { NoteWithTags } from '../types/database';
import { markdownExcerpt, noteDisplayTitle } from '../utils/markdown';
import { mergeTags } from '../utils/streamItems';
import { noteAsUrl } from '../utils/urlInput';
import StreamCard from './StreamCard';
import { NoteGlyph } from './StreamGlyphs';

interface NoteGridCardProps {
  note: NoteWithTags;
  onOpen: (note: NoteWithTags) => void;
  onDelete?: (noteId: string) => void;
  /** Shown only when the note is a lone URL; receives the normalized URL. */
  onConvertToLink?: (note: NoteWithTags, url: string) => void;
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
  onConvertToLink,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: NoteGridCardProps) => {
  const tags = useMemo(() => mergeTags(note.note_tags, note.tags), [note]);
  const title = noteDisplayTitle(note);
  const excerpt = useMemo(() => markdownExcerpt(note.body, 160), [note.body]);
  const convertibleUrl = useMemo(() => noteAsUrl(note), [note]);
  const showConvert =
    !hideActions && Boolean(onConvertToLink) && convertibleUrl !== '' && !note.id.startsWith('temp-');

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
        !hideActions && (onDelete || showConvert) ? (
          <>
            {showConvert && (
              <button
                type="button"
                className="bookmark-list-row-action"
                onClick={(event) => {
                  event.stopPropagation();
                  onConvertToLink?.(note, convertibleUrl);
                }}
                aria-label={`Convert “${title}” to a link`}
                title="Convert to link"
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6.75 9.25a2.5 2.5 0 0 0 3.54 0l2-2a2.5 2.5 0 0 0-3.54-3.54l-.75.75" />
                  <path d="M9.25 6.75a2.5 2.5 0 0 0-3.54 0l-2 2a2.5 2.5 0 0 0 3.54 3.54l.75-.75" />
                </svg>
              </button>
            )}
            {onDelete && (
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
            )}
          </>
        ) : undefined
      }
    />
  );
};

export default NoteGridCard;
