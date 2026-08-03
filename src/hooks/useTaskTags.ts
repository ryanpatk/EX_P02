import { useMutation, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'
import { taskKeys } from './useTasks'

export const taskTagsApi = {
  setForTask: async (taskId: string, tagIds: string[]): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)

    if (deleteError) throw deleteError

    if (tagIds.length > 0) {
      const inserts = tagIds.map((tagId) => ({
        task_id: taskId,
        tag_id: tagId,
      }))

      const { error: insertError } = await supabase
        .from('task_tags')
        .insert(inserts)

      if (insertError) throw insertError
    }
  },
}

export const useSetTaskTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, tagIds }: { taskId: string; tagIds: string[] }) =>
      taskTagsApi.setForTask(taskId, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}
