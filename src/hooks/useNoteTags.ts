import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { noteKeys } from './useNotes'

export const noteTagsApi = {
  setForNote: async (noteId: string, tagIds: string[]): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)

    if (deleteError) throw deleteError

    if (tagIds.length > 0) {
      const inserts = tagIds.map((tagId) => ({
        note_id: noteId,
        tag_id: tagId,
      }))

      const { error: insertError } = await supabase
        .from('note_tags')
        .insert(inserts)

      if (insertError) throw insertError
    }
  },
}

export const useSetNoteTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, tagIds }: { noteId: string; tagIds: string[] }) =>
      noteTagsApi.setForNote(noteId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
    },
  })
}
