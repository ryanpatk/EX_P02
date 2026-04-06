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
import { useProfiles } from '../hooks/useProfiles';
import { useAppStore } from '../store';
import { LinkWithTag, Tag } from '../types/database';
import supabase from '../supabase';
import AppHeader from '../components/AppHeader';
import LinksGrid from '../components/LinksGrid';
import ProfilesPane from '../components/ProfilesPane';
import SearchBar from '../components/SearchBar';
import TagFilterBar from '../components/TagFilterBar';

type GridDensity = 'compact' | 'comfortable';
type DashboardView = 'links' | 'profiles';

const DashboardPage = () => {
  const [user, setUser] = useState<any>(null);
  const [scrapedDataMap, setScrapedDataMap] = useState<Record<string, ScrapedUrlData>>(
    {},
  );
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [activeView, setActiveView] = useState<DashboardView>('links');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [gridDensity, setGridDensity] = useState<GridDensity>('compact');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [visibleLinks, setVisibleLinks] = useState<LinkWithTag[]>([]);
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const newLinkInputRef = useRef<HTMLInputElement>(null);

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
  const urlScraper = useUrlScraper();
  const scrapingEnabled = false;

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
    if (isComposerOpen) {
      requestAnimationFrame(() => {
        newLinkInputRef.current?.focus();
      });
    }
  }, [isComposerOpen]);

  useEffect(() => {
    if (activeView === 'profiles') {
      setIsComposerOpen(false);
    }
  }, [activeView]);

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
  const summaryLabel = activeView === 'profiles' ? profileSummaryLabel : linkSummaryLabel;

  const emptyTitle = hasActiveFilters ? 'No links match the current filters' : 'No links yet';
  const emptySubtitle = hasActiveFilters
    ? 'Adjust the search or tag rail to broaden the results.'
    : 'Use ADD to drop your first bookmark into the library.';

  const handleCreateLink = async () => {
    const url = newLinkUrl.trim();
    if (!url) return;

    setNewLinkUrl('');

    try {
      await createLink.mutateAsync({ url });
      setIsComposerOpen(false);
    } catch {
      setNewLinkUrl(url);
    }
  };

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

  const handleToggleSelection = useCallback(
    (linkId: string, _index: number) => {
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
    if (activeView === 'profiles' && !selectionMode) {
      setActiveView('links');
    }

    setSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        clearSelectedLinks();
      }
      return next;
    });
  };

  const handleFinishSelection = () => {
    clearSelectedLinks();
    setSelectionMode(false);
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
    if (activeView !== 'links') {
      return;
    }

    clearSelectedLinks();
    setSelectionMode(false);
  }, [searchQuery, selectedTagIds, includeUntagged, clearSelectedLinks]);

  return (
    <div className="bookmark-dashboard">
      <AppHeader
        user={user}
        activeView={activeView}
        summaryLabel={summaryLabel}
        selectedCount={selectedLinkCount}
        selectionMode={selectionMode}
        density={gridDensity}
        isComposerOpen={isComposerOpen}
        onSetActiveView={setActiveView}
        onSetDensity={setGridDensity}
        onToggleSelectionMode={handleToggleSelectionMode}
        onToggleComposer={() => setIsComposerOpen((prev) => !prev)}
        onClearSelection={clearSelectedLinks}
      />

      <div className="bookmark-workspace">
        <aside className="bookmark-workspace-rail bookmark-workspace-rail-tags">
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
          />
        </aside>

        <main className="bookmark-main">
          <div className="bookmark-search-panel">
            <SearchBar
              value={activeView === 'links' ? searchQuery : profileSearchQuery}
              onChange={activeView === 'links' ? setSearchQuery : setProfileSearchQuery}
              label={activeView === 'links' ? 'SEARCH ALL:' : 'SEARCH PROFILES:'}
              placeholder={
                activeView === 'links'
                  ? 'Search all bookmarks...'
                  : 'Search profiles...'
              }
            />

            {activeView === 'links' && isComposerOpen && (
              <div className="bookmark-composer">
                <input
                  ref={newLinkInputRef}
                  type="url"
                  value={newLinkUrl}
                  onChange={(event) => setNewLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleCreateLink();
                    }
                    if (event.key === 'Escape') {
                      setIsComposerOpen(false);
                      setNewLinkUrl('');
                    }
                  }}
                  placeholder="Paste a URL to add a bookmark..."
                  className="bookmark-composer-input"
                />
                <div className="bookmark-composer-actions">
                  <button
                    type="button"
                    className="bookmark-composer-button is-primary"
                    onClick={handleCreateLink}
                    disabled={!newLinkUrl.trim() || createLink.isPending}
                  >
                    ADD
                  </button>
                  <button
                    type="button"
                    className="bookmark-composer-button"
                    onClick={() => {
                      setIsComposerOpen(false);
                      setNewLinkUrl('');
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

          {activeView === 'links' ? (
            <>
              <div className="bookmark-grid-panel">
                <LinksGrid
                  links={filteredLinks}
                  scrapedDataMap={scrapedDataMap}
                  onDeleteLink={handleDeleteLink}
                  onOpenLink={handleOpenLink}
                  onUpdateLinkTags={handleUpdateLinkTags}
                  availableTags={tags || []}
                  onCreateTag={handleCreateTag}
                  onDeleteTag={handleDeleteTag}
                  onVisibleLinksChange={handleVisibleLinksChange}
                  selectedLinkIds={selectedLinkIds}
                  emptyTitle={emptyTitle}
                  emptySubtitle={emptySubtitle}
                  onToggleSelect={handleToggleSelection}
                  selectionMode={selectionMode}
                  density={gridDensity}
                />
              </div>

              <button
                type="button"
                className="bookmark-selection-fab is-right-flush"
                onClick={selectionMode ? handleFinishSelection : handleToggleSelectionMode}
              >
                <span className="bookmark-selection-fab-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none">
                    {selectionMode ? (
                      <>
                        <path d="M4 8.25 6.5 10.75 12 5.25" />
                      </>
                    ) : (
                      <>
                        <path d="M3.25 3.25h4.5" />
                        <path d="M3.25 3.25v4.5" />
                        <path d="M12.75 12.75h-4.5" />
                        <path d="M12.75 12.75v-4.5" />
                      </>
                    )}
                  </svg>
                </span>
                <span>{selectionMode ? 'DONE' : 'SELECT'}</span>
              </button>
            </>
          ) : (
            <ProfilesPane
              selectedLinkIds={selectedLinkIds}
              selectionMode={selectionMode}
              searchQuery={profileSearchQuery}
              selectedTagIds={selectedTagIds}
              includeUntagged={includeUntagged}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
