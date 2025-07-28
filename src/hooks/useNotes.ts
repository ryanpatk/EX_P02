import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { useAppStore } from '../store'
import { Note, CreateNoteData, UpdateNoteData } from '../types/database'

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...noteKeys.lists(), { filters }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
  byProject: (projectId: string) => [...noteKeys.lists(), { projectId }] as const,
}

// Notes API functions
export const notesApi = {
  getByProject: async (projectId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  getById: async (id: string): Promise<Note | null> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (noteData: CreateNoteData): Promise<Note> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the highest order_index for this project
    const { data: existingNotes } = await supabase
      .from('notes')
      .select('order_index')
      .eq('project_id', noteData.project_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = existingNotes?.[0]?.order_index || 0

    const { data, error } = await supabase
      .from('notes')
      .insert({
        ...noteData,
        user_id: user.id,
        order_index: noteData.order_index ?? maxOrder + 1,
        encrypted_content: noteData.encrypted_content || '',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, updates: UpdateNoteData): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  reorder: async (notes: { id: string; order_index: number }[]): Promise<void> => {
    const updates = notes.map(({ id, order_index }) =>
      supabase
        .from('notes')
        .update({ order_index })
        .eq('id', id)
    )

    const results = await Promise.allSettled(updates)
    const errors = results.filter(r => r.status === 'rejected')
    
    if (errors.length > 0) {
      throw new Error('Failed to reorder some notes')
    }
  },
}

// Custom hooks
export const useProjectNotes = (projectId: string) => {
  return useQuery({
    queryKey: noteKeys.byProject(projectId),
    queryFn: () => notesApi.getByProject(projectId),
    enabled: !!projectId,
  })
}

export const useNote = (id: string) => {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateNote = () => {
  const queryClient = useQueryClient()
  const addNote = useAppStore(state => state.addNote)

  return useMutation({
    mutationFn: notesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byProject(data.project_id) })
      addNote(data)
    },
  })
}

export const useUpdateNote = () => {
  const queryClient = useQueryClient()
  const updateNote = useAppStore(state => state.updateNote)

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateNoteData }) =>
      notesApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.byProject(data.project_id) })
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(data.id) })
      updateNote(data.id, data)
    },
  })
}

export const useDeleteNote = () => {
  const queryClient = useQueryClient()
  const removeNote = useAppStore(state => state.removeNote)

  return useMutation({
    mutationFn: notesApi.delete,
    onSuccess: (_, id) => {
      // We'll need to invalidate all project queries since we don't know which project this note belonged to
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      removeNote(id)
    },
  })
}

export const useReorderNotes = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notesApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}