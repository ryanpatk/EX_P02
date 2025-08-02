import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { Tag, CreateTagData, UpdateTagData } from '../types/database'

// Query keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...tagKeys.lists(), { filters }] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagKeys.details(), id] as const,
}

// Predefined tag colors in brutalist style
export const TAG_COLORS = [
  '#FF6B35', // Orange (primary)
  '#1E3A8A', // Blue (primary)
  '#FF0040', // Error red
  '#00FF41', // Success green
  '#FFFF00', // Warning yellow
  '#00FFFF', // Info cyan
  '#FF8A5C', // Orange muted
  '#60A5FA', // Blue muted
  '#E5E5E5', // Medium grey
  '#1A1A1A', // Dark grey
]

// Tags API functions
export const tagsApi = {
  getAll: async (): Promise<Tag[]> => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  getById: async (id: string): Promise<Tag | null> => {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (tagData: CreateTagData): Promise<Tag> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('tags')
      .insert({
        ...tagData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, updates: UpdateTagData): Promise<Tag> => {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    // First, remove the tag from all links that use it
    await supabase
      .from('links')
      .update({ tag_id: null })
      .eq('tag_id', id)

    // Then delete the tag
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get usage count for a tag
  getUsageCount: async (tagId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('links')
      .select('id', { count: 'exact' })
      .eq('tag_id', tagId)

    if (error) throw error
    return data?.length || 0
  },
}

// Custom hooks
export const useTags = () => {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: tagsApi.getAll,
  })
}

export const useTag = (id: string) => {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: () => tagsApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
    },
  })
}

export const useUpdateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTagData }) =>
      tagsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(data.id) })
      // Also invalidate links that might use this tag
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

export const useDeleteTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tagsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.lists() })
      // Also invalidate links since some might have had their tag_id cleared
      queryClient.invalidateQueries({ queryKey: ['links'] })
    },
  })
}

export const useTagUsageCount = (tagId: string) => {
  return useQuery({
    queryKey: [...tagKeys.detail(tagId), 'usage'],
    queryFn: () => tagsApi.getUsageCount(tagId),
    enabled: !!tagId,
  })
}