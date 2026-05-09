import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllLinks, useCreateLink, useDeleteLink } from '../hooks/useLinks';
import { useCreateTag, useDeleteTag, useTags } from '../hooks/useTags';
import { useSetLinkTags } from '../hooks/useLinkTags';
import {
  getCachedScrapedData,
  isLocalDev,
  ScrapedUrlData,
  urlScraperApi,
  useUrlScraper,
} from '../hooks/useUrlScraper';
import { useAddLinksToProfile } from '../hooks/useProfileLinks';
import { useProfiles } from '../hooks/useProfiles';
import { useAppStore } from '../store';
import { LinkWithTag, Tag } from '../types/database';
import { getTagIdsForLink } from '../utils/linkTags';
import supabase from '../supabase';
import AppHeader from '../components/AppHeader';
import BookmarkOmnibar from '../components/BookmarkOmnibar';
import LinksList from '../components/LinksList';
import ProfilesPane from '../components/ProfilesPane';
import TagFilterBar from '../components/TagFilterBar';
import { isUrlLike, normalizeUrlInput } from '../utils/urlInput';

type DashboardView = 'links' | 'profiles';

type MobileRail = 'none' | 'tags' | 'profiles';

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [scrapedDataMap, setScrapedDataMap] = useState<Record<string, ScrapedUrlData>>(
    {},
  );
  const [visibleViews, setVisibleViews] = useState<Record<DashboardView, boolean>>({
    links: true,
    profiles: true,
  });
  const [isTagsCollapsed, setIsTagsCollapsed] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);
  const [visibleLinks, setVisibleLinks] = useState<LinkWithTag[]>([]);
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [mobileRail, setMobileRail] = useState<MobileRail>('none');
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
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const setLinkTags = useSetLinkTags();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const addLinksToProfile = useAddLinksToProfile();
  const urlScraper = useUrlScraper();
  const scrapingEnabled = false;
  const showLinks = visibleViews.links;
  const showProfiles = visibleViews.profiles;

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

  const filteredLinks = useMemo(
    () => linksWithTags.filter((link) => filterBySearch(link) && filterByTags(link)),
    [filterBySearch, filterByTags, linksWithTags],
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
    searchQuery.trim().length > 0 || selectedTagIds.length > 0 || includeUntagged;
  const totalLinkCount = linksWithTags.length;
  const filteredLinkCount = filteredLinks.length;
  const selectedLinkCount = selectedLinkIds.length;
  const totalProfileCount = profiles?.length ?? 0;
  const linkSummaryLabel = selectionMode && selectedLinkCount > 0
    ? `${selectedLinkCount} SELECTED`
    : hasActiveFilters
    ? `FILTERED • ${filteredLinkCount} / ${totalLinkCount}`
    : `ALL • ${totalLinkCount} ITEMS`;
  const profileSummaryLabel = `PROFILES • ${totalProfileCount} ITEMS`;
  const splitSummaryLabel = `LINKS + PROFILES • ${totalLinkCount} ITEMS`;
  const summaryLabel = showLinks && showProfiles
    ? splitSummaryLabel
    : showProfiles
    ? profileSummaryLabel
    : linkSummaryLabel;

  const emptyTitle = hasActiveFilters ? 'No links match the current filters' : 'No links yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust the search or tag filters to broaden the results.'
    : 'Search or paste a URL above, then use Add link when it appears.';

  const showOmnibarAdd =
    showLinks && isUrlLike(searchQuery.trim()) && filteredLinks.length === 0;

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

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
    } catch {
      // Intentionally silent for now.
    }
  };

  const handleUpdateLinkTags = async (linkId: string, tagIds: string[]) => {
    try {
      await setLinkTags.mutateAsync({ linkId, tagIds });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const handleAddSelectedToProfile = useCallback(
    async (profileId: string) => {
      if (selectedLinkIds.length === 0) return;
      await addLinksToProfile.mutateAsync({
        profileId,
        linkIds: [...selectedLinkIds],
      });
    },
    [selectedLinkIds, addLinksToProfile],
  );

  const handleBulkLinkTagDelta = useCallback(
    async (linkIds: string[], delta: { added: string[]; removed: string[] }) => {
      try {
        await Promise.all(
          linkIds.map(async (linkId) => {
            const link = linksWithTags.find((l) => l.id === linkId);
            if (!link) return;
            let next = getTagIdsForLink(link).filter((id) => !delta.removed.includes(id));
            for (const id of delta.added) {
              if (!next.includes(id)) {
                next = [...next, id];
              }
            }
            await setLinkTags.mutateAsync({ linkId, tagIds: next });
          }),
        );
      } catch (error) {
        console.error('Failed to update tags:', error);
      }
    },
    [linksWithTags, setLinkTags],
  );

  const handleToggleSelection = useCallback(
    (linkId: string) => {
      toggleLinkSelection(linkId);
    },
    [toggleLinkSelection],
  );

  const handleOpenLink = useCallback((link: LinkWithTag) => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, []);

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
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleClearTagFilters = () => {
    setSelectedTagIds([]);
    setIncludeUntagged(false);
  };

  const handleVisibleLinksChange = useCallback((links: LinkWithTag[]) => {
    setVisibleLinks(links);
  }, []);

  const handleToggleSelectionMode = () => {
    if (!showLinks && !selectionMode) {
      setVisibleViews((prev) => ({ ...prev, links: true }));
    }

    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        clearSelectedLinks();
      }
      return next;
    });
  };

  const handleToggleView = useCallback(
    (view: DashboardView) => {
      const otherView: DashboardView = view === 'links' ? 'profiles' : 'links';
      const nextValue = !visibleViews[view];

      if (!nextValue && !visibleViews[otherView]) {
        return;
      }

      if (view === 'links' && !nextValue) {
        clearSelectedLinks();
        setSelectionMode(false);
      }

      setVisibleViews((prev) => ({
        ...prev,
        [view]: nextValue,
      }));
    },
    [clearSelectedLinks, visibleViews],
  );

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
    if (!showLinks) {
      return;
    }

    clearSelectedLinks();
    setSelectionMode(false);
  }, [showLinks, searchQuery, selectedTagIds, includeUntagged, clearSelectedLinks]);

  return (
    <div className="bookmark-dashboard">
      <AppHeader
        user={user}
        showLinks={showLinks}
        showProfiles={showProfiles}
        summaryLabel={summaryLabel}
        selectedCount={selectedLinkCount}
        selectionMode={selectionMode}
        profiles={profiles ?? []}
        onAddSelectedToProfile={handleAddSelectedToProfile}
        addToProfilePending={addLinksToProfile.isPending}
        onToggleView={handleToggleView}
        onToggleSelectionMode={handleToggleSelectionMode}
        onClearSelection={clearSelectedLinks}
      />

      <div
        className={`bookmark-feed-layout ${!showProfiles ? 'is-links-only' : ''} ${
          !showLinks ? 'is-profiles-only' : ''
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
              collapsed={isTagsCollapsed}
              onToggleTag={handleToggleTag}
              onToggleUntagged={() => setIncludeUntagged((prev) => !prev)}
              onClear={handleClearTagFilters}
              onToggleCollapsed={() => setIsTagsCollapsed((prev) => !prev)}
            />
          </div>
        </aside>

        <main className="bookmark-feed-main">
          {isNarrow && (showLinks || showProfiles) && (
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
              {showLinks && showProfiles && (
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
              )}
            </div>
          )}

          {(showLinks || showProfiles) && (
            <div className="bookmark-search-panel">
              <BookmarkOmnibar
                value={searchQuery}
                onChange={setSearchQuery}
                showAdd={showOmnibarAdd}
                onAdd={handleOmnibarAdd}
                addPending={createLink.isPending}
                placeholder={
                  showLinks && showProfiles
                    ? `Search ${totalLinkCount} bookmarks…`
                    : showLinks
                    ? 'Search all bookmarks…'
                    : 'Search profiles…'
                }
              />
            </div>
          )}

          <div className="bookmark-feed-main-inner">
            {showLinks && (
              <div
                className={
                  selectionMode ? 'bookmark-list-panel is-selection-mode' : 'bookmark-list-panel'
                }
              >
                <LinksList
                  links={filteredLinks}
                  scrapedDataMap={scrapedDataMap}
                  onDeleteLink={handleDeleteLink}
                  onOpenLink={handleOpenLink}
                  onUpdateLinkTags={handleUpdateLinkTags}
                  onBulkTagDelta={handleBulkLinkTagDelta}
                  availableTags={tags || []}
                  onCreateTag={handleCreateTag}
                  onDeleteTag={handleDeleteTag}
                  onVisibleLinksChange={handleVisibleLinksChange}
                  selectedLinkIds={selectedLinkIds}
                  emptyTitle={emptyTitle}
                  emptySubtitle={emptySubtitle}
                  onToggleSelect={handleToggleSelection}
                  selectionMode={selectionMode}
                />
              </div>
            )}
            {!showLinks && showProfiles && (
              <ProfilesPane
                selectedLinkIds={selectedLinkIds}
                selectionMode={selectionMode}
                searchQuery={searchQuery}
                selectedTagIds={selectedTagIds}
                includeUntagged={includeUntagged}
                scrapedDataMap={scrapedDataMap}
              />
            )}
            {!showLinks && !showProfiles && (
              <div className="bookmark-feed-placeholder">
                <p className="bookmark-feed-placeholder-title">Nothing to show</p>
                <p className="bookmark-feed-placeholder-subtitle">
                  Enable Links or Profiles in the header.
                </p>
              </div>
            )}
          </div>
        </main>

        {showProfiles && showLinks && (
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
              <ProfilesPane
                selectedLinkIds={selectedLinkIds}
                selectionMode={selectionMode}
                searchQuery={searchQuery}
                selectedTagIds={selectedTagIds}
                includeUntagged={includeUntagged}
                scrapedDataMap={scrapedDataMap}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
