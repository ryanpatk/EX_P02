import { useState, useEffect } from 'react'
import { LinkWithTag } from '../types/database'
import { useProjects } from '../hooks/useProjects'
import { useTags, useCreateTag, TAG_COLORS } from '../hooks/useTags'
import { useUpdateLink } from '../hooks/useLinks'

interface LinkEditModalProps {
  link: LinkWithTag
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
}

const LinkEditModal = ({ link, isOpen, onClose, onDelete }: LinkEditModalProps) => {
  const [editUrl, setEditUrl] = useState(link.url)
  const [editTitle, setEditTitle] = useState(link.title || '')
  const [editDescription, setEditDescription] = useState(link.description || '')
  const [selectedTagId, setSelectedTagId] = useState(link.tag_id || '')
  const [selectedProjectId, setSelectedProjectId] = useState(link.project_id)
  const [showNewTagForm, setShowNewTagForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  const { data: projects } = useProjects()
  const { data: tags } = useTags()
  const updateLink = useUpdateLink()
  const createTag = useCreateTag()

  // Reset form when link changes
  useEffect(() => {
    setEditUrl(link.url)
    setEditTitle(link.title || '')
    setEditDescription(link.description || '')
    setSelectedTagId(link.tag_id || '')
    setSelectedProjectId(link.project_id)
  }, [link])


  const handleSave = async () => {
    const updates = {
      url: editUrl.trim(),
      title: editTitle.trim() || undefined,
      description: editDescription.trim() || undefined,
      tag_id: selectedTagId || undefined,
      project_id: selectedProjectId,
    }

    const oldProjectId = link.project_id !== selectedProjectId ? link.project_id : undefined

    try {
      await updateLink.mutateAsync({ 
        id: link.id, 
        updates,
        oldProjectId 
      })
      onClose()
    } catch (error) {
      console.error('Failed to update link:', error)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor
      })
      setSelectedTagId(newTag.id)
      setNewTagName('')
      setShowNewTagForm(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const currentProject = projects?.find(p => p.id === selectedProjectId)
  const hasChanges = 
    editUrl !== link.url ||
    editTitle !== (link.title || '') ||
    editDescription !== (link.description || '') ||
    selectedTagId !== (link.tag_id || '') ||
    selectedProjectId !== link.project_id

  if (!isOpen) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white border-2 border-medium-grey mx-5">
      {/* Header */}
      <div className="border-b-2 border-black p-4 bg-light-grey">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {link.favicon_url && (
              <img 
                src={link.favicon_url} 
                alt="" 
                className="w-5 h-5 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <h2 className="text-lg font-black uppercase tracking-tight">Edit Link</h2>
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
        {/* URL */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            URL
          </label>
          <input
            type="url"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            className="input-field w-full font-mono text-sm"
            placeholder="https://example.com"
          />
        </div>

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
            placeholder="Link title (optional)"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Description
          </label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="input-field w-full font-medium resize-none"
            rows={3}
            placeholder="Link description (optional)"
          />
        </div>

        {/* Tag Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Tag
          </label>
          <div className="space-y-3">
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="input-field w-full font-medium"
            >
              <option value="">No tag</option>
              {tags?.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>

            {!showNewTagForm ? (
              <button
                onClick={() => setShowNewTagForm(true)}
                className="text-sm font-bold text-orange hover:text-orange-muted transition-colors"
              >
                + Create New Tag
              </button>
            ) : (
              <div className="border border-medium-grey p-3 bg-gray-50 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="input-field flex-1 text-sm font-medium"
                    placeholder="Tag name"
                    autoFocus
                  />
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-6 h-6 border-2 border-black flex-shrink-0"
                      style={{ 
                        backgroundColor: newTagColor,
                        minWidth: '24px',
                        minHeight: '24px'
                      }}
                      title={`Selected color: ${newTagColor}`}
                    />
                    <select
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="input-field text-sm w-20"
                      style={{ fontSize: '11px' }}
                    >
                      {TAG_COLORS.map(color => (
                        <option key={color} value={color}>
                          {color.replace('#', '')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCreateTag}
                    disabled={createTag.isPending || !newTagName.trim()}
                    className="btn-primary text-xs disabled:opacity-50"
                  >
                    {createTag.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNewTagForm(false)
                      setNewTagName('')
                    }}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
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
          {selectedProjectId !== link.project_id && currentProject && (
            <p className="text-xs text-orange font-medium">
              ⚠ This will move the link to "{currentProject.name}"
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
          Delete Link
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
            disabled={updateLink.isPending || !editUrl.trim() || !hasChanges}
            className="btn-primary font-bold disabled:opacity-50"
          >
            {updateLink.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkEditModal