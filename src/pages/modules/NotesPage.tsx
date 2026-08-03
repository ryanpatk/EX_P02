import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppHeader from '../../components/AppHeader';
import NoteEditor from '../../components/NoteEditor';
import NoteGridCard from '../../components/NoteGridCard';
import NoteListRow from '../../components/NoteListRow';
import ProfileFilterBar from '../../components/ProfileFilterBar';
import TagFilterBar from '../../components/TagFilterBar';
import { EmptyState, FrostedStack, Omnibar, ViewToggleFab } from '../../components/ui';
import { useSession } from '../../context/SessionContext';
import { useViewMode } from '../../hooks/useViewMode';
import { useProfiles } from '../../hooks/useProfiles';
import { useTags } from '../../hooks/useTags';
import {
  useAllNotes,
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from '../../hooks/useNotes';
import { useSetNoteTags } from '../../hooks/useNoteTags';
import {
  useAddNotesToProfile,
  useProfileNoteMembership,
} from '../../hooks/useProfileNotes';
import { NoteWithTags, Tag, UpdateNoteData } from '../../types/database';
import { stripMarkdown } from '../../utils/markdown';

type MobileRail = 'none' | 'tags' | 'profiles';

type PendingNoteAdd = {
  title: string;
  profileId: string | null;
  tagIds: string[];
};

const NotesPage = () => {
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode('notes');
  const [pendingAdd, setPendingAdd] = useState<PendingNoteAdd | null>(null);
  const [mobileRail, setMobileRail] = useState<MobileRail>('none');
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 899px)').matches,
  );

  const { data: allNotes } = useAllNotes();
  const { data: profiles } = useProfiles();
  const { data: tags } = useTags();
  const { data: membershipRows } = useProfileNoteMembership();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const setNoteTags = useSetNoteTags();
  const addNotesToProfile = useAddNotesToProfile();

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 899px)');
    const onChange = () => setIsNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!isNarrow) {
      setMobileRail('none');
    }
  }, [isNarrow]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    html.classList.add('dashboard-scroll-lock');
    body.classList.add('dashboard-scroll-lock');
    root?.classList.add('dashboard-scroll-lock');

    return () => {
      html.classList.remove('dashboard-scroll-lock');
      body.classList.remove('dashboard-scroll-lock');
      root?.classList.remove('dashboard-scroll-lock');
    };
  }, []);

  useEffect(() => {
    if (
      selectedProfileId &&
      !(profiles ?? []).some((p) => p.id === selectedProfileId)
    ) {
      setSelectedProfileId(null);
    }
  }, [profiles, selectedProfileId]);

  const notesWithTags = useMemo(
    () =>
      (allNotes ?? []).map((note) => {
        const tagMap = new Map<string, Tag>();
        (note.note_tags ?? []).forEach((noteTag) => {
          if (noteTag.tag) {
            tagMap.set(noteTag.tag.id, noteTag.tag);
          }
        });
        (note.tags ?? []).forEach((tag) => tagMap.set(tag.id, tag));
        return { ...note, tags: Array.from(tagMap.values()) } as NoteWithTags;
      }),
    [allNotes],
  );

  const profileNoteSets = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of membershipRows ?? []) {
      if (!map.has(row.profile_id)) {
        map.set(row.profile_id, new Set());
      }
      map.get(row.profile_id)!.add(row.note_id);
    }
    return map;
  }, [membershipRows]);

  const profileCountsForBar = useMemo(() => {
    const counts: Record<string, number> = {};
    (profiles ?? []).forEach((p) => {
      counts[p.id] = profileNoteSets.get(p.id)?.size ?? 0;
    });
    return counts;
  }, [profiles, profileNoteSets]);

  const isPendingNote = useCallback(
    (note: NoteWithTags) =>
      pendingAdd !== null &&
      (note.id.startsWith('temp-') || note.title === pendingAdd.title),
    [pendingAdd],
  );

  const filterBySearch = useCallback(
    (note: NoteWithTags) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        note.title?.toLowerCase().includes(query) ||
        stripMarkdown(note.body).toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filterByTags = useCallback(
    (note: NoteWithTags) => {
      if (selectedTagIds.length === 0 && !includeUntagged) return true;

      if (isPendingNote(note)) {
        const pendingTagIds = pendingAdd?.tagIds ?? [];
        const matchesTags = selectedTagIds.some((tagId) =>
          pendingTagIds.includes(tagId),
        );
        return matchesTags || (includeUntagged && pendingTagIds.length === 0);
      }

      const tagIds = (note.tags ?? []).map((tag) => tag.id);
      const matchesTags = selectedTagIds.some((tagId) => tagIds.includes(tagId));
      const matchesUntagged = includeUntagged && tagIds.length === 0;
      return matchesTags || matchesUntagged;
    },
    [includeUntagged, isPendingNote, pendingAdd, selectedTagIds],
  );

  const filterByProfile = useCallback(
    (note: NoteWithTags) => {
      if (!selectedProfileId) return true;
      if (isPendingNote(note)) {
        return pendingAdd?.profileId === selectedProfileId;
      }
      return profileNoteSets.get(selectedProfileId)?.has(note.id) ?? false;
    },
    [isPendingNote, pendingAdd, profileNoteSets, selectedProfileId],
  );

  const filteredNotes = useMemo(
    () =>
      notesWithTags
        .filter(
          (note) =>
            filterBySearch(note) && filterByTags(note) && filterByProfile(note),
        )
        .sort((a, b) => (b.updated_at > a.updated_at ? 1 : -1)),
    [filterByProfile, filterBySearch, filterByTags, notesWithTags],
  );

  const notesForTagRail = useMemo(() => {
    if (!selectedProfileId) {
      return notesWithTags;
    }
    const inProfile = profileNoteSets.get(selectedProfileId);
    if (!inProfile) {
      return [];
    }
    return notesWithTags.filter((note) => inProfile.has(note.id));
  }, [profileNoteSets, selectedProfileId, notesWithTags]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notesForTagRail.forEach((note) => {
      (note.tags ?? []).forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [notesForTagRail]);

  const tagsForBar = useMemo(() => {
    const allTags = tags ?? [];
    if (!selectedProfileId) {
      return allTags;
    }
    return allTags.filter((tag) => (tagCounts[tag.id] ?? 0) > 0);
  }, [selectedProfileId, tagCounts, tags]);

  const untaggedCount = useMemo(
    () =>
      notesForTagRail.filter((note) => (note.tags ?? []).length === 0).length,
    [notesForTagRail],
  );

  const selectedNote = useMemo(
    () =>
      selectedNoteId
        ? notesWithTags.find((note) => note.id === selectedNoteId)
        : undefined,
    [notesWithTags, selectedNoteId],
  );

  useEffect(() => {
    if (selectedNoteId && !selectedNote) {
      setSelectedNoteId(null);
    }
  }, [selectedNote, selectedNoteId]);

  // Deep link from other modules (e.g. a note row in a space stream):
  // /notes?note=<id> opens that note, then the param is consumed
  const requestedNoteId = searchParams.get('note');
  useEffect(() => {
    if (!requestedNoteId) return;
    if (notesWithTags.some((note) => note.id === requestedNoteId)) {
      setSelectedNoteId(requestedNoteId);
      setSearchParams({}, { replace: true });
    }
  }, [notesWithTags, requestedNoteId, setSearchParams]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTagIds.length > 0 ||
    includeUntagged ||
    selectedProfileId !== null;

  const noteCount = notesWithTags.length;
  const showOmnibarAdd = searchQuery.trim().length > 0;

  const handleOmnibarAdd = useCallback(() => {
    const title = searchQuery.trim();
    if (!title || pendingAdd !== null) {
      return;
    }

    const pendingContext: PendingNoteAdd = {
      title,
      profileId: selectedProfileId,
      tagIds: [...selectedTagIds],
    };

    setPendingAdd(pendingContext);
    setSearchQuery('');

    createNote.mutate(
      { title },
      {
        onSuccess: (newNote) => {
          setSelectedNoteId(newNote.id);

          const postCreate: Promise<unknown>[] = [];

          if (pendingContext.profileId) {
            postCreate.push(
              addNotesToProfile.mutateAsync({
                profileId: pendingContext.profileId,
                noteIds: [newNote.id],
              }),
            );
          }

          if (pendingContext.tagIds.length > 0) {
            postCreate.push(
              setNoteTags.mutateAsync({
                noteId: newNote.id,
                tagIds: pendingContext.tagIds,
              }),
            );
          }

          if (postCreate.length === 0) {
            setPendingAdd(null);
            return;
          }

          void Promise.all(postCreate)
            .catch((error) => {
              console.error('Failed to apply note filters after create:', error);
            })
            .finally(() => {
              setPendingAdd(null);
            });
        },
        onError: () => {
          setSearchQuery(pendingContext.title);
          setPendingAdd(null);
        },
      },
    );
  }, [
    addNotesToProfile,
    createNote,
    pendingAdd,
    searchQuery,
    selectedProfileId,
    selectedTagIds,
    setNoteTags,
  ]);

  const updateNoteAsync = updateNote.mutateAsync;
  const handleSaveNote = useCallback(
    (id: string, updates: UpdateNoteData) => updateNoteAsync({ id, updates }),
    [updateNoteAsync],
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (noteId.startsWith('temp-')) return;
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
      deleteNote.mutate(noteId);
    },
    [deleteNote, selectedNoteId],
  );

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleToggleProfileFilter = useCallback((profileId: string) => {
    setSelectedProfileId((prev) => (prev === profileId ? null : profileId));
  }, []);

  const emptyTitle = hasActiveFilters
    ? 'No notes match the current filters'
    : 'No notes yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust search, tags, or space to broaden the results — or press Enter to capture this as a new note.'
    : 'Type a thought above and press Enter to capture your first note.';

  return (
    <div className="bookmark-dashboard">
      <AppHeader user={session?.user ?? null} />

      <div
        className={`bookmark-feed-layout${
          viewMode === 'grid' || selectedNote ? ' is-grid-wide' : ''
        }`}
      >
        {isNarrow && mobileRail !== 'none' && (
          <button
            type="button"
            className="bookmark-mobile-scrim"
            aria-label="Close panel"
            onClick={() => setMobileRail('none')}
          />
        )}

        <aside
          className={`bookmark-rail bookmark-rail--profiles ${
            isNarrow && mobileRail === 'profiles' ? 'is-mobile-open' : ''
          }`}
        >
          {isNarrow && (
            <div className="bookmark-rail-mobile-header">
              <span className="bookmark-rail-mobile-title">Spaces</span>
              <button
                type="button"
                className="bookmark-rail-mobile-close"
                onClick={() => setMobileRail('none')}
              >
                Close
              </button>
            </div>
          )}
          <div className="bookmark-rail-inner bookmark-rail-inner--profiles">
            <ProfileFilterBar
              profiles={profiles ?? []}
              profileCounts={profileCountsForBar}
              selectedProfileId={selectedProfileId}
              onToggleProfile={handleToggleProfileFilter}
            />
          </div>
        </aside>

        <main className="bookmark-feed-main">
          {isNarrow && (
            <div
              className="bookmark-mobile-rail-tabs"
              role="toolbar"
              aria-label="Open side panels"
            >
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) => (r === 'profiles' ? 'none' : 'profiles'))
                }
              >
                Spaces
              </button>
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) => (r === 'tags' ? 'none' : 'tags'))
                }
              >
                Tags
              </button>
            </div>
          )}

          <div
            className={`bookmark-feed-main-inner${
              viewMode === 'grid' || selectedNote ? ' is-grid-view' : ''
            }`}
          >
            <FrostedStack>
              {selectedNote ? (
                <NoteEditor
                  note={selectedNote}
                  onBack={() => setSelectedNoteId(null)}
                  onSave={handleSaveNote}
                  onDelete={handleDeleteNote}
                />
              ) : (
                <>
                  <div className="bookmark-search-panel">
                    <Omnibar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder={`Search ${noteCount} note${noteCount === 1 ? '' : 's'}…`}
                      ariaLabel="Search notes or type to capture a new one"
                      action={{
                        label: 'New note',
                        pendingLabel: 'Adding…',
                        show: showOmnibarAdd,
                        pending: pendingAdd !== null,
                        onRun: handleOmnibarAdd,
                      }}
                    />
                  </div>

                  <div
                    className={viewMode === 'grid' ? 'memex-grid-view' : 'memex-note-list'}
                  >
                    {filteredNotes.length === 0 ? (
                      <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
                    ) : viewMode === 'grid' ? (
                      <div className="memex-grid">
                        {filteredNotes.map((note) => (
                          <NoteGridCard
                            key={note.id}
                            note={note}
                            onOpen={(n) => {
                              if (n.id.startsWith('temp-')) return;
                              setSelectedNoteId(n.id);
                            }}
                            onDelete={handleDeleteNote}
                          />
                        ))}
                      </div>
                    ) : (
                      filteredNotes.map((note) => (
                        <NoteListRow
                          key={note.id}
                          note={note}
                          onOpen={(n) => {
                            if (n.id.startsWith('temp-')) return;
                            setSelectedNoteId(n.id);
                          }}
                          onDelete={handleDeleteNote}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </FrostedStack>
          </div>
        </main>

        <aside
          className={`bookmark-rail bookmark-rail--tags ${
            isNarrow && mobileRail === 'tags' ? 'is-mobile-open' : ''
          }`}
        >
          {isNarrow && (
            <div className="bookmark-rail-mobile-header">
              <span className="bookmark-rail-mobile-title">Tags</span>
              <button
                type="button"
                className="bookmark-rail-mobile-close"
                onClick={() => setMobileRail('none')}
              >
                Close
              </button>
            </div>
          )}
          <div className="bookmark-rail-inner bookmark-rail-inner--tags">
            <TagFilterBar
              tags={tagsForBar}
              selectedTagIds={selectedTagIds}
              includeUntagged={includeUntagged}
              untaggedCount={untaggedCount}
              tagCounts={tagCounts}
              onToggleTag={handleToggleTag}
              onToggleUntagged={() => setIncludeUntagged((prev) => !prev)}
            />
          </div>
        </aside>
      </div>

      {!selectedNote && <ViewToggleFab mode={viewMode} onChange={setViewMode} />}
    </div>
  );
};

export default NotesPage;
