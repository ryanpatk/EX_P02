import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LinkDetailsPanel from '../components/LinkDetailsPanel';
import LinkGridCard from '../components/LinkGridCard';
import NoteEditor from '../components/NoteEditor';
import NoteGridCard from '../components/NoteGridCard';
import NotesToSelfPanel from '../components/NotesToSelfPanel';
import SpaceDetailsModal from '../components/SpaceDetailsModal';
import StreamFilterBar from '../components/StreamFilterBar';
import TaskGridCard from '../components/TaskGridCard';
import { EmptyState, FeedbackToast, FrostedStack, Omnibar } from '../components/ui';
import type { OmnibarAction } from '../components/ui';
import {
  HOME_PATH,
  ITEM_TYPES,
  ItemType,
  NOTE_PARAM,
  TAGS_PARAM,
  TYPE_PARAM,
  UNTAGGED_PARAM,
  isItemType,
} from '../constants/modules';
import { useSession } from '../context/SessionContext';
import { useFeedbackToast } from '../hooks/useFeedbackToast';
import { useAllLinks, useCreateLink, useDeleteLink, useUpdateLink } from '../hooks/useLinks';
import { useSetLinkTags } from '../hooks/useLinkTags';
import { useAllNotes, useCreateNote, useDeleteNote, useUpdateNote } from '../hooks/useNotes';
import { useSetNoteTags } from '../hooks/useNoteTags';
import {
  useAddLinksToProfile,
  useProfileLinkMembership,
  useRemoveLinkFromProfile,
  useSetProfileLinkSuperFavorite,
} from '../hooks/useProfileLinks';
import { useAddNotesToProfile, useProfileNoteMembership } from '../hooks/useProfileNotes';
import { useAddTasksToProfile, useProfileTaskMembership } from '../hooks/useProfileTasks';
import { useProfiles } from '../hooks/useProfiles';
import { useCreateTag, useDeleteTag, useTags } from '../hooks/useTags';
import { useAllTasks, useCreateTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import { useSetTaskTags } from '../hooks/useTaskTags';
import { urlScraperApi } from '../hooks/useUrlScraper';
import { useAppStore } from '../store';
import { LinkWithTag, NoteWithTags, TaskWithTags, UpdateNoteData } from '../types/database';
import { openUrlInBackgroundTab } from '../utils/openUrlInBackgroundTab';
import { cue } from '../utils/sound';
import { ChatIcon, GearIcon } from '../components/icons';
import {
  StreamItem,
  buildStreamItems,
  byUpdatedDesc,
  isPendingItem,
  itemKey,
  itemMatchesSearch,
} from '../utils/streamItems';
import { isUrlLike, normalizeUrlInput } from '../utils/urlInput';

/** Context captured when the omnibar creates an item, so the optimistic row
 * passes the active space/tag filters until the joins land. */
type PendingAdd = {
  kind: ItemType;
  rawInput: string;
  /** Normalized URL (links) or title (notes/tasks) used to spot the optimistic row. */
  match: string;
  spaceId: string | null;
  tagIds: string[];
};

const SELF_NOTES_OPEN_KEY = 'memex.self-notes-open';

const parseList = (value: string | null) =>
  value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];

/**
 * The one surface of memex: a mixed stream of notes, links, and tasks —
 * everything on Home, or one space's contents at /spaces/:spaceId — with
 * element-type and tag chips above the grid, omnibar capture, and the
 * context's super favorites in the header.
 */
const StreamPage = () => {
  const { spaceId } = useParams<{ spaceId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [detailLinkId, setDetailLinkId] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [spaceDetailsOpen, setSpaceDetailsOpen] = useState(false);
  const [selfNotesOpen, setSelfNotesOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(SELF_NOTES_OPEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 899px)').matches,
  );

  const selectionMode = useAppStore((state) => state.selectionMode);
  const selectedItemKeys = useAppStore((state) => state.selectedItemKeys);
  const setSelectionMode = useAppStore((state) => state.setSelectionMode);
  const toggleItemSelection = useAppStore((state) => state.toggleItemSelection);
  const clearItemSelection = useAppStore((state) => state.clearItemSelection);

  const { data: allLinks } = useAllLinks();
  const { data: allNotes } = useAllNotes();
  const { data: allTasks } = useAllTasks();
  const { data: profiles } = useProfiles();
  const { data: tags } = useTags();
  const { data: linkMembership } = useProfileLinkMembership();
  const { data: noteMembership } = useProfileNoteMembership();
  const { data: taskMembership } = useProfileTaskMembership();

  const createLink = useCreateLink();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const setLinkTags = useSetLinkTags();
  const addLinksToProfile = useAddLinksToProfile();
  const setProfileLinkSuperFavorite = useSetProfileLinkSuperFavorite();
  const removeLinkFromProfile = useRemoveLinkFromProfile();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const setNoteTags = useSetNoteTags();
  const addNotesToProfile = useAddNotesToProfile();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const setTaskTags = useSetTaskTags();
  const addTasksToProfile = useAddTasksToProfile();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const { toast, flash, handleAnimationEnd } = useFeedbackToast();

  /* ---------- URL state: type filter, tag filter, open note ---------- */

  const selectedTypes = useMemo(
    () => parseList(searchParams.get(TYPE_PARAM)).filter(isItemType) as ItemType[],
    [searchParams],
  );
  const selectedTagIds = useMemo(
    () => parseList(searchParams.get(TAGS_PARAM)),
    [searchParams],
  );
  const includeUntagged = searchParams.get(UNTAGGED_PARAM) === '1';
  const openNoteId = searchParams.get(NOTE_PARAM);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          mutate(next);
          return next;
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const setListParam = useCallback(
    (params: URLSearchParams, key: string, values: string[]) => {
      if (values.length === 0) params.delete(key);
      else params.set(key, values.join(','));
    },
    [],
  );

  const toggleType = useCallback(
    (type: ItemType) =>
      updateParams((params) => {
        const next = selectedTypes.includes(type)
          ? selectedTypes.filter((t) => t !== type)
          : [...selectedTypes, type];
        setListParam(params, TYPE_PARAM, next);
      }),
    [selectedTypes, setListParam, updateParams],
  );

  const setSelectedTagIds = useCallback(
    (next: string[]) => updateParams((params) => setListParam(params, TAGS_PARAM, next)),
    [setListParam, updateParams],
  );

  const toggleUntagged = useCallback(
    () =>
      updateParams((params) => {
        if (includeUntagged) params.delete(UNTAGGED_PARAM);
        else params.set(UNTAGGED_PARAM, '1');
      }),
    [includeUntagged, updateParams],
  );

  const openNote = useCallback(
    (noteId: string) => updateParams((params) => params.set(NOTE_PARAM, noteId)),
    [updateParams],
  );

  const closeNote = useCallback(
    () => updateParams((params) => params.delete(NOTE_PARAM)),
    [updateParams],
  );

  /* ---------- Space resolution ---------- */

  const space = useMemo(
    () => (spaceId ? profiles?.find((p) => p.id === spaceId) : undefined),
    [profiles, spaceId],
  );

  // A deleted or foreign space id falls back to Home once spaces have loaded
  useEffect(() => {
    if (spaceId && profiles && !space) {
      navigate(HOME_PATH, { replace: true });
    }
  }, [navigate, profiles, space, spaceId]);

  /* ---------- Notes to Self panel ---------- */

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 899px)');
    const onChange = () => setIsNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const toggleSelfNotes = useCallback(() => {
    setSelfNotesOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SELF_NOTES_OPEN_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable — skip */
      }
      return next;
    });
  }, []);

  const closeSelfNotes = useCallback(() => {
    cue('dismiss');
    setSelfNotesOpen(false);
    try {
      window.localStorage.setItem(SELF_NOTES_OPEN_KEY, '0');
    } catch {
      /* storage unavailable — skip */
    }
  }, []);

  // Escape closes the mobile sheet
  useEffect(() => {
    if (!selfNotesOpen || !isNarrow) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeSelfNotes();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSelfNotes, isNarrow, selfNotesOpen]);

  /* ---------- Page chrome effects ---------- */

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

  /* ---------- Items ---------- */

  const allItems = useMemo(
    () => buildStreamItems(allLinks, allNotes, allTasks),
    [allLinks, allNotes, allTasks],
  );

  const itemsByKey = useMemo(() => {
    const map = new Map<string, StreamItem>();
    allItems.forEach((item) => map.set(item.key, item));
    return map;
  }, [allItems]);

  /** Keys of items that belong to the current space. */
  const spaceKeys = useMemo(() => {
    const set = new Set<string>();
    if (!spaceId) return set;
    (linkMembership ?? []).forEach((row) => {
      if (row.profile_id === spaceId) set.add(itemKey('link', row.link_id));
    });
    (noteMembership ?? []).forEach((row) => {
      if (row.profile_id === spaceId) set.add(itemKey('note', row.note_id));
    });
    (taskMembership ?? []).forEach((row) => {
      if (row.profile_id === spaceId) set.add(itemKey('task', row.task_id));
    });
    return set;
  }, [linkMembership, noteMembership, spaceId, taskMembership]);

  const isPendingMatch = useCallback(
    (item: StreamItem) => {
      if (!pendingAdd || item.type !== pendingAdd.kind) return false;
      if (isPendingItem(item)) return true;
      if (item.type === 'link') return item.link.url === pendingAdd.match;
      if (item.type === 'note') return item.note.title === pendingAdd.match;
      return item.task.title === pendingAdd.match;
    },
    [pendingAdd],
  );

  const inScope = useCallback(
    (item: StreamItem) => {
      if (!spaceId) return true;
      if (isPendingMatch(item)) return pendingAdd?.spaceId === spaceId;
      return spaceKeys.has(item.key);
    },
    [isPendingMatch, pendingAdd, spaceId, spaceKeys],
  );

  const matchesType = useCallback(
    (item: StreamItem) => selectedTypes.length === 0 || selectedTypes.includes(item.type),
    [selectedTypes],
  );

  const matchesTags = useCallback(
    (item: StreamItem) => {
      if (selectedTagIds.length === 0 && !includeUntagged) return true;
      const tagIds = isPendingMatch(item)
        ? (pendingAdd?.tagIds ?? [])
        : item.tags.map((tag) => tag.id);
      const matches = selectedTagIds.some((id) => tagIds.includes(id));
      return matches || (includeUntagged && tagIds.length === 0);
    },
    [includeUntagged, isPendingMatch, pendingAdd, selectedTagIds],
  );

  const matchesSearch = useCallback(
    (item: StreamItem) => itemMatchesSearch(item, searchQuery),
    [searchQuery],
  );

  const scopedItems = useMemo(() => allItems.filter(inScope), [allItems, inScope]);

  const filteredItems = useMemo(
    () =>
      scopedItems
        .filter((item) => matchesType(item) && matchesTags(item) && matchesSearch(item))
        .sort(byUpdatedDesc),
    [matchesSearch, matchesTags, matchesType, scopedItems],
  );

  const openItems = useMemo(
    () => filteredItems.filter((item) => !(item.type === 'task' && item.task.is_done)),
    [filteredItems],
  );

  const doneTasks = useMemo(
    () => filteredItems.filter((item) => item.type === 'task' && item.task.is_done),
    [filteredItems],
  );

  // Type chip counts respect tag + search filters; tag chip counts respect
  // type + search filters — each row describes what the other would show.
  const typeCounts = useMemo(() => {
    const counts: Record<ItemType, number> = { note: 0, link: 0, task: 0 };
    scopedItems.forEach((item) => {
      if (matchesTags(item) && matchesSearch(item)) counts[item.type] += 1;
    });
    return counts;
  }, [matchesSearch, matchesTags, scopedItems]);

  // Unfiltered per-type totals for the current scope drive the chip order
  const typeTotals = useMemo(() => {
    const counts: Record<ItemType, number> = { note: 0, link: 0, task: 0 };
    scopedItems.forEach((item) => {
      counts[item.type] += 1;
    });
    return counts;
  }, [scopedItems]);

  const itemsForTagRow = useMemo(
    () => scopedItems.filter((item) => matchesType(item) && matchesSearch(item)),
    [matchesSearch, matchesType, scopedItems],
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    itemsForTagRow.forEach((item) => {
      item.tags.forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });
    return counts;
  }, [itemsForTagRow]);

  const untaggedCount = useMemo(
    () => itemsForTagRow.filter((item) => item.tags.length === 0).length,
    [itemsForTagRow],
  );

  // Inside a space only tags actually used there are offered; on Home every
  // tag is, so a fresh tag can be applied straight away. Selected tags stay
  // visible even at zero so they can be cleared.
  const tagsForRow = useMemo(() => {
    const all = tags ?? [];
    const visible = spaceId
      ? all.filter((tag) => (tagCounts[tag.id] ?? 0) > 0 || selectedTagIds.includes(tag.id))
      : all;
    return [...visible].sort((a, b) => {
      const diff = (tagCounts[b.id] ?? 0) - (tagCounts[a.id] ?? 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [selectedTagIds, spaceId, tagCounts, tags]);

  /* ---------- Super favorites (header) ---------- */

  const superFavoriteLinks = useMemo(() => {
    const pinnedInSpace = new Set<string>();
    const pinnedAnywhere = new Set<string>();
    (linkMembership ?? []).forEach((row) => {
      if (!row.is_super_favorite) return;
      pinnedAnywhere.add(row.link_id);
      if (row.profile_id === spaceId) pinnedInSpace.add(row.link_id);
    });
    return allItems
      .filter((item): item is Extract<StreamItem, { type: 'link' }> => item.type === 'link')
      .map((item) => item.link)
      .filter((link) =>
        spaceId
          ? pinnedInSpace.has(link.id)
          : Boolean(link.is_super_favorite) || pinnedAnywhere.has(link.id),
      )
      .sort((a, b) => (a.title || a.url).toLowerCase().localeCompare((b.title || b.url).toLowerCase()));
  }, [allItems, linkMembership, spaceId]);

  /* ---------- Selection ---------- */

  const bulkAssignActive = selectionMode && selectedItemKeys.length > 0;

  useEffect(() => {
    clearItemSelection();
    setSelectionMode(false);
    setDetailLinkId(null);
  }, [
    clearItemSelection,
    includeUntagged,
    searchQuery,
    selectedTagIds,
    selectedTypes,
    setSelectionMode,
    spaceId,
  ]);

  // Leaving the stream (unmount) must not leave the sidebar in bulk mode
  useEffect(() => () => setSelectionMode(false), [setSelectionMode]);

  const handleToggleSelectionMode = () => {
    const next = !selectionMode;
    setSelectionMode(next);
    if (next) setDetailLinkId(null);
  };

  const handleToggleSelect = useCallback(
    (item: StreamItem) => {
      if (isPendingItem(item)) return;
      toggleItemSelection(item.key);
    },
    [toggleItemSelection],
  );

  const handleBulkAddTag = useCallback(
    async (tagId: string) => {
      const tag = (tags ?? []).find((t) => t.id === tagId);
      const tagName = tag?.name ?? 'tag';
      const targets = selectedItemKeys
        .map((key) => itemsByKey.get(key))
        .filter((item): item is StreamItem => !!item && !isPendingItem(item))
        .filter((item) => !item.tags.some((t) => t.id === tagId));

      if (targets.length === 0) {
        flash(`Selection already had “${tagName}”.`);
        return;
      }
      flash(`Applied “${tagName}” to ${targets.length} item${targets.length === 1 ? '' : 's'}.`);
      cue('move');

      try {
        await Promise.all(
          targets.map((item) => {
            const tagIds = [...item.tags.map((t) => t.id), tagId];
            if (item.type === 'link') return setLinkTags.mutateAsync({ linkId: item.id, tagIds });
            if (item.type === 'note') return setNoteTags.mutateAsync({ noteId: item.id, tagIds });
            return setTaskTags.mutateAsync({ taskId: item.id, tagIds });
          }),
        );
      } catch (error) {
        console.error('Failed to bulk-apply tag:', error);
      }
    },
    [flash, itemsByKey, selectedItemKeys, setLinkTags, setNoteTags, setTaskTags, tags],
  );

  const handleToggleTag = useCallback(
    (tagId: string) => {
      if (bulkAssignActive) {
        void handleBulkAddTag(tagId);
        return;
      }
      setSelectedTagIds(
        selectedTagIds.includes(tagId)
          ? selectedTagIds.filter((id) => id !== tagId)
          : [...selectedTagIds, tagId],
      );
    },
    [bulkAssignActive, handleBulkAddTag, selectedTagIds, setSelectedTagIds],
  );

  /* ---------- Capture ---------- */

  const rawInput = searchQuery.trim();
  const inputIsUrl = isUrlLike(rawInput);
  const captureTagIds = useMemo(() => [...selectedTagIds], [selectedTagIds]);

  const afterCreate = useCallback(
    (kind: ItemType, id: string, context: PendingAdd) => {
      const postCreate: Promise<unknown>[] = [];
      if (context.spaceId) {
        if (kind === 'link') {
          postCreate.push(
            addLinksToProfile.mutateAsync({ profileId: context.spaceId, linkIds: [id] }),
          );
        } else if (kind === 'note') {
          postCreate.push(
            addNotesToProfile.mutateAsync({ profileId: context.spaceId, noteIds: [id] }),
          );
        } else {
          postCreate.push(
            addTasksToProfile.mutateAsync({ profileId: context.spaceId, taskIds: [id] }),
          );
        }
      }
      if (context.tagIds.length > 0) {
        if (kind === 'link') {
          postCreate.push(setLinkTags.mutateAsync({ linkId: id, tagIds: context.tagIds }));
        } else if (kind === 'note') {
          postCreate.push(setNoteTags.mutateAsync({ noteId: id, tagIds: context.tagIds }));
        } else {
          postCreate.push(setTaskTags.mutateAsync({ taskId: id, tagIds: context.tagIds }));
        }
      }
      if (postCreate.length === 0) {
        setPendingAdd(null);
        return;
      }
      void Promise.all(postCreate)
        .catch((error) => {
          console.error('Failed to apply filters after create:', error);
        })
        .finally(() => setPendingAdd(null));
    },
    [
      addLinksToProfile,
      addNotesToProfile,
      addTasksToProfile,
      setLinkTags,
      setNoteTags,
      setTaskTags,
    ],
  );

  const handleAddLink = useCallback(() => {
    const url = normalizeUrlInput(rawInput);
    if (!url || !inputIsUrl || pendingAdd !== null) return;
    const context: PendingAdd = {
      kind: 'link',
      rawInput,
      match: url,
      spaceId: spaceId ?? null,
      tagIds: captureTagIds,
    };
    setPendingAdd(context);
    setSearchQuery('');
    cue('confirm');
    createLink.mutate(
      { url },
      {
        onSuccess: (created) => afterCreate('link', created.id, context),
        onError: () => {
          cue('error');
          setSearchQuery(context.rawInput);
          setPendingAdd(null);
        },
      },
    );
  }, [afterCreate, captureTagIds, createLink, inputIsUrl, pendingAdd, rawInput, spaceId]);

  const handleAddNote = useCallback(() => {
    if (!rawInput || pendingAdd !== null) return;
    const context: PendingAdd = {
      kind: 'note',
      rawInput,
      match: rawInput,
      spaceId: spaceId ?? null,
      tagIds: captureTagIds,
    };
    setPendingAdd(context);
    setSearchQuery('');
    cue('confirm');
    createNote.mutate(
      { title: rawInput },
      {
        onSuccess: (created) => {
          afterCreate('note', created.id, context);
          openNote(created.id);
        },
        onError: () => {
          cue('error');
          setSearchQuery(context.rawInput);
          setPendingAdd(null);
        },
      },
    );
  }, [afterCreate, captureTagIds, createNote, openNote, pendingAdd, rawInput, spaceId]);

  const handleAddTask = useCallback(() => {
    if (!rawInput || pendingAdd !== null) return;
    const context: PendingAdd = {
      kind: 'task',
      rawInput,
      match: rawInput,
      spaceId: spaceId ?? null,
      tagIds: captureTagIds,
    };
    setPendingAdd(context);
    setSearchQuery('');
    cue('confirm');
    createTask.mutate(
      { title: rawInput },
      {
        onSuccess: (created) => afterCreate('task', created.id, context),
        onError: () => {
          cue('error');
          setSearchQuery(context.rawInput);
          setPendingAdd(null);
        },
      },
    );
  }, [afterCreate, captureTagIds, createTask, pendingAdd, rawInput, spaceId]);

  const linkAlreadyInStream = useMemo(() => {
    if (!inputIsUrl) return false;
    const url = normalizeUrlInput(rawInput);
    return filteredItems.some((item) => item.type === 'link' && item.link.url === url);
  }, [filteredItems, inputIsUrl, rawInput]);

  const omnibarActions = useMemo<OmnibarAction[]>(() => {
    const pending = pendingAdd !== null;
    if (inputIsUrl) {
      return [
        {
          label: 'Add link',
          pendingLabel: 'Adding…',
          show: !linkAlreadyInStream,
          pending: pending && pendingAdd?.kind === 'link',
          onRun: handleAddLink,
        },
      ];
    }
    const showText = rawInput.length > 0;
    const preferTask = selectedTypes.length === 1 && selectedTypes[0] === 'task';
    const noteAction: OmnibarAction = {
      label: 'New note',
      pendingLabel: 'Adding…',
      show: showText,
      pending: pending && pendingAdd?.kind === 'note',
      onRun: handleAddNote,
    };
    const taskAction: OmnibarAction = {
      label: 'New task',
      pendingLabel: 'Adding…',
      show: showText,
      pending: pending && pendingAdd?.kind === 'task',
      onRun: handleAddTask,
    };
    // Enter runs the first action; standing in a task-only view makes that a task
    return preferTask ? [taskAction, noteAction] : [noteAction, taskAction];
  }, [
    handleAddLink,
    handleAddNote,
    handleAddTask,
    inputIsUrl,
    linkAlreadyInStream,
    pendingAdd,
    rawInput,
    selectedTypes,
  ]);

  /* ---------- Item behaviors ---------- */

  const handleOpenLink = useCallback((link: LinkWithTag) => {
    openUrlInBackgroundTab(link.url);
  }, []);

  const handleOpenNote = useCallback(
    (note: NoteWithTags) => {
      if (note.id.startsWith('temp-')) return;
      openNote(note.id);
    },
    [openNote],
  );

  const handleToggleTaskDone = useCallback(
    (task: TaskWithTags) => {
      if (task.id.startsWith('temp-')) return;
      cue('toggle');
      updateTask.mutate({ id: task.id, updates: { is_done: !task.is_done } });
    },
    [updateTask],
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      if (taskId.startsWith('temp-')) return;
      if (!window.confirm('Delete this task permanently? This cannot be undone.')) return;
      cue('dismiss');
      deleteTask.mutate(taskId);
    },
    [deleteTask],
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (noteId.startsWith('temp-')) return;
      if (openNoteId === noteId) closeNote();
      cue('dismiss');
      deleteNote.mutate(noteId);
    },
    [closeNote, deleteNote, openNoteId],
  );

  const updateNoteAsync = updateNote.mutateAsync;
  const handleSaveNote = useCallback(
    (id: string, updates: UpdateNoteData) => updateNoteAsync({ id, updates }),
    [updateNoteAsync],
  );

  /* ---------- Link details ---------- */

  const detailLink = useMemo(() => {
    if (!detailLinkId) return undefined;
    const item = itemsByKey.get(itemKey('link', detailLinkId));
    return item?.type === 'link' ? item.link : undefined;
  }, [detailLinkId, itemsByKey]);

  useEffect(() => {
    if (detailLinkId && !detailLink) setDetailLinkId(null);
  }, [detailLink, detailLinkId]);

  const detailIsSuperFavorite = useMemo(() => {
    if (!detailLink) return false;
    if (!spaceId) return Boolean(detailLink.is_super_favorite);
    return (linkMembership ?? []).some(
      (row) =>
        row.profile_id === spaceId && row.link_id === detailLink.id && row.is_super_favorite,
    );
  }, [detailLink, linkMembership, spaceId]);

  const handleOpenLinkDetails = useCallback(
    (link: LinkWithTag) => {
      clearItemSelection();
      setSelectionMode(false);
      setDetailLinkId(link.id);
    },
    [clearItemSelection, setSelectionMode],
  );

  const handleDetailToggleSuper = useCallback(
    async (next: boolean) => {
      if (!detailLinkId) return;
      if (spaceId) {
        await setProfileLinkSuperFavorite.mutateAsync({
          profileId: spaceId,
          linkId: detailLinkId,
          isSuperFavorite: next,
        });
        return;
      }
      await updateLink.mutateAsync({ id: detailLinkId, updates: { is_super_favorite: next } });
    },
    [detailLinkId, setProfileLinkSuperFavorite, spaceId, updateLink],
  );

  const handleDetailUpdateUrl = useCallback(
    async (url: string) => {
      if (!detailLinkId) return;
      await updateLink.mutateAsync({ id: detailLinkId, updates: { url } });
    },
    [detailLinkId, updateLink],
  );

  // Field-level merge: a fresh value overwrites, a missing one never blanks
  // out what's stored — a thinner scrape can only be a no-op.
  const handleDetailRescrape = useCallback(async (): Promise<
    'updated' | 'unchanged' | 'failed'
  > => {
    if (!detailLink) return 'failed';
    const scraped = await urlScraperApi.tryScrape(detailLink.url);
    // A successful scrape always carries a favicon; {} means the worker
    // errored or is unconfigured.
    if (!scraped.logo) return 'failed';

    const updates: Record<string, string> = {};
    if (scraped.title && scraped.title !== detailLink.title) {
      updates.title = scraped.title;
    }
    if (scraped.description && scraped.description !== detailLink.description) {
      updates.description = scraped.description;
    }
    if (scraped.logo !== detailLink.favicon_url) {
      updates.favicon_url = scraped.logo;
    }
    if (scraped.image && scraped.image !== detailLink.preview_image_url) {
      updates.preview_image_url = scraped.image;
    }

    if (Object.keys(updates).length === 0) return 'unchanged';
    await updateLink.mutateAsync({ id: detailLink.id, updates });
    return 'updated';
  }, [detailLink, updateLink]);

  const handleRemoveLinkFromSpace = useCallback(async () => {
    if (!detailLinkId || !spaceId) return;
    const name = space?.name ?? 'this space';
    try {
      await removeLinkFromProfile.mutateAsync({ profileId: spaceId, linkId: detailLinkId });
      cue('move');
      flash(`Removed from “${name}”.`);
      setDetailLinkId(null);
    } catch (error) {
      cue('error');
      console.error('Failed to remove link from space:', error);
    }
  }, [detailLinkId, flash, removeLinkFromProfile, space?.name, spaceId]);

  const handleDeleteLinkFromDetail = useCallback(async () => {
    if (!detailLinkId) return;
    try {
      await deleteLink.mutateAsync(detailLinkId);
      cue('dismiss');
      setDetailLinkId(null);
    } catch {
      cue('error');
    }
  }, [deleteLink, detailLinkId]);

  const handleCreateTag = async (name: string, color: string) =>
    createTag.mutateAsync({ name, color });

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag.mutateAsync(tagId);
      if (selectedTagIds.includes(tagId)) {
        setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  /* ---------- Open note (in-stack editor) ---------- */

  const openNoteItem = useMemo(() => {
    if (!openNoteId) return undefined;
    const item = itemsByKey.get(itemKey('note', openNoteId));
    return item?.type === 'note' ? item.note : undefined;
  }, [itemsByKey, openNoteId]);

  // A stale ?note= (deleted note) is dropped once notes have loaded
  useEffect(() => {
    if (openNoteId && allNotes && !openNoteItem) closeNote();
  }, [allNotes, closeNote, openNoteId, openNoteItem]);

  /* ---------- Copy ---------- */

  const hasActiveFilters =
    rawInput.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTagIds.length > 0 ||
    includeUntagged;

  const contextName = space?.name ?? 'Home';
  const typeLabel =
    selectedTypes.length === 1
      ? ITEM_TYPES.find((t) => t.key === selectedTypes[0])?.plural.toLowerCase() ?? 'items'
      : 'items';

  const emptyTitle = hasActiveFilters
    ? `No ${typeLabel} match the current filters`
    : spaceId
      ? 'This space is empty'
      : 'Nothing here yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust search, type, or tags to broaden the results — or press Enter to capture what you typed.'
    : spaceId
      ? 'Capture something above, or select items on Home and add them here.'
      : 'Paste a URL or type a thought above and press Enter to capture it.';

  const placeholder = space
    ? `Search “${space.name}” or capture…`
    : `Search ${scopedItems.length} item${scopedItems.length === 1 ? '' : 's'} or capture…`;

  const selectedCount = selectedItemKeys.length;

  /* ---------- Render ---------- */

  const renderCard = (item: StreamItem) => {
    const isSelected = selectedItemKeys.includes(item.key);
    if (item.type === 'link') {
      return (
        <LinkGridCard
          key={item.key}
          link={item.link}
          isSelected={isSelected}
          selectionMode={selectionMode}
          isDetailsActive={detailLinkId === item.id}
          onActivate={() =>
            selectionMode ? handleToggleSelect(item) : handleOpenLink(item.link)
          }
          onOpenDetails={() => handleOpenLinkDetails(item.link)}
        />
      );
    }
    if (item.type === 'note') {
      return (
        <NoteGridCard
          key={item.key}
          note={item.note}
          onOpen={handleOpenNote}
          onDelete={handleDeleteNote}
          selectionMode={selectionMode}
          isSelected={isSelected}
          onToggleSelect={() => handleToggleSelect(item)}
        />
      );
    }
    return (
      <TaskGridCard
        key={item.key}
        task={item.task}
        onToggleDone={handleToggleTaskDone}
        onDelete={handleDeleteTask}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onToggleSelect={() => handleToggleSelect(item)}
      />
    );
  };

  return (
    <div className="bookmark-dashboard memex-stream-page">
      <AppHeader
        user={session?.user ?? null}
        superFavoriteLinks={superFavoriteLinks}
        onSuperFavoriteOpen={handleOpenLink}
        right={
          <button
            type="button"
            className={`memex-self-notes-toggle${selfNotesOpen ? ' is-active' : ''}`}
            onClick={toggleSelfNotes}
            aria-pressed={selfNotesOpen}
            aria-label={
              selfNotesOpen
                ? 'Close Notes to Self'
                : `Open Notes to Self for ${space?.name ?? 'Home'}`
            }
            title="Notes to Self"
          >
            <ChatIcon />
          </button>
        }
      />

      {/* Same grid as before with the rail columns collapsed, so the stack
          keeps its inset and width rules */}
      <div
        className={`bookmark-feed-layout is-grid-wide is-empty-rails${
          selfNotesOpen ? ' has-self-notes' : ''
        }`}
      >
        {isNarrow && selfNotesOpen && (
          <button
            type="button"
            className="bookmark-mobile-scrim"
            aria-label="Close Notes to Self"
            onClick={closeSelfNotes}
          />
        )}

        <aside className="bookmark-rail bookmark-rail--profiles" aria-hidden="true" />

        <main className="bookmark-feed-main">
          <div className="bookmark-feed-main-inner is-grid-view">
            <FrostedStack>
              {openNoteItem ? (
                <NoteEditor
                  note={openNoteItem}
                  onBack={closeNote}
                  onSave={handleSaveNote}
                  onDelete={handleDeleteNote}
                />
              ) : (
                <>
                  <div className="bookmark-search-panel">
                    {detailLink ? (
                      <div className="bookmark-omnibar">
                        <div className="bookmark-omnibar-row bookmark-link-details-header-row">
                          <button
                            type="button"
                            className="bookmark-link-details-back"
                            onClick={() => setDetailLinkId(null)}
                          >
                            ← Back to {contextName}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Omnibar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={placeholder}
                        ariaLabel="Search, paste a URL, or type to capture"
                        actions={omnibarActions}
                      />
                    )}
                  </div>

                  {!detailLink && (
                    <StreamFilterBar
                      selectedTypes={selectedTypes}
                      typeCounts={typeCounts}
                      typeTotals={typeTotals}
                      onToggleType={toggleType}
                      tags={tagsForRow}
                      tagCounts={tagCounts}
                      selectedTagIds={selectedTagIds}
                      onToggleTag={handleToggleTag}
                      includeUntagged={includeUntagged}
                      untaggedCount={untaggedCount}
                      onToggleUntagged={toggleUntagged}
                      bulkAssignMode={bulkAssignActive}
                      afterTypes={
                        space ? (
                          <button
                            type="button"
                            className="bookmark-tag-chip memex-space-details-chip"
                            onClick={() => setSpaceDetailsOpen(true)}
                            aria-haspopup="dialog"
                            aria-label={`Space details for “${space.name}”`}
                            title="Space details"
                          >
                            <GearIcon />
                          </button>
                        ) : null
                      }
                      trailing={
                        <>
                          {selectionMode && (
                            <button
                              type="button"
                              className="bookmark-tag-new memex-stream-clear"
                              onClick={clearItemSelection}
                              disabled={selectedCount === 0}
                              aria-label={
                                selectedCount > 0
                                  ? `Clear ${selectedCount} selected item${selectedCount === 1 ? '' : 's'}`
                                  : 'Clear selection'
                              }
                            >
                              {selectedCount > 0 ? `Clear ${selectedCount}` : 'Clear'}
                            </button>
                          )}
                          <button
                            type="button"
                            className={`bookmark-tag-chip memex-stream-select${
                              selectionMode ? ' is-active' : ''
                            }`}
                            onClick={handleToggleSelectionMode}
                            aria-pressed={selectionMode}
                            title={selectionMode ? 'Finish selecting' : 'Select items to tag or add to a space'}
                          >
                            <span className="bookmark-tag-chip-label">
                              {selectionMode ? 'Done' : 'Select'}
                            </span>
                          </button>
                        </>
                      }
                    />
                  )}

                  <div className="bookmark-list-panel-stack">
                    <div className="memex-grid-view">
                      {openItems.length === 0 && doneTasks.length === 0 ? (
                        <EmptyState title={emptyTitle} subtitle={emptySubtitle} />
                      ) : (
                        <>
                          {openItems.length > 0 ? (
                            <div className="memex-grid">{openItems.map(renderCard)}</div>
                          ) : (
                            <EmptyState
                              title={hasActiveFilters ? emptyTitle : 'All clear'}
                              subtitle={
                                hasActiveFilters
                                  ? emptySubtitle
                                  : 'Nothing open. Everything left is done.'
                              }
                            />
                          )}

                          {doneTasks.length > 0 && (
                            <div className="memex-task-done-section">
                              <button
                                type="button"
                                className="memex-task-done-toggle"
                                onClick={() => setShowDone((prev) => !prev)}
                                aria-expanded={showDone}
                              >
                                <span
                                  className={`memex-task-done-caret${showDone ? ' is-open' : ''}`}
                                  aria-hidden="true"
                                >
                                  <svg viewBox="0 0 16 16" fill="none">
                                    <path d="M6 4.5 9.5 8 6 11.5" />
                                  </svg>
                                </span>
                                Done ({doneTasks.length})
                              </button>
                              {showDone && (
                                <div className="memex-grid">{doneTasks.map(renderCard)}</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {detailLink && (
                      <div
                        className="bookmark-link-details-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Link details"
                      >
                        <div className="bookmark-link-details-scroll">
                          <LinkDetailsPanel
                            link={detailLink}
                            membershipRows={linkMembership ?? []}
                            profiles={profiles ?? []}
                            availableTags={tags ?? []}
                            onUpdateUrl={handleDetailUpdateUrl}
                            onToggleSuperFavorite={handleDetailToggleSuper}
                            isSuperFavorite={detailIsSuperFavorite}
                            superFavoriteHint={
                              space
                                ? `Pins this site’s icon to the header while you’re in “${space.name}”.`
                                : 'Pins this site’s icon to the Home header for quick access.'
                            }
                            onUpdateTags={async (tagIds) => {
                              if (!detailLinkId) return;
                              await setLinkTags.mutateAsync({ linkId: detailLinkId, tagIds });
                            }}
                            onCreateTag={handleCreateTag}
                            onDeleteTag={handleDeleteTag}
                            onDeleteLink={handleDeleteLinkFromDetail}
                            spaceName={space?.name}
                            onRemoveFromSpace={space ? handleRemoveLinkFromSpace : undefined}
                            removeFromSpacePending={removeLinkFromProfile.isPending}
                            onRescrape={handleDetailRescrape}
                            urlPending={updateLink.isPending}
                            superFavoritePending={
                              updateLink.isPending || setProfileLinkSuperFavorite.isPending
                            }
                            deletePending={deleteLink.isPending}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </FrostedStack>
          </div>
        </main>

        {selfNotesOpen ? (
          <aside
            className={`bookmark-rail bookmark-rail--tags memex-self-notes-rail${
              isNarrow ? ' is-mobile-open' : ''
            }`}
            aria-label="Notes to Self"
          >
            <NotesToSelfPanel
              scopeId={spaceId ?? null}
              scopeName={space?.name ?? 'Home'}
              onClose={closeSelfNotes}
            />
          </aside>
        ) : (
          <aside className="bookmark-rail bookmark-rail--tags" aria-hidden="true" />
        )}
      </div>

      {space && (
        <SpaceDetailsModal
          space={space}
          isOpen={spaceDetailsOpen}
          onClose={() => setSpaceDetailsOpen(false)}
          typeTotals={typeTotals}
          onFeedback={flash}
        />
      )}

      {toast !== null && (
        <FeedbackToast
          message={toast.message}
          phase={toast.phase}
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
};

export default StreamPage;
