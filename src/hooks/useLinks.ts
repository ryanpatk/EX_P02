import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { useAppStore } from '../store'
import { Link, CreateLinkData, UpdateLinkData } from '../types/database'

// Query keys
export const linkKeys = {
  all: ['links'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...linkKeys.lists(), { filters }] as const,
  details: () => [...linkKeys.all, 'detail'] as const,
  detail: (id: string) => [...linkKeys.details(), id] as const,
  byProject: (projectId: string) => [...linkKeys.lists(), { projectId }] as const,
}

// Links API functions
export const linksApi = {
  getByProject: async (projectId: string): Promise<Link[]> => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  getById: async (id: string): Promise<Link | null> => {
    const { data, error } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (linkData: CreateLinkData): Promise<Link> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get the highest order_index for this project
    const { data: existingLinks } = await supabase
      .from('links')
      .select('order_index')
      .eq('project_id', linkData.project_id)
      .order('order_index', { ascending: false })
      .limit(1)

    const maxOrder = existingLinks?.[0]?.order_index || 0

    const { data, error } = await supabase
      .from('links')
      .insert({
        ...linkData,
        user_id: user.id,
        order_index: linkData.order_index ?? maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, updates: UpdateLinkData): Promise<Link> => {
    const { data, error } = await supabase
      .from('links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  reorder: async (links: { id: string; order_index: number }[]): Promise<void> => {
    const updates = links.map(({ id, order_index }) =>
      supabase
        .from('links')
        .update({ order_index })
        .eq('id', id)
    )

    const results = await Promise.allSettled(updates)
    const errors = results.filter(r => r.status === 'rejected')
    
    if (errors.length > 0) {
      throw new Error('Failed to reorder some links')
    }
  },

  // Utility function to extract metadata from URL (basic implementation)
  extractMetadata: async (url: string): Promise<Partial<Pick<Link, 'title' | 'description' | 'favicon_url'>>> => {
    try {
      // For now, just extract domain for title and favicon
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace('www.', '')
      
      return {
        title: domain,
        favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      }
    } catch {
      return {
        title: url,
      }
    }
  },
}

// Custom hooks
export const useProjectLinks = (projectId: string) => {
  return useQuery({
    queryKey: linkKeys.byProject(projectId),
    queryFn: () => linksApi.getByProject(projectId),
    enabled: !!projectId,
  })
}

export const useLink = (id: string) => {
  return useQuery({
    queryKey: linkKeys.detail(id),
    queryFn: () => linksApi.getById(id),
    enabled: !!id,
  })
}

export const useCreateLink = () => {
  const queryClient = useQueryClient()
  const addLink = useAppStore(state => state.addLink)

  return useMutation({
    mutationFn: async (linkData: CreateLinkData) => {
      // Extract metadata if not provided
      if (!linkData.title || !linkData.favicon_url) {
        const metadata = await linksApi.extractMetadata(linkData.url)
        return linksApi.create({
          ...linkData,
          title: linkData.title || metadata.title,
          description: linkData.description || metadata.description,
          favicon_url: linkData.favicon_url || metadata.favicon_url,
        })
      }
      return linksApi.create(linkData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.byProject(data.project_id) })
      addLink(data)
    },
  })
}

export const useUpdateLink = () => {
  const queryClient = useQueryClient()
  const updateLink = useAppStore(state => state.updateLink)

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLinkData }) =>
      linksApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: linkKeys.byProject(data.project_id) })
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(data.id) })
      updateLink(data.id, data)
    },
  })
}

export const useDeleteLink = () => {
  const queryClient = useQueryClient()
  const removeLink = useAppStore(state => state.removeLink)

  return useMutation({
    mutationFn: linksApi.delete,
    onSuccess: (_, id) => {
      // We'll need to invalidate all project queries since we don't know which project this link belonged to
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() })
      removeLink(id)
    },
  })
}

export const useReorderLinks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: linksApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() })
    },
  })
}