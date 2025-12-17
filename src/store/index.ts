import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { Project, Link } from '../types/database';

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;

  // Links
  links: Link[];

  // UI State
  searchQuery: string;
  selectedProjectIds: string[];
  selectedLinkIds: string[];
  selectionCursorIndex: number | null;
  lastCursorIndex: number | null;
  isCommandHeld: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;

  setLinks: (links: Link[]) => void;
  addLink: (link: Link) => void;
  updateLink: (id: string, updates: Partial<Link>) => void;
  removeLink: (id: string) => void;

  setSearchQuery: (query: string) => void;
  setSelectedProjectIds: (ids: string[]) => void;
  toggleProject: (projectId: string) => void;
  clearSelectedProjects: () => void;
  setSelectedLinkIds: (ids: string[]) => void;
  toggleLinkSelection: (linkId: string) => void;
  clearSelectedLinks: () => void;
  setSelectionCursorIndex: (index: number | null) => void;
  setLastCursorIndex: (index: number | null) => void;
  setIsCommandHeld: (held: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    subscribeWithSelector((set) => ({
      // Initial state
      projects: [],
      currentProject: null,
      links: [],
      searchQuery: '',
      selectedProjectIds: [],
      selectedLinkIds: [],
      selectionCursorIndex: null,
      lastCursorIndex: null,
      isCommandHeld: false,

      // Project actions
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects],
        })),
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, ...updates }
              : state.currentProject,
        })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject:
            state.currentProject?.id === id ? null : state.currentProject,
        })),

      // Link actions
      setLinks: (links) => set({ links }),
      addLink: (link) =>
        set((state) => ({
          links: [...state.links, link],
        })),
      updateLink: (id, updates) =>
        set((state) => ({
          links: state.links.map((l) =>
            l.id === id ? { ...l, ...updates } : l,
          ),
        })),
      removeLink: (id) =>
        set((state) => ({
          links: state.links.filter((l) => l.id !== id),
        })),

      // UI actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedProjectIds: (ids) => set({ selectedProjectIds: ids }),
      toggleProject: (projectId) =>
        set((state) => {
          if (state.selectedProjectIds.includes(projectId)) {
            return {
              selectedProjectIds: state.selectedProjectIds.filter(
                (id) => id !== projectId,
              ),
            };
          } else {
            return {
              selectedProjectIds: [...state.selectedProjectIds, projectId],
            };
          }
        }),
      clearSelectedProjects: () => set({ selectedProjectIds: [] }),
      setSelectedLinkIds: (ids) => set({ selectedLinkIds: ids }),
      toggleLinkSelection: (linkId) =>
        set((state) => {
          if (state.selectedLinkIds.includes(linkId)) {
            return {
              selectedLinkIds: state.selectedLinkIds.filter(
                (id) => id !== linkId,
              ),
            };
          } else {
            return {
              selectedLinkIds: [...state.selectedLinkIds, linkId],
            };
          }
        }),
      clearSelectedLinks: () => set({ selectedLinkIds: [] }),
      setSelectionCursorIndex: (index) =>
        set({ selectionCursorIndex: index }),
      setLastCursorIndex: (index) => set({ lastCursorIndex: index }),
      setIsCommandHeld: (held) => set({ isCommandHeld: held }),
    })),
    {
      name: 'ex-p02-storage',
      // Only persist selectedProjectIds and searchQuery, not the full projects/links arrays
      partialize: (state) => ({
        selectedProjectIds: state.selectedProjectIds,
        searchQuery: state.searchQuery,
      }),
    },
  ),
);

// Selectors

export const useStarredProjects = () => {
  const projects = useAppStore((state) => state.projects);
  return useMemo(
    () =>
      projects
        .filter((p) => p.is_starred)
        .sort(
          (a, b) =>
            new Date(b.last_modified).getTime() -
            new Date(a.last_modified).getTime(),
        ),
    [projects],
  );
};

export const useUnstarredProjects = () => {
  const projects = useAppStore((state) => state.projects);
  return useMemo(
    () =>
      projects
        .filter((p) => !p.is_starred)
        .sort(
          (a, b) =>
            new Date(b.last_modified).getTime() -
            new Date(a.last_modified).getTime(),
        ),
    [projects],
  );
};
