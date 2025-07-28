import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useMemo } from 'react'
import { Project, Note, Link } from '../types/database'

interface AppState {
  // Projects
  projects: Project[]
  currentProject: Project | null
  
  // Notes
  notes: Note[]
  currentNoteIndex: number
  
  // Links
  links: Link[]
  
  // UI State
  leftPaneExpanded: boolean
  rightPaneExpanded: boolean
  searchQuery: string
  
  // Actions
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void
  
  setNotes: (notes: Note[]) => void
  setCurrentNoteIndex: (index: number) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  removeNote: (id: string) => void
  
  setLinks: (links: Link[]) => void
  addLink: (link: Link) => void
  updateLink: (id: string, updates: Partial<Link>) => void
  removeLink: (id: string) => void
  
  setLeftPaneExpanded: (expanded: boolean) => void
  setRightPaneExpanded: (expanded: boolean) => void
  setSearchQuery: (query: string) => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
  // Initial state
  projects: [],
  currentProject: null,
  notes: [],
  currentNoteIndex: 0,
  links: [],
  leftPaneExpanded: true,
  rightPaneExpanded: true,
  searchQuery: '',
  
  // Project actions
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects] 
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    currentProject: state.currentProject?.id === id 
      ? { ...state.currentProject, ...updates } 
      : state.currentProject
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    currentProject: state.currentProject?.id === id ? null : state.currentProject
  })),
  
  // Note actions
  setNotes: (notes) => set({ notes, currentNoteIndex: 0 }),
  setCurrentNoteIndex: (index) => set({ currentNoteIndex: index }),
  addNote: (note) => set((state) => ({ 
    notes: [...state.notes, note] 
  })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
  })),
  removeNote: (id) => set((state) => {
    const newNotes = state.notes.filter(n => n.id !== id)
    const newIndex = Math.min(state.currentNoteIndex, Math.max(0, newNotes.length - 1))
    return { notes: newNotes, currentNoteIndex: newIndex }
  }),
  
  // Link actions
  setLinks: (links) => set({ links }),
  addLink: (link) => set((state) => ({ 
    links: [...state.links, link] 
  })),
  updateLink: (id, updates) => set((state) => ({
    links: state.links.map(l => l.id === id ? { ...l, ...updates } : l)
  })),
  removeLink: (id) => set((state) => ({
    links: state.links.filter(l => l.id !== id)
  })),
  
  // UI actions
  setLeftPaneExpanded: (expanded) => set({ leftPaneExpanded: expanded }),
  setRightPaneExpanded: (expanded) => set({ rightPaneExpanded: expanded }),
  setSearchQuery: (query) => set({ searchQuery: query })
})))

// Selectors
export const useCurrentNote = () => {
  return useAppStore(state => state.notes[state.currentNoteIndex] || null)
}

export const useProjectNotes = (projectId: string) => {
  const notes = useAppStore(state => state.notes)
  return useMemo(() => 
    notes
      .filter(note => note.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index),
    [notes, projectId]
  )
}

export const useProjectLinks = (projectId: string) => {
  const links = useAppStore(state => state.links)
  return useMemo(() => 
    links
      .filter(link => link.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index),
    [links, projectId]
  )
}

export const useStarredProjects = () => {
  const projects = useAppStore(state => state.projects)
  return useMemo(() => 
    projects
      .filter(p => p.is_starred)
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()),
    [projects]
  )
}

export const useUnstarredProjects = () => {
  const projects = useAppStore(state => state.projects)
  return useMemo(() => 
    projects
      .filter(p => !p.is_starred)
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime()),
    [projects]
  )
}