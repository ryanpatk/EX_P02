import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useBreakpointValue } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  projectKeys,
} from '../hooks/useProjects';
import {
  useProjectsLinks,
  useCreateLink,
  useDeleteLink,
  useUpdateLink,
} from '../hooks/useLinks';
import {
  useUrlScraper,
  ScrapedUrlData,
  getCachedScrapedData,
  urlScraperApi,
  isLocalDev,
} from '../hooks/useUrlScraper';
import { useAppStore } from '../store';
import { CreateProjectData, LinkWithTag } from '../types/database';
import supabase from '../supabase';
import MobileDrawer from '../components/MobileDrawer';
import AppHeader from '../components/AppHeader';
import ProjectsList from '../components/ProjectsList';
import NewProjectButton from '../components/NewProjectButton';
import ProjectsHeader from '../components/ProjectsHeader';
import LinksGrid from '../components/LinksGrid';

const DashboardPage = () => {
  const [user, setUser] = useState<any>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const selectedProjectIds = useAppStore((state) => state.selectedProjectIds);
  const setSelectedProjectIds = useAppStore(
    (state) => state.setSelectedProjectIds,
  );
  const toggleProject = useAppStore((state) => state.toggleProject);
  const [editingProjectName, setEditingProjectName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState(false);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const newLinkInputRef = useRef<HTMLInputElement>(null);
  const [scrapedDataMap, setScrapedDataMap] = useState<
    Record<string, ScrapedUrlData>
  >({});
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);

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
  const { data: projects, isLoading } = useProjects();
  const { data: allLinks } = useProjectsLinks(selectedProjectIds);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const updateLink = useUpdateLink();
  const urlScraper = useUrlScraper();

  // Get current user with loading state to prevent jank
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Small delay to prevent visual jank
      setTimeout(() => setUser(user), 100);
    };
    getUser();
  }, []);

  // Filter links by search query
  const filteredLinks =
    allLinks?.filter((link) => {
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
    }) || [];

  // Focus project name input when a newly created project is selected
  useEffect(() => {
    if (isEditingName && projectNameInputRef.current) {
      projectNameInputRef.current.focus();
      projectNameInputRef.current.select();
    }
  }, [isEditingName]);

  // Focus new link input when it expands
  useEffect(() => {
    if (isAddingLink && newLinkInputRef.current) {
      newLinkInputRef.current.focus();
    }
  }, [isAddingLink]);

  const handleCreateProject = async () => {
    const projectData: CreateProjectData = {
      name: 'new project',
      is_starred: false,
    };

    try {
      const newProject = await createProject.mutateAsync(projectData);
      // Auto-select the newly created project
      if (newProject) {
        setSelectedProjectIds([newProject.id]);
        // Set editing state and name, then focus will happen via useEffect
        setEditingProjectName(newProject.name);
        setIsEditingName(true);
      }
    } catch (error) {}
  };

  const handleToggleProject = (projectId: string) => {
    toggleProject(projectId);
  };

  const handleOpenAll = () => {
    filteredLinks.forEach((link) => {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    });
  };

  const handleUpdateProjectName = async (
    newName: string,
    projectId?: string,
  ) => {
    const projectIdToUpdate = projectId || selectedProjectIds[0];
    if (!projectIdToUpdate || !newName.trim()) return;

    try {
      await updateProject.mutateAsync({
        id: projectIdToUpdate,
        updates: { name: newName.trim() },
      });
      setIsEditingName(false);
    } catch (error) {}
  };

  const handleCreateLinkForSelectedProject = async () => {
    if (selectedProjectIds.length !== 1) return;
    const url = newLinkUrl.trim();
    if (!url) return;

    // Optimistically clear the input
    const urlToCreate = url;
    setNewLinkUrl('');

    try {
      await createLink.mutateAsync({
        project_id: selectedProjectIds[0],
        url: urlToCreate,
      });
      setIsAddingLink(false);
    } catch {
      // Restore the URL on error
      setNewLinkUrl(urlToCreate);
      // Silently fail for now; could show a toast in future
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink.mutateAsync(linkId);
    } catch {
      // Silently fail for now; could show a toast in future
    }
  };

  const handleUpdateLinkProject = async (
    linkId: string,
    projectId: string | null,
  ) => {
    try {
      // Find the current link to get the old project ID
      const currentLink = allLinks?.find((l) => l.id === linkId);
      const oldProjectId = currentLink?.project_id || undefined;

      // Optimistically update project link counts
      if (projects) {
        queryClient.setQueryData(projectKeys.lists(), (oldData: any) => {
          if (!oldData) return oldData;

          return oldData.map((project: any) => {
            // Decrement count for old project
            if (oldProjectId && project.id === oldProjectId) {
              const currentCount = project.links?.[0]?.count || 0;
              return {
                ...project,
                links: [{ count: Math.max(0, currentCount - 1) }],
              };
            }
            // Increment count for new project
            if (projectId && project.id === projectId) {
              const currentCount = project.links?.[0]?.count || 0;
              return {
                ...project,
                links: [{ count: currentCount + 1 }],
              };
            }
            return project;
          });
        });
      }

      await updateLink.mutateAsync({
        id: linkId,
        updates: { project_id: projectId || undefined },
        oldProjectId,
      });
    } catch {
      // On error, invalidate to refetch correct data
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    }
  };

  const handleToggleStar = async (projectId: string, isStarred: boolean) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { is_starred: !isStarred },
      });
    } catch (error) {}
  };

  const selectedProjects =
    projects?.filter((p) => selectedProjectIds.includes(p.id)) || [];
  const singleSelectedProject =
    selectedProjects.length === 1 ? selectedProjects[0] : null;

  // Create stable string keys for dependency tracking
  const selectedProjectIdsKey = useMemo(
    () => selectedProjectIds.sort().join(','),
    [selectedProjectIds],
  );

  // Reset cursor position when projects change
  useEffect(() => {
    setLastCursorIndex(null);
    setSelectionCursorIndex(null);
  }, [selectedProjectIdsKey, setLastCursorIndex, setSelectionCursorIndex]);

  // Track which project is being edited
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Update editing name when selected project changes (but don't reset if we're editing)
  const singleSelectedProjectId = singleSelectedProject?.id;
  const singleSelectedProjectName = singleSelectedProject?.name;
  const selectedProjectNamesKey = selectedProjects
    .map((p) => `${p.id}:${p.name}`)
    .sort()
    .join('|');

  const prevStateRef = useRef({
    editingProjectId: null as string | null,
    singleSelectedProjectId: undefined as string | undefined,
    isEditingName: false,
    selectedProjectIdsKey: '',
    selectedProjectNamesKey: '',
  });

  useEffect(() => {
    // Skip if currently editing
    if (isEditingName) {
      prevStateRef.current = {
        editingProjectId,
        singleSelectedProjectId,
        isEditingName,
        selectedProjectIdsKey,
        selectedProjectNamesKey,
      };
      return;
    }

    // Check if relevant state actually changed
    const stateChanged =
      prevStateRef.current.editingProjectId !== editingProjectId ||
      prevStateRef.current.singleSelectedProjectId !==
        singleSelectedProjectId ||
      prevStateRef.current.isEditingName !== isEditingName ||
      prevStateRef.current.selectedProjectIdsKey !== selectedProjectIdsKey ||
      prevStateRef.current.selectedProjectNamesKey !== selectedProjectNamesKey;

    if (!stateChanged) return;

    // Update the ref
    prevStateRef.current = {
      editingProjectId,
      singleSelectedProjectId,
      isEditingName,
      selectedProjectIdsKey,
      selectedProjectNamesKey,
    };

    // Find the project name to use
    let targetName: string | undefined;
    if (editingProjectId) {
      const editingProject = selectedProjects.find(
        (p) => p.id === editingProjectId,
      );
      targetName = editingProject?.name;
    } else if (singleSelectedProjectId) {
      targetName = singleSelectedProjectName;
    }

    // Update the name only if it's different
    if (targetName && targetName !== editingProjectName) {
      setEditingProjectName(targetName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editingProjectId,
    singleSelectedProjectId,
    singleSelectedProjectName,
    isEditingName,
    editingProjectName,
    selectedProjectIdsKey,
    selectedProjectNamesKey,
  ]);

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
    allLinks
      ?.map((l) => l.id)
      .sort()
      .join(',') || '';
  const prevAllLinksKeyRef = useRef<string>('');
  useEffect(() => {
    // Only run if the actual link IDs changed
    if (allLinksKey === prevAllLinksKeyRef.current || !allLinksKey) return;
    prevAllLinksKeyRef.current = allLinksKey;

    if (allLinks && allLinks.length > 0) {
      const newMap: Record<string, ScrapedUrlData> = {};

      // Load all cached data immediately so links display right away
      allLinks.forEach((link) => {
        const cachedData = getCachedScrapedData(queryClient, link.url);
        if (cachedData) {
          newMap[link.url] = cachedData;
        }
      });

      // Update map with cached data immediately (only if there's new data)
      if (Object.keys(newMap).length > 0) {
        setScrapedDataMap((prev) => {
          // Check if we're actually adding new data
          const hasNewData = Object.keys(newMap).some((url) => !prev[url]);
          if (!hasNewData) return prev;
          return { ...prev, ...newMap };
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLinksKey, queryClient]);

  // Create stable keys for Sets and visible links to avoid infinite loops
  const scrapingUrlsKey = Array.from(scrapingUrls).sort().join(',');
  const failedUrlsKey = Array.from(failedUrls).sort().join(',');
  const visibleLinksKey = visibleLinks
    .map((l) => l.id)
    .sort()
    .join(',');

  // Scrape URLs for visible links only (only if not cached and not already scraping/failed)
  const prevScrapingStateRef = useRef({
    visibleLinksKey: '',
    scrapingUrlsKey: '',
    failedUrlsKey: '',
  });
  useEffect(() => {
    // Skip scraping if not in local dev mode
    if (!isLocalDev()) {
      return;
    }

    // Only run if visible links actually changed
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

      // Only scrape visible URLs that aren't cached, not currently scraping, and haven't failed
      const uncachedLinks = visibleLinks.filter((link) => {
        const cached = getCachedScrapedData(queryClient, link.url);
        const isScraping = scrapingUrls.has(link.url);
        const hasFailed = failedUrls.has(link.url);
        return !cached && !isScraping && !hasFailed;
      });

      if (uncachedLinks.length > 0) {
        // Mark URLs as scraping
        setScrapingUrls((prev) => {
          const next = new Set(prev);
          uncachedLinks.forEach((link) => next.add(link.url));
          return next;
        });

        const scrapePromises = uncachedLinks.map((link) =>
          urlScraper
            .mutateAsync(link.url)
            .then((data) => {
              // Remove from scraping set
              setScrapingUrls((prev) => {
                const next = new Set(prev);
                next.delete(link.url);
                return next;
              });
              return { url: link.url, data, success: true };
            })
            .catch((error) => {
              // Remove from scraping set and add to failed set
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
          // Update map with newly scraped data
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLinksKey, scrapingUrlsKey, failedUrlsKey, queryClient]);

  // Refetch scraped data on mount and when filtered links change (to get fresh data from updated endpoint)
  const filteredLinksKey = filteredLinks
    .map((l) => l.id)
    .sort()
    .join(',');
  const prevRefetchKeyRef = useRef<string>('');
  useEffect(() => {
    // Skip refetching if not in local dev mode
    if (!isLocalDev()) {
      return;
    }

    // Only refetch if the set of filtered links actually changed
    if (filteredLinksKey === prevRefetchKeyRef.current || !filteredLinksKey)
      return;
    prevRefetchKeyRef.current = filteredLinksKey;

    // Refetch all filtered links (even if cached) to get fresh data from updated endpoint
    if (filteredLinks && filteredLinks.length > 0) {
      // Force refetch all filtered links by fetching fresh data and updating cache
      const refetchPromises = filteredLinks.map((link) =>
        urlScraperApi
          .scrape(link.url)
          .then((data) => {
            // Update the cache with fresh data
            queryClient.setQueryData(['scraper', link.url], data);
            // Update the local state
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

      // Don't await - let it run in background
      Promise.allSettled(refetchPromises);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLinksKey, queryClient]);

  // Calculate columns for navigation (same logic as LinksGrid)
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = useMemo(() => {
    if (windowWidth < 640) return 2; // Mobile
    if (windowWidth < 1024) return 3; // Tablet
    return 4; // Desktop
  }, [windowWidth]);

  // Keyboard handlers for multi-select
  useEffect(() => {
    // Don't handle keyboard events if user is typing in an input
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow CMD+ENTER even in inputs to open selected links
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

      // CMD key down - show cursor
      if (cmdKey && !e.shiftKey && !isCommandHeld) {
        setIsCommandHeld(true);
        // Restore cursor to last position, or first link if no last position
        if (selectionCursorIndex === null && filteredLinks.length > 0) {
          const restoreIndex =
            lastCursorIndex !== null && lastCursorIndex < filteredLinks.length
              ? lastCursorIndex
              : 0;
          setSelectionCursorIndex(restoreIndex);
        }
      }

      // Only handle navigation/selection if CMD is held
      if (!cmdKey) {
        // ESC to clear selection (works even without CMD)
        if (e.key === 'Escape') {
          clearSelectedLinks();
          setSelectionCursorIndex(null);
        }
        return;
      }

      // CMD+ENTER - open all selected links
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

      // Arrow key navigation
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const currentIndex =
          selectionCursorIndex !== null ? selectionCursorIndex : 0;

        let newIndex = currentIndex;
        switch (e.key) {
          case 'ArrowUp':
            newIndex = Math.max(0, currentIndex - columns);
            break;
          case 'ArrowDown':
            newIndex = Math.min(
              filteredLinks.length - 1,
              currentIndex + columns,
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

        // CMD+SHIFT+Arrow - select only the target item (not the entire range)
        if (e.shiftKey) {
          const newSelectedIds = new Set(selectedLinkIds);
          // Only select the new target item
          if (filteredLinks[newIndex]) {
            newSelectedIds.add(filteredLinks[newIndex].id);
          }
          setSelectedLinkIds(Array.from(newSelectedIds));
        }
        return;
      }

      // CMD+SHIFT - toggle selection at cursor
      // Handle both Shift key press and other keys with Shift modifier
      if (cmdKey && e.shiftKey) {
        // If it's an arrow key, range selection is already handled above
        if (e.key.startsWith('Arrow')) {
          return;
        }
        // For Shift key itself or other keys, toggle selection at cursor
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

      // CMD key released - save current cursor position before hiding
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
    columns,
    setIsCommandHeld,
    setSelectionCursorIndex,
    setLastCursorIndex,
    toggleLinkSelection,
    setSelectedLinkIds,
    clearSelectedLinks,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <AppHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        isMobile={isMobile || false}
        onMobileMenuClick={() => setIsMobileDrawerOpen(true)}
        isCommandHeld={isCommandHeld}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Project List */}
        {!isMobile && (
          <div className="w-75 border-r border-medium-grey overflow-y-auto flex flex-col relative bg-white">
            <ProjectsList
              projects={projects || []}
              selectedProjectIds={selectedProjectIds}
              onToggleProject={handleToggleProject}
              onToggleStar={handleToggleStar}
            />
            <NewProjectButton
              onClick={handleCreateProject}
              disabled={createProject.isPending}
            />
          </div>
        )}

        {/* Right Content Area - Selected Project or Empty State */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {selectedProjects.length > 0 && (
            <ProjectsHeader
              selectedProjects={selectedProjects}
              isEditingName={isEditingName}
              editingProjectName={editingProjectName}
              editingProjectId={editingProjectId}
              singleSelectedProject={singleSelectedProject}
              onToggleProject={handleToggleProject}
              onToggleStar={handleToggleStar}
              onStartEditing={(project) => {
                setIsEditingName(true);
                setEditingProjectId(project.id);
                setEditingProjectName(project.name);
              }}
              onUpdateProjectName={(newName) => {
                if (editingProjectId) {
                  handleUpdateProjectName(newName, editingProjectId);
                }
              }}
              onStopEditing={() => {
                setIsEditingName(false);
                setEditingProjectId(null);
                const currentProject = selectedProjects.find(
                  (p) => p.id === editingProjectId,
                );
                setEditingProjectName(
                  currentProject?.name || singleSelectedProject?.name || '',
                );
              }}
              onEditingNameChange={setEditingProjectName}
              projectNameInputRef={projectNameInputRef}
            />
          )}

          {/* Project Content Grid */}
          <div className="flex-1 overflow-hidden relative">
            <LinksGrid
              links={filteredLinks}
              scrapedDataMap={scrapedDataMap}
              onDeleteLink={handleDeleteLink}
              onUpdateLinkProject={handleUpdateLinkProject}
              projects={projects || []}
              selectedProjectsCount={selectedProjects.length}
              onOpenAll={handleOpenAll}
              filteredLinksCount={filteredLinks.length}
              onVisibleLinksChange={handleVisibleLinksChange}
              selectedLinkIds={selectedLinkIds}
              cursorIndex={isCommandHeld ? selectionCursorIndex : null}
            />

            {/* Floating New Link Button / Input */}
            {selectedProjectIds.length === 1 && (
              <div
                className={`fixed bottom-10 right-6 z-40 flex items-center transition-all duration-300 ${
                  isAddingLink
                    ? 'w-[320px] h-12 rounded-sm bg-white border border-medium-grey px-3'
                    : 'w-12 h-12 rounded-sm bg-white border border-medium-grey text-black'
                }`}
              >
                {isAddingLink ? (
                  <>
                    <span className="text-lg font-bold mr-2">+</span>
                    <input
                      ref={newLinkInputRef}
                      type="url"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateLinkForSelectedProject();
                        } else if (e.key === 'Escape') {
                          setIsAddingLink(false);
                          setNewLinkUrl('');
                        }
                      }}
                      placeholder="Paste a link and press Enter..."
                      className="flex-1 bg-transparent border-none outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingLink(false);
                        setNewLinkUrl('');
                      }}
                      className="ml-2 text-sm text-gray-500 hover:text-black cursor-pointer"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingLink(true)}
                    className="w-full h-full flex items-center justify-center text-lg font-bold leading-none cursor-pointer"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
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
