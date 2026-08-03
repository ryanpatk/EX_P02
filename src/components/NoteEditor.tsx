import { useCallback, useEffect, useRef, useState } from 'react';
import { MarkdownText, MarkdownTextarea } from './ui';
import type { MarkdownTextareaHandle } from './ui/MarkdownTextarea';
import type { NoteWithTags, UpdateNoteData } from '../types/database';

type SaveStatus = 'saved' | 'saving';

const AUTOSAVE_DELAY_MS = 800;

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5 6.5 11.5 12.5 5" />
  </svg>
);

const SpinnerIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="memex-spinner">
    <circle cx="8" cy="8" r="5.5" opacity="0.25" />
    <path d="M13.5 8a5.5 5.5 0 0 0-5.5-5.5" />
  </svg>
);

interface NoteEditorProps {
  note: NoteWithTags;
  onBack: () => void;
  onSave: (id: string, updates: UpdateNoteData) => Promise<unknown>;
  onDelete: (id: string) => void;
}

const NoteEditor = ({ note, onBack, onSave, onDelete }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title ?? '');
  const [body, setBody] = useState(note.body);
  const [isEditing, setIsEditing] = useState(!note.body.trim());
  const [status, setStatus] = useState<SaveStatus>('saved');

  const lastSavedRef = useRef({ title: note.title ?? '', body: note.body });
  const draftRef = useRef({ title: note.title ?? '', body: note.body });
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef(note.id);
  const bodyRef = useRef<MarkdownTextareaHandle>(null);

  // Re-seed when switching to a different note
  useEffect(() => {
    if (noteIdRef.current === note.id) return;
    noteIdRef.current = note.id;
    setTitle(note.title ?? '');
    setBody(note.body);
    setIsEditing(!note.body.trim());
    setStatus('saved');
    lastSavedRef.current = { title: note.title ?? '', body: note.body };
    draftRef.current = { title: note.title ?? '', body: note.body };
  }, [note]);

  const persist = useCallback(() => {
    const noteId = noteIdRef.current;
    const draft = draftRef.current;
    const lastSaved = lastSavedRef.current;

    const updates: UpdateNoteData = {};
    if (draft.title !== lastSaved.title) {
      updates.title = draft.title.trim() === '' ? null : draft.title;
    }
    if (draft.body !== lastSaved.body) {
      updates.body = draft.body;
    }
    if (Object.keys(updates).length === 0) {
      setStatus('saved');
      return;
    }

    const saved = { ...draft };
    void onSave(noteId, updates)
      .then(() => {
        lastSavedRef.current = saved;
        // Only settle if nothing changed while the request was in flight
        if (
          draftRef.current.title === saved.title &&
          draftRef.current.body === saved.body
        ) {
          setStatus('saved');
        }
      })
      .catch((error) => {
        console.error('Failed to save note:', error);
      });
  }, [onSave]);

  const scheduleSave = useCallback(() => {
    setStatus('saving');
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      persist();
    }, AUTOSAVE_DELAY_MS);
  }, [persist]);

  const flush = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persist();
  }, [persist]);

  // Flush pending edits on unmount only — via a ref, so callback identity
  // changes across renders never trigger the cleanup mid-session
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => () => flushRef.current(), []);

  const handleTitleChange = (next: string) => {
    setTitle(next);
    draftRef.current = { ...draftRef.current, title: next };
    scheduleSave();
  };

  const handleBodyChange = (next: string) => {
    setBody(next);
    draftRef.current = { ...draftRef.current, body: next };
    scheduleSave();
  };

  const handleBack = () => {
    flush();
    onBack();
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this note permanently? This cannot be undone.')) {
      return;
    }
    // Neutralize any pending auto-save so it can't fire against the deleted note
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    lastSavedRef.current = { ...draftRef.current };
    onDelete(noteIdRef.current);
  };

  const startEditing = (event: React.MouseEvent<HTMLDivElement>) => {
    // Follow links normally, and don't hijack text-selection drags
    if ((event.target as HTMLElement).closest('a')) return;
    if (window.getSelection()?.toString()) return;
    setIsEditing(true);
  };

  // Focus the textarea (cursor at end) once it renders
  useEffect(() => {
    if (isEditing) {
      bodyRef.current?.focus();
    }
  }, [isEditing]);

  const handleBodyBlur = () => {
    // Keep empty notes in edit mode — there is nothing to render
    if (draftRef.current.body.trim()) {
      setIsEditing(false);
    }
  };

  const showEditor = isEditing || !body.trim();

  return (
    <div className="memex-note-editor">
      <div className="memex-note-editor-toolbar">
        <button type="button" className="bookmark-link-details-back" onClick={handleBack}>
          ← Back to notes
        </button>

        <span
          className="memex-note-editor-status"
          role="status"
          aria-label={status === 'saving' ? 'Saving' : 'Saved'}
          title={status === 'saving' ? 'Saving…' : 'Saved'}
        >
          {status === 'saving' ? <SpinnerIcon /> : <CheckIcon />}
        </span>

        <button
          type="button"
          className="memex-note-delete"
          onClick={handleDelete}
          aria-label="Delete note"
          title="Delete note"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 4.5h10" />
            <path d="M6.5 4.5V3.25a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V4.5" />
            <path d="M4.5 4.5 5.2 13a.75.75 0 0 0 .75.7h4.1a.75.75 0 0 0 .75-.7l.7-8.5" />
            <path d="M6.75 7v4.5" />
            <path d="M9.25 7v4.5" />
          </svg>
        </button>
      </div>

      <input
        type="text"
        className="memex-note-title-input"
        value={title}
        onChange={(event) => handleTitleChange(event.target.value)}
        placeholder="Untitled note"
        aria-label="Note title"
        autoComplete="off"
        spellCheck={false}
      />

      <div className="memex-note-editor-body">
        {showEditor ? (
          <MarkdownTextarea
            ref={bodyRef}
            value={body}
            onChange={handleBodyChange}
            onBlur={handleBodyBlur}
            placeholder={'Write in markdown…\n\n# Heading\n- list item\n**bold**, *italic*, `code`'}
            ariaLabel="Note body (markdown)"
            autoFocus={!note.body.trim()}
          />
        ) : (
          <div
            className="memex-note-reading"
            onClick={startEditing}
            role="button"
            tabIndex={0}
            aria-label="Note body — click to edit"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                setIsEditing(true);
              }
            }}
          >
            <MarkdownText>{body}</MarkdownText>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
