import { useState, useEffect } from 'react'
import { Note } from '../types/database'
import { useProjects } from '../hooks/useProjects'
import { useUpdateNote } from '../hooks/useNotes'

interface NoteEditModalProps {
  note: Note
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

const NoteEditModal = ({ note, isOpen, onClose, onDelete }: NoteEditModalProps) => {
  const [editTitle, setEditTitle] = useState(note.title || '')
  const [editContent, setEditContent] = useState(note.encrypted_content || '')
  const [selectedProjectId, setSelectedProjectId] = useState(note.project_id)

  const { data: projects } = useProjects()
  const updateNote = useUpdateNote()

  // Reset form when note changes
  useEffect(() => {
    setEditTitle(note.title || '')
    setEditContent(note.encrypted_content || '')
    setSelectedProjectId(note.project_id)
  }, [note])

  const handleSave = async () => {
    const updates = {
      title: editTitle.trim() || undefined,
      encrypted_content: editContent.trim(),
    }

    try {
      await updateNote.mutateAsync({ 
        id: note.id, 
        updates
      })
      onClose()
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const currentProject = projects?.find(p => p.id === selectedProjectId)
  const hasChanges = 
    editTitle !== (note.title || '') ||
    editContent !== (note.encrypted_content || '') ||
    selectedProjectId !== note.project_id

  if (!isOpen) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white border-2 border-medium-grey mx-5">
      {/* Header */}
      <div className="border-b-2 border-black p-4 bg-light-grey">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 flex-shrink-0 bg-orange border border-black"></div>
            <h2 className="text-lg font-black uppercase tracking-tight">Edit Note</h2>
          </div>
          <button
            onClick={onClose}
            className="text-xl font-black hover:text-orange transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="input-field w-full font-bold"
            placeholder="Note title (optional)"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Content
          </label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="input-field w-full font-mono resize-none"
            rows={12}
            placeholder="Note content..."
          />
        </div>

        {/* Project Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="input-field w-full font-bold"
          >
            {projects?.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {selectedProjectId !== note.project_id && currentProject && (
            <p className="text-xs text-orange font-medium">
              ⚠ This will move the note to "{currentProject.name}"
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black p-4 bg-light-grey flex items-center justify-between">
        <button
          onClick={onDelete}
          className="btn-secondary text-red-500 border-red-500 hover:bg-red-50 font-bold"
        >
          Delete Note
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="btn-secondary font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateNote.isPending || !editContent.trim() || !hasChanges}
            className="btn-primary font-bold disabled:opacity-50"
          >
            {updateNote.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteEditModal