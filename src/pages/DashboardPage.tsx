import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllLinks, useCreateLink, useDeleteLink, useUpdateLink } from '../hooks/useLinks';
import { useCreateTag, useDeleteTag, useTags } from '../hooks/useTags';
import { useSetLinkTags } from '../hooks/useLinkTags';
import {
  getCachedScrapedData,
  isLocalDev,
  ScrapedUrlData,
  urlScraperApi,
  useUrlScraper,
} from '../hooks/useUrlScraper';
import { useAddLinksToProfile, useProfileLinkMembership } from '../hooks/useProfileLinks';
import { useProfiles } from '../hooks/useProfiles';
import { useAppStore } from '../store';
import { LinkWithTag, Tag } from '../types/database';
import supabase from '../supabase';
import AppHeader from '../components/AppHeader';
import BookmarkOmnibar from '../components/BookmarkOmnibar';
import LinksList from '../components/LinksList';
import LinkDetailsPanel from '../components/LinkDetailsPanel';
import ProfileFilterBar from '../components/ProfileFilterBar';
import TagFilterBar from '../components/TagFilterBar';
import { getTagIdsForLink } from '../utils/linkTags';
import { openUrlInBackgroundTab } from '../utils/openUrlInBackgroundTab';
import { isUrlLike, normalizeUrlInput } from '../utils/urlInput';

type MobileRail = 'none' | 'tags' | 'profiles';

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [scrapedDataMap, setScrapedDataMap] = useState<Record<string, ScrapedUrlData>>(
    {},
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);
  const [visibleLinks, setVisibleLinks] = useState<LinkWithTag[]>([]);
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [mobileRail, setMobileRail] = useState<MobileRail>('none');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [detailLinkId, setDetailLinkId] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 899px)').matches,
  );

  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectedLinkIds = useAppStore((state) => state.selectedLinkIds);
  const toggleLinkSelection = useAppStore((state) => state.toggleLinkSelection);
  const clearSelectedLinks = useAppStore((state) => state.clearSelectedLinks);

  const queryClient = useQueryClient();
  const { data: allLinks } = useAllLinks();
  const { data: profiles } = useProfiles();
  const { data: membershipRows } = useProfileLinkMembership();
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const setLinkTags = useSetLinkTags();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const updateLink = useUpdateLink();
  const addLinksToProfile = useAddLinksToProfile();
  const urlScraper = useUrlScraper();
  const scrapingEnabled = false;

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
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };

    getUser();
  }, []);

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

  const linksWithTags = useMemo(() => {
    return (
      allLinks?.map((link) => {
        const tagMap = new Map<string, Tag>();

        if (link.tag) {
          tagMap.set(link.tag.id, link.tag);
        }

        if (link.link_tags) {
          link.link_tags.forEach((linkTag) => {
            if (linkTag.tag) {
              tagMap.set(linkTag.tag.id, linkTag.tag);
            }
          });
        }

        return {
          ...link,
          tags: Array.from(tagMap.values()),
        } as LinkWithTag;
      }) || []
    );
  }, [allLinks]);

  const profileLinkSets = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const row of membershipRows ?? []) {
      if (!map.has(row.profile_id)) {
        map.set(row.profile_id, new Set());
      }
      map.get(row.profile_id)!.add(row.link_id);
    }
    return map;
  }, [membershipRows]);

  const profileCountsByProfile = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of membershipRows ?? []) {
      counts[row.profile_id] = (counts[row.profile_id] ?? 0) + 1;
    }
    return counts;
  }, [membershipRows]);

  const profileCountsForBar = useMemo(() => {
    const merged = { ...profileCountsByProfile };
    (profiles ?? []).forEach((p) => {
      if (merged[p.id] === undefined) {
        merged[p.id] = 0;
      }
    });
    return merged;
  }, [profiles, profileCountsByProfile]);

  const filterBySearch = useCallback(
    (link: LinkWithTag) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const scrapedData = scrapedDataMap[link.url];

      return (
        link.url.toLowerCase().includes(query) ||
        link.title?.toLowerCase().includes(query) ||
        link.description?.toLowerCase().includes(query) ||
        scrapedData?.title?.toLowerCase().includes(query) ||
        scrapedData?.description?.toLowerCase().includes(query)
      );
    },
    [scrapedDataMap, searchQuery],
  );

  const filterByTags = useCallback(
    (link: LinkWithTag) => {
      if (selectedTagIds.length === 0 && !includeUntagged) return true;

      const tagIds = link.tags?.map((tag) => tag.id) || [];
      const hasTags = tagIds.length > 0;
      const matchesTags = selectedTagIds.some((tagId) => tagIds.includes(tagId));
      const matchesUntagged = includeUntagged && !hasTags;

      return matchesTags || matchesUntagged;
    },
    [includeUntagged, selectedTagIds],
  );

  const filterByProfile = useCallback(
    (link: LinkWithTag) => {
      if (!selectedProfileId) {
        return true;
      }
      return profileLinkSets.get(selectedProfileId)?.has(link.id) ?? false;
    },
    [profileLinkSets, selectedProfileId],
  );

  const filteredLinks = useMemo(
    () =>
      linksWithTags.filter(
        (link) =>
          filterBySearch(link) && filterByTags(link) && filterByProfile(link),
      ),
    [filterByProfile, filterBySearch, filterByTags, linksWithTags],
  );

  const superFavoriteLinks = useMemo(
    () =>
      [...linksWithTags]
        .filter((l) => l.is_super_favorite)
        .sort((a, b) => {
          const ta = (a.title || a.url).toLowerCase();
          const tb = (b.title || b.url).toLowerCase();
          return ta.localeCompare(tb);
        }),
    [linksWithTags],
  );

  const detailLink = useMemo(
    () =>
      detailLinkId ? linksWithTags.find((l) => l.id === detailLinkId) : undefined,
    [detailLinkId, linksWithTags],
  );

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    linksWithTags.forEach((link) => {
      (link.tags || []).forEach((tag) => {
        counts[tag.id] = (counts[tag.id] ?? 0) + 1;
      });
    });

    return counts;
  }, [linksWithTags]);

  const untaggedCount = useMemo(
    () => linksWithTags.filter((link) => (link.tags || []).length === 0).length,
    [linksWithTags],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedTagIds.length > 0 ||
    includeUntagged ||
    selectedProfileId !== null;
  const totalLinkCount = linksWithTags.length;
  const selectedLinkCount = selectedLinkIds.length;

  const bulkAssignActive = selectionMode && selectedLinkCount > 0;

  const [bulkActionToast, setBulkActionToast] = useState<string | null>(null);
  const bulkToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashBulkSuccess = useCallback((message: string) => {
    setBulkActionToast(message);
    if (bulkToastTimerRef.current) {
      clearTimeout(bulkToastTimerRef.current);
    }
    bulkToastTimerRef.current = setTimeout(() => {
      setBulkActionToast(null);
      bulkToastTimerRef.current = null;
    }, 3400);
  }, []);

  useEffect(() => {
    return () => {
      if (bulkToastTimerRef.current) {
        clearTimeout(bulkToastTimerRef.current);
      }
    };
  }, []);

  const emptyTitle = hasActiveFilters ? 'No links match the current filters' : 'No links yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust search, tags, or profile to broaden the results.'
    : 'Search or paste a URL above, then use Add link when it appears.';

  const showOmnibarAdd =
    isUrlLike(searchQuery.trim()) && filteredLinks.length === 0;

  const handleOmnibarAdd = useCallback(async () => {
    const raw = searchQuery.trim();
    const url = normalizeUrlInput(raw);
    if (!url || filteredLinks.length > 0 || !isUrlLike(raw)) return;

    try {
      await createLink.mutateAsync({ url });
      setSearchQuery('');
    } catch {
      // Keep query for retry
    }
  }, [searchQuery, filteredLinks.length, createLink, setSearchQuery]);

  const handleAddSelectedToProfile = useCallback(
    async (profileId: string) => {
      if (selectedLinkIds.length === 0) return;
      const profile = profiles?.find((p) => p.id === profileId);
      const inProfile = profileLinkSets.get(profileId) ?? new Set<string>();
      const newlyAdded = selectedLinkIds.filter((id) => !inProfile.has(id));
      try {
        await addLinksToProfile.mutateAsync({
          profileId,
          linkIds: [...selectedLinkIds],
        });
        const name = profile?.name ?? 'profile';
        if (newlyAdded.length === 0) {
          flashBulkSuccess(`Selection was already in “${name}”.`);
        } else if (newlyAdded.length === selectedLinkIds.length) {
          flashBulkSuccess(
            `Added ${newlyAdded.length} bookmark${newlyAdded.length === 1 ? '' : 's'} to “${name}”.`,
          );
        } else {
          flashBulkSuccess(
            `Added ${newlyAdded.length} bookmark${newlyAdded.length === 1 ? '' : 's'} to “${name}” (${selectedLinkIds.length - newlyAdded.length} already there).`,
          );
        }
      } catch (error) {
        console.error('Failed to add links to profile:', error);
      }
    },
    [
      selectedLinkIds,
      addLinksToProfile,
      profiles,
      profileLinkSets,
      flashBulkSuccess,
    ],
  );

  const handleBulkAddTagToSelection = useCallback(
    async (tagId: string) => {
      if (selectedLinkIds.length === 0) return;
      const tag = tags?.find((t) => t.id === tagId);
      const tagName = tag?.name ?? 'tag';
      let toApply = 0;
      for (const linkId of selectedLinkIds) {
        const link = linksWithTags.find((l) => l.id === linkId);
        if (!link) continue;
        const cur = getTagIdsForLink(link);
        if (!cur.includes(tagId)) {
          toApply += 1;
        }
      }
      if (toApply === 0) {
        flashBulkSuccess(
          `Selection already had “${tagName}”.`,
        );
        return;
      }
      try {
        await Promise.all(
          selectedLinkIds.map(async (linkId) => {
            const link = linksWithTags.find((l) => l.id === linkId);
            if (!link) return;
            const cur = getTagIdsForLink(link);
            if (cur.includes(tagId)) return;
            await setLinkTags.mutateAsync({
              linkId,
              tagIds: [...cur, tagId],
            });
          }),
        );
        flashBulkSuccess(
          `Applied “${tagName}” to ${toApply} bookmark${toApply === 1 ? '' : 's'}.`,
        );
      } catch (error) {
        console.error('Failed to bulk-apply tag:', error);
      }
    },
    [
      selectedLinkIds,
      linksWithTags,
      tags,
      setLinkTags,
      flashBulkSuccess,
    ],
  );

  const handleToggleSelection = useCallback(
    (linkId: string, index: number) => {
      void index;
      toggleLinkSelection(linkId);
    },
    [toggleLinkSelection],
  );

  const handleOpenLink = useCallback((link: LinkWithTag, index: number) => {
    void index;
    openUrlInBackgroundTab(link.url);
  }, []);

  const handleOpenLinkDetails = useCallback(
    (link: LinkWithTag, index: number) => {
      void index;
      setDetailLinkId(link.id);
    },
    [],
  );

  const handleSuperFavoriteHeaderOpen = useCallback((link: LinkWithTag) => {
    openUrlInBackgroundTab(link.url);
  }, []);

  const handleDetailUpdateUrl = useCallback(
    async (url: string) => {
      if (!detailLinkId) return;
      await updateLink.mutateAsync({
        id: detailLinkId,
        updates: { url },
      });
    },
    [detailLinkId, updateLink],
  );

  const handleDetailToggleSuper = useCallback(
    async (next: boolean) => {
      if (!detailLinkId) return;
      await updateLink.mutateAsync({
        id: detailLinkId,
        updates: { is_super_favorite: next },
      });
    },
    [detailLinkId, updateLink],
  );

  const handleDeleteLinkFromDetail = useCallback(async () => {
    if (!detailLinkId) return;
    try {
      await deleteLink.mutateAsync(detailLinkId);
      setDetailLinkId(null);
    } catch {
      /* silent */
    }
  }, [detailLinkId, deleteLink]);

  const handleCreateTag = async (name: string, color: string) => {
    const created = await createTag.mutateAsync({ name, color });
    return created;
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag.mutateAsync(tagId);
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (bulkAssignActive) {
      void handleBulkAddTagToSelection(tagId);
      return;
    }
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleClearTagFilters = () => {
    if (bulkAssignActive) return;
    setSelectedTagIds([]);
    setIncludeUntagged(false);
  };

  const handleClearProfileFilter = useCallback(() => {
    if (bulkAssignActive) return;
    setSelectedProfileId(null);
  }, [bulkAssignActive]);

  const handleToggleProfileFilter = useCallback(
    (profileId: string) => {
      if (bulkAssignActive) {
        void handleAddSelectedToProfile(profileId);
        return;
      }
      setSelectedProfileId((prev) => (prev === profileId ? null : profileId));
    },
    [bulkAssignActive, handleAddSelectedToProfile],
  );

  const handleVisibleLinksChange = useCallback((links: LinkWithTag[]) => {
    setVisibleLinks(links);
  }, []);

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        clearSelectedLinks();
      } else {
        setDetailLinkId(null);
      }
      return next;
    });
  };

  const allLinksKey =
    linksWithTags
      ?.map((link) => link.id)
      .sort()
      .join(',') || '';
  const prevAllLinksKeyRef = useRef<string>('');
  useEffect(() => {
    if (allLinksKey === prevAllLinksKeyRef.current || !allLinksKey) return;
    prevAllLinksKeyRef.current = allLinksKey;

    if (linksWithTags.length > 0) {
      const nextMap: Record<string, ScrapedUrlData> = {};

      linksWithTags.forEach((link) => {
        const cachedData = getCachedScrapedData(queryClient, link.url);
        if (cachedData) {
          nextMap[link.url] = cachedData;
        }
      });

      if (Object.keys(nextMap).length > 0) {
        setScrapedDataMap((prev) => {
          const hasNewData = Object.keys(nextMap).some((url) => !prev[url]);
          if (!hasNewData) return prev;
          return { ...prev, ...nextMap };
        });
      }
    }
  }, [allLinksKey, linksWithTags, queryClient]);

  const scrapingUrlsKey = Array.from(scrapingUrls).sort().join(',');
  const failedUrlsKey = Array.from(failedUrls).sort().join(',');
  const visibleLinksKey = visibleLinks
    .map((link) => link.id)
    .sort()
    .join(',');

  const prevScrapingStateRef = useRef({
    visibleLinksKey: '',
    scrapingUrlsKey: '',
    failedUrlsKey: '',
  });

  useEffect(() => {
    if (!scrapingEnabled || !isLocalDev()) {
      return;
    }

    if (
      visibleLinksKey === prevScrapingStateRef.current.visibleLinksKey &&
      scrapingUrlsKey === prevScrapingStateRef.current.scrapingUrlsKey &&
      failedUrlsKey === prevScrapingStateRef.current.failedUrlsKey
    ) {
      return;
    }

    prevScrapingStateRef.current = {
      visibleLinksKey,
      scrapingUrlsKey,
      failedUrlsKey,
    };

    if (visibleLinks.length > 0) {
      const nextMap: Record<string, ScrapedUrlData> = {};

      const uncachedLinks = visibleLinks.filter((link) => {
        const cached = getCachedScrapedData(queryClient, link.url);
        const isScraping = scrapingUrls.has(link.url);
        const hasFailed = failedUrls.has(link.url);
        return !cached && !isScraping && !hasFailed;
      });

      if (uncachedLinks.length > 0) {
        setScrapingUrls((prev) => {
          const next = new Set(prev);
          uncachedLinks.forEach((link) => next.add(link.url));
          return next;
        });

        const scrapePromises = uncachedLinks.map((link) =>
          urlScraper
            .mutateAsync(link.url)
            .then((data) => {
              setScrapingUrls((prev) => {
                const next = new Set(prev);
                next.delete(link.url);
                return next;
              });
              return { url: link.url, data, success: true };
            })
            .catch((error) => {
              setScrapingUrls((prev) => {
                const next = new Set(prev);
                next.delete(link.url);
                return next;
              });
              setFailedUrls((prev) => new Set(prev).add(link.url));
              console.error(`Failed to scrape ${link.url}:`, error);
              return { url: link.url, data: null, success: false };
            }),
        );

        Promise.allSettled(scrapePromises).then((results) => {
          results.forEach((result) => {
            if (
              result.status === 'fulfilled' &&
              result.value.success &&
              result.value.data
            ) {
              nextMap[result.value.url] = result.value.data;
            }
          });

          if (Object.keys(nextMap).length > 0) {
            setScrapedDataMap((prev) => ({ ...prev, ...nextMap }));
          }
        });
      }
    }
  }, [failedUrls, failedUrlsKey, queryClient, scrapingEnabled, scrapingUrls, scrapingUrlsKey, urlScraper, visibleLinks, visibleLinksKey]);

  const filteredLinksKey = filteredLinks
    .map((link) => link.id)
    .sort()
    .join(',');
  const prevRefetchKeyRef = useRef<string>('');
  useEffect(() => {
    if (!scrapingEnabled || !isLocalDev()) {
      return;
    }

    if (filteredLinksKey === prevRefetchKeyRef.current || !filteredLinksKey) return;
    prevRefetchKeyRef.current = filteredLinksKey;

    if (filteredLinks.length > 0) {
      const refetchPromises = filteredLinks.map((link) =>
        urlScraperApi
          .scrape(link.url)
          .then((data) => {
            queryClient.setQueryData(['scraper', link.url], data);
            setScrapedDataMap((prev) => ({ ...prev, [link.url]: data }));
            return { url: link.url, success: true };
          })
          .catch((error) => {
            console.error(`Failed to refetch scrape data for ${link.url}:`, error);
            return { url: link.url, success: false };
          }),
      );

      Promise.allSettled(refetchPromises);
    }
  }, [filteredLinks, filteredLinksKey, queryClient, scrapingEnabled]);

  useEffect(() => {
    if (detailLinkId && !linksWithTags.some((l) => l.id === detailLinkId)) {
      setDetailLinkId(null);
    }
  }, [detailLinkId, linksWithTags]);

  useEffect(() => {
    clearSelectedLinks();
    setSelectionMode(false);
    setDetailLinkId(null);
  }, [searchQuery, selectedTagIds, includeUntagged, selectedProfileId, clearSelectedLinks]);

  const bookmarkFeedMainInner = () => (
    <div className="bookmark-feed-main-inner">
      <div className="bookmark-list-panel-stack">
        <div
          className={
            selectionMode
              ? 'bookmark-list-panel is-selection-mode'
              : 'bookmark-list-panel'
          }
        >
          <LinksList
            links={filteredLinks}
            scrapedDataMap={scrapedDataMap}
            onOpenLink={handleOpenLink}
            onOpenLinkDetails={handleOpenLinkDetails}
            activeDetailsLinkId={detailLinkId}
            onVisibleLinksChange={handleVisibleLinksChange}
            selectedLinkIds={selectedLinkIds}
            emptyTitle={emptyTitle}
            emptySubtitle={emptySubtitle}
            onToggleSelect={handleToggleSelection}
            selectionMode={selectionMode}
          />
        </div>
        {detailLink ? (
          <div
            className="bookmark-link-details-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Link details"
          >
            <div className="bookmark-link-details-scroll">
              <LinkDetailsPanel
                link={detailLink}
                scrapedData={scrapedDataMap[detailLink.url]}
                membershipRows={membershipRows ?? []}
                profiles={profiles ?? []}
                availableTags={tags ?? []}
                onBack={() => setDetailLinkId(null)}
                onUpdateUrl={handleDetailUpdateUrl}
                onToggleSuperFavorite={handleDetailToggleSuper}
                onUpdateTags={async (tagIds) => {
                  if (!detailLinkId) return;
                  await setLinkTags.mutateAsync({
                    linkId: detailLinkId,
                    tagIds,
                  });
                }}
                onCreateTag={handleCreateTag}
                onDeleteTag={handleDeleteTag}
                onDeleteLink={handleDeleteLinkFromDetail}
                urlPending={updateLink.isPending}
                superFavoritePending={updateLink.isPending}
                deletePending={deleteLink.isPending}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="bookmark-dashboard">
      <AppHeader
        user={user}
        selectedCount={selectedLinkCount}
        selectionMode={selectionMode}
        onToggleSelectionMode={handleToggleSelectionMode}
        onClearSelection={clearSelectedLinks}
        superFavoriteLinks={superFavoriteLinks}
        scrapedDataMap={scrapedDataMap}
        onSuperFavoriteOpen={handleSuperFavoriteHeaderOpen}
      />

      <div className="bookmark-feed-layout">
        {isNarrow && mobileRail !== 'none' && (
          <button
            type="button"
            className="bookmark-mobile-scrim"
            aria-label="Close panel"
            onClick={() => setMobileRail('none')}
          />
        )}

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
              tags={tags || []}
              selectedTagIds={selectedTagIds}
              includeUntagged={includeUntagged}
              totalCount={totalLinkCount}
              untaggedCount={untaggedCount}
              tagCounts={tagCounts}
              onToggleTag={handleToggleTag}
              onToggleUntagged={() => setIncludeUntagged((prev) => !prev)}
              onClear={handleClearTagFilters}
              bulkAssignMode={bulkAssignActive}
            />
          </div>
        </aside>

        <main className="bookmark-feed-main">
          {isNarrow && (
            <div className="bookmark-mobile-rail-tabs" role="toolbar" aria-label="Open side panels">
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) => (r === 'tags' ? 'none' : 'tags'))
                }
              >
                Tags
              </button>
              <button
                type="button"
                className="bookmark-mobile-rail-tab"
                onClick={() =>
                  setMobileRail((r) =>
                    r === 'profiles' ? 'none' : 'profiles',
                  )
                }
              >
                Profiles
              </button>
            </div>
          )}

          <div className="bookmark-search-panel">
            <BookmarkOmnibar
              value={searchQuery}
              onChange={setSearchQuery}
              showAdd={showOmnibarAdd}
              onAdd={handleOmnibarAdd}
              addPending={createLink.isPending}
              placeholder={`Search ${totalLinkCount} bookmarks…`}
            />
          </div>

          {bulkActionToast !== null && (
            <div
              className="bookmark-bulk-feedback"
              role="status"
              aria-live="polite"
            >
              <span className="bookmark-bulk-feedback-mark" aria-hidden="true">
                OK
              </span>
              <span className="bookmark-bulk-feedback-text">
                {bulkActionToast}
              </span>
            </div>
          )}

          {bookmarkFeedMainInner()}
        </main>

        <aside
          className={`bookmark-rail bookmark-rail--profiles ${
            isNarrow && mobileRail === 'profiles' ? 'is-mobile-open' : ''
          }`}
        >
          {isNarrow && (
            <div className="bookmark-rail-mobile-header">
              <span className="bookmark-rail-mobile-title">Profiles</span>
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
              totalLinkCount={totalLinkCount}
              selectedProfileId={selectedProfileId}
              onClearProfile={handleClearProfileFilter}
              onToggleProfile={handleToggleProfileFilter}
              bulkAssignMode={bulkAssignActive}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
