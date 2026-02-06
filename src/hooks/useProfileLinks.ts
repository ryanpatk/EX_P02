import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { ProfileLinkWithLink } from '../types/database'

export const profileLinkKeys = {
  all: ['profile-links'] as const,
  lists: () => [...profileLinkKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...profileLinkKeys.lists(), { filters }] as const,
  byProfile: (profileId: string) => [...profileLinkKeys.lists(), { profileId }] as const,
}

export const profileLinksApi = {
  getByProfile: async (profileId: string): Promise<ProfileLinkWithLink[]> => {
    try {
      const { data, error } = await supabase
        .from('profile_links')
        .select(`
          *,
          link:links(
            *,
            tag:tags(*),
            link_tags:link_tags(tag:tags(*)),
            project:projects(id, name)
          )
        `)
        .eq('profile_id', profileId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : ''
      if (message.includes('profile_links') && message.includes('does not exist')) {
        return []
      }
      if (message.includes('link_tags') && message.includes('does not exist')) {
        const { data, error: fallbackError } = await supabase
          .from('profile_links')
          .select(`
            *,
            link:links(
              *,
              tag:tags(*),
              project:projects(id, name)
            )
          `)
          .eq('profile_id', profileId)
          .order('order_index', { ascending: true })

        if (fallbackError) throw fallbackError
        return data || []
      }
      throw error
    }
  },

  addLinks: async (profileId: string, linkIds: string[]): Promise<void> => {
    if (linkIds.length === 0) return

    const { data: existing, error: existingError } = await supabase
      .from('profile_links')
      .select('link_id, order_index')
      .eq('profile_id', profileId)

    if (existingError) throw existingError

    const existingIds = new Set((existing || []).map((row) => row.link_id))
    const maxOrder = (existing || []).reduce(
      (max, row) => Math.max(max, row.order_index || 0),
      0,
    )

    const uniqueNewIds = linkIds.filter((id) => !existingIds.has(id))
    if (uniqueNewIds.length === 0) return

    const inserts = uniqueNewIds.map((linkId, index) => ({
      profile_id: profileId,
      link_id: linkId,
      order_index: maxOrder + index + 1,
    }))

    const { error } = await supabase
      .from('profile_links')
      .insert(inserts)

    if (error) throw error
  },

  removeLink: async (profileId: string, linkId: string): Promise<void> => {
    const { error } = await supabase
      .from('profile_links')
      .delete()
      .eq('profile_id', profileId)
      .eq('link_id', linkId)

    if (error) throw error
  },
}

export const useProfileLinks = (profileId: string) => {
  return useQuery({
    queryKey: profileLinkKeys.byProfile(profileId),
    queryFn: () => profileLinksApi.getByProfile(profileId),
    enabled: !!profileId,
  })
}

export const useAddLinksToProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, linkIds }: { profileId: string; linkIds: string[] }) =>
      profileLinksApi.addLinks(profileId, linkIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: profileLinkKeys.byProfile(variables.profileId) })
    },
  })
}

export const useRemoveLinkFromProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ profileId, linkId }: { profileId: string; linkId: string }) =>
      profileLinksApi.removeLink(profileId, linkId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: profileLinkKeys.byProfile(variables.profileId) })
    },
  })
}
