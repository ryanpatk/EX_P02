import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAllLinks,
  useCreateLink,
  useDeleteLink,
} from '../hooks/useLinks';
import { useCreateTag, useTags } from '../hooks/useTags';
import { useSetLinkTags } from '../hooks/useLinkTags';
import {
  useUrlScraper,
  ScrapedUrlData,
  getCachedScrapedData,
  urlScraperApi,
  isLocalDev,
} from '../hooks/useUrlScraper';
import { useAppStore } from '../store';
import { LinkWithTag, Tag } from '../types/database';
import supabase from '../supabase';
import MobileDrawer from '../components/MobileDrawer';
import AppHeader from '../components/AppHeader';
import LinksGrid from '../components/LinksGrid';
import SearchBar from '../components/SearchBar';
import TagFilterBar from '../components/TagFilterBar';
import ProfilesPane from '../components/ProfilesPane';

const DashboardPage = () => {
  const [user, setUser] = useState<any>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [scrapedDataMap, setScrapedDataMap] = useState<
    Record<string, ScrapedUrlData>
  >({});
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const newLinkInputRef = useRef<HTMLInputElement>(null);

  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeUntagged, setIncludeUntagged] = useState(false);

  // Selection state
  const selectedLinkIds = useAppStore((state) => state.selectedLinkIds);
  const selectionCursorIndex = useAppStore(
    (state) => state.selectionCursorIndex,
  );
  const lastCursorIndex = useAppStore((state) => state.lastCursorIndex);
  const isCommandHeld = useAppStore((state) => state.isCommandHeld);
  const setSelectedLinkIds = useAppStore((state) => state.setSelectedLinkIds);
  const toggleLinkSelection = useAppStore((state) => state.toggleLinkSelection);
  const clearSelectedLinks = useAppStore((state) => state.clearSelectedLinks);
  const setSelectionCursorIndex = useAppStore(
    (state) => state.setSelectionCursorIndex,
  );
  const setLastCursorIndex = useAppStore((state) => state.setLastCursorIndex);
  const setIsCommandHeld = useAppStore((state) => state.setIsCommandHeld);

  // Chakra breakpoint: [mobile, tablet, desktop]
  const isMobile = useBreakpointValue([true, true, false]);

  const queryClient = useQueryClient();
  const { data: allLinks } = useAllLinks();
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const setLinkTags = useSetLinkTags();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const urlScraper = useUrlScraper();
  const scrapingEnabled = false;
  const [profilesCollapsed, setProfilesCollapsed] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setProfilesCollapsed(true);
    }
  }, [isMobile]);

  // Get current user with loading state to prevent jank
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setTimeout(() => setUser(user), 100);
    };
    getUser();
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
    [searchQuery, scrapedDataMap],
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
    [selectedTagIds, includeUntagged],
  );

  const filteredLinks = useMemo(() => {
    return linksWithTags.filter((link) => filterBySearch(link) && filterByTags(link));
  }, [linksWithTags, filterBySearch, filterByTags]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedTagIds.length > 0 || includeUntagged;

  const emptyTitle = hasActiveFilters
    ? 'No links match your filters'
    : 'No links yet';
  const emptySubtitle = hasActiveFilters
    ? 'Try adjusting the search or tag filters'
    : 'Add a link to start building your library';

  const handleCreateLink = async () => {
    const url = newLinkUrl.trim();
    if (!url) return;

    setNewLinkUrl('');

    try {
      await createLink.mutateAsync({
        url,
      });
    } catch {
      setNewLinkUrl(url);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
    } catch {
      // Silently fail for now; could show a toast in future
    }
  };

  const handleUpdateLinkTags = async (linkId: string, tagIds: string[]) => {
    try {
      await setLinkTags.mutateAsync({ linkId, tagIds });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const handleToggleSelection = (linkId: string, index: number) => {
    toggleLinkSelection(linkId);
    setSelectionCursorIndex(index);
    setLastCursorIndex(index);
  };

  const handleCreateTag = async (name: string, color: string) => {
    const created = await createTag.mutateAsync({ name, color });
    return created;
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleClearTags = () => {
    setSelectedTagIds([]);
    setIncludeUntagged(false);
  };

  // Track visible links for scraping
  const [visibleLinks, setVisibleLinks] = useState<LinkWithTag[]>([]);
  const [scrapingUrls, setScrapingUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Stable callback for visible links change
  const handleVisibleLinksChange = useCallback((links: LinkWithTag[]) => {
    setVisibleLinks(links);
  }, []);

  // Load cached scraped data for ALL links immediately when links change
  const allLinksKey =
    linksWithTags
      ?.map((l) => l.id)
      .sort()
      .join(',') || '';
  const prevAllLinksKeyRef = useRef<string>('');
  useEffect(() => {
    if (allLinksKey === prevAllLinksKeyRef.current || !allLinksKey) return;
    prevAllLinksKeyRef.current = allLinksKey;

    if (linksWithTags && linksWithTags.length > 0) {
      const newMap: Record<string, ScrapedUrlData> = {};

      linksWithTags.forEach((link) => {
        const cachedData = getCachedScrapedData(queryClient, link.url);
        if (cachedData) {
          newMap[link.url] = cachedData;
        }
      });

      if (Object.keys(newMap).length > 0) {
        setScrapedDataMap((prev) => {
          const hasNewData = Object.keys(newMap).some((url) => !prev[url]);
          if (!hasNewData) return prev;
          return { ...prev, ...newMap };
        });
      }
    }
  }, [allLinksKey, linksWithTags, queryClient]);

  const scrapingUrlsKey = Array.from(scrapingUrls).sort().join(',');
  const failedUrlsKey = Array.from(failedUrls).sort().join(',');
  const visibleLinksKey = visibleLinks
    .map((l) => l.id)
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

    if (visibleLinks && visibleLinks.length > 0) {
      const newMap: Record<string, ScrapedUrlData> = {};

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
              newMap[result.value.url] = result.value.data;
            }
          });
          if (Object.keys(newMap).length > 0) {
            setScrapedDataMap((prev) => ({ ...prev, ...newMap }));
          }
        });
      }
    }
  }, [visibleLinksKey, scrapingUrlsKey, failedUrlsKey, queryClient]);

  const filteredLinksKey = filteredLinks
    .map((l) => l.id)
    .sort()
    .join(',');
  const prevRefetchKeyRef = useRef<string>('');
  useEffect(() => {
    if (!scrapingEnabled || !isLocalDev()) {
      return;
    }

    if (filteredLinksKey === prevRefetchKeyRef.current || !filteredLinksKey)
      return;
    prevRefetchKeyRef.current = filteredLinksKey;

    if (filteredLinks && filteredLinks.length > 0) {
      const refetchPromises = filteredLinks.map((link) =>
        urlScraperApi
          .scrape(link.url)
          .then((data) => {
            queryClient.setQueryData(['scraper', link.url], data);
            setScrapedDataMap((prev) => ({ ...prev, [link.url]: data }));
            return { url: link.url, success: true };
          })
          .catch((error) => {
            console.error(
              `Failed to refetch scrape data for ${link.url}:`,
              error,
            );
            return { url: link.url, success: false };
          }),
      );

      Promise.allSettled(refetchPromises);
    }
  }, [filteredLinksKey, queryClient]);

  const [gridColumns, setGridColumns] = useState(4);

  useEffect(() => {
    setLastCursorIndex(null);
    setSelectionCursorIndex(null);
    clearSelectedLinks();
  }, [searchQuery, selectedTagIds, includeUntagged, setLastCursorIndex, setSelectionCursorIndex, clearSelectedLinks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.metaKey && e.key === 'Enter') {
          e.preventDefault();
          if (selectedLinkIds.length > 0) {
            selectedLinkIds.forEach((linkId) => {
              const link = filteredLinks.find((l) => l.id === linkId);
              if (link) {
                window.open(link.url, '_blank', 'noopener,noreferrer');
              }
            });
          }
          return;
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && !e.shiftKey && !isCommandHeld) {
        setIsCommandHeld(true);
        if (selectionCursorIndex === null && filteredLinks.length > 0) {
          const restoreIndex =
            lastCursorIndex !== null && lastCursorIndex < filteredLinks.length
              ? lastCursorIndex
              : 0;
          setSelectionCursorIndex(restoreIndex);
        }
      }

      if (!cmdKey) {
        if (e.key === 'Escape') {
          clearSelectedLinks();
          setSelectionCursorIndex(null);
        }
        return;
      }

      if (cmdKey && e.key === 'Enter' && selectedLinkIds.length > 0) {
        e.preventDefault();
        selectedLinkIds.forEach((linkId) => {
          const link = filteredLinks.find((l) => l.id === linkId);
          if (link) {
            window.open(link.url, '_blank', 'noopener,noreferrer');
          }
        });
        return;
      }

      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const currentIndex =
          selectionCursorIndex !== null ? selectionCursorIndex : 0;

        let newIndex = currentIndex;
        switch (e.key) {
          case 'ArrowUp':
            newIndex = Math.max(0, currentIndex - gridColumns);
            break;
          case 'ArrowDown':
            newIndex = Math.min(
              filteredLinks.length - 1,
              currentIndex + gridColumns,
            );
            break;
          case 'ArrowLeft':
            newIndex = Math.max(0, currentIndex - 1);
            break;
          case 'ArrowRight':
            newIndex = Math.min(filteredLinks.length - 1, currentIndex + 1);
            break;
        }

        setSelectionCursorIndex(newIndex);

        if (e.shiftKey) {
          const newSelectedIds = new Set(selectedLinkIds);
          if (filteredLinks[newIndex]) {
            newSelectedIds.add(filteredLinks[newIndex].id);
          }
          setSelectedLinkIds(Array.from(newSelectedIds));
        }
        return;
      }

      if (cmdKey && e.shiftKey) {
        if (e.key.startsWith('Arrow')) {
          return;
        }
        if (
          selectionCursorIndex !== null &&
          filteredLinks[selectionCursorIndex]
        ) {
          e.preventDefault();
          toggleLinkSelection(filteredLinks[selectionCursorIndex].id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdKey && isCommandHeld) {
        if (selectionCursorIndex !== null) {
          setLastCursorIndex(selectionCursorIndex);
        }
        setIsCommandHeld(false);
        setSelectionCursorIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isCommandHeld,
    selectionCursorIndex,
    lastCursorIndex,
    selectedLinkIds,
    filteredLinks,
    gridColumns,
    setIsCommandHeld,
    setSelectionCursorIndex,
    setLastCursorIndex,
    toggleLinkSelection,
    setSelectedLinkIds,
    clearSelectedLinks,
  ]);

  return (
    <div className="app-shell h-screen flex flex-col overflow-hidden">
      <AppHeader
        user={user}
        isMobile={isMobile || false}
        onMobileMenuClick={() => setIsMobileDrawerOpen(true)}
        isCommandHeld={isCommandHeld}
      />

      <div className="split-view flex-1 overflow-hidden">
        <section className="links-pane">
          <div className="links-pane-header">
            <div className="links-pane-title">
              <div>
                <p className="pane-title">All Links</p>
                <p className="pane-subtitle">Everything, everywhere, sorted by tags.</p>
              </div>
              <div className="links-pane-actions">
                <div className="link-add">
                  <input
                    ref={newLinkInputRef}
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateLink();
                      }
                    }}
                    placeholder="Paste a link and hit Enter..."
                    className="link-add-input"
                  />
                  <button
                    type="button"
                    onClick={handleCreateLink}
                    className="link-add-button"
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setProfilesCollapsed((prev) => !prev)}
                  className="profiles-toggle-button"
                >
                  {profilesCollapsed ? 'Show profiles' : 'Hide profiles'}
                </button>
              </div>
            </div>
            <div className="links-pane-controls">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <TagFilterBar
              tags={tags || []}
              selectedTagIds={selectedTagIds}
              includeUntagged={includeUntagged}
              onToggleTag={handleToggleTag}
              onToggleUntagged={() => setIncludeUntagged((prev) => !prev)}
              onClear={handleClearTags}
            />
          </div>

          <div className="links-pane-body">
            <LinksGrid
              links={filteredLinks}
              scrapedDataMap={scrapedDataMap}
              onDeleteLink={handleDeleteLink}
              onUpdateLinkTags={handleUpdateLinkTags}
              availableTags={tags || []}
              onCreateTag={handleCreateTag}
              onVisibleLinksChange={handleVisibleLinksChange}
              selectedLinkIds={selectedLinkIds}
              cursorIndex={isCommandHeld ? selectionCursorIndex : null}
              emptyTitle={emptyTitle}
              emptySubtitle={emptySubtitle}
              onColumnChange={setGridColumns}
              onToggleSelect={handleToggleSelection}
            />
          </div>
        </section>

        <aside
          className={`profiles-pane-wrapper ${profilesCollapsed ? 'is-collapsed' : ''}`}
        >
          {profilesCollapsed ? (
            <button
              type="button"
              onClick={() => setProfilesCollapsed(false)}
              className="profiles-rail-button"
            >
              Profiles
            </button>
          ) : (
            <div className="profiles-pane-inner">
              <button
                type="button"
                onClick={() => setProfilesCollapsed(true)}
                className="profiles-collapse-button"
              >
                Collapse
              </button>
              <ProfilesPane selectedLinkIds={selectedLinkIds} />
            </div>
          )}
        </aside>
      </div>

      {user && isMobile && (
        <MobileDrawer
          user={user}
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
