import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreakpointValue } from '@chakra-ui/react'
import { useProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects'
import { useProjectNotes, useCreateNote, useDeleteNote } from '../hooks/useNotes'
import { useProjectLinks, useCreateLink, useDeleteLink } from '../hooks/useLinks'
import { useTags } from '../hooks/useTags'
import { CreateNoteData, CreateLinkData, LinkWithTag, Note, ProjectCard } from '../types/database'
import LinkEditModal from '../components/LinkEditModal'
import NoteEditModal from '../components/NoteEditModal'
import ProjectCardComponent from '../components/ProjectCard'

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const [newItemInput, setNewItemInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editingLink, setEditingLink] = useState<LinkWithTag | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('')
  
  // Responsive detection
  const isDesktop = useBreakpointValue([false, false, true]) // [mobile, tablet, desktop]
  
  // Data hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: notes, isLoading: notesLoading } = useProjectNotes(projectId!)
  const { data: links, isLoading: linksLoading } = useProjectLinks(projectId!)
  const { data: tags } = useTags()
  
  // Mutation hooks
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const createLink = useCreateLink()
  const deleteLink = useDeleteLink()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  
  // Initialize edit state when project loads
  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
    }
  }, [project])

  
  const handleSaveProject = async () => {
    if (!projectId || !editName.trim()) return
    
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: {
          name: editName.trim(),
          description: editDescription.trim() || undefined
        }
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleCancelEdit = () => {
    if (project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
    }
    setIsEditing(false)
  }

  const handleDeleteProject = async () => {
    if (!projectId) return
    
    const confirmMessage = `Delete "${project?.name}"?\n\nThis will permanently delete the project and all its notes and links. This action cannot be undone.`
    
    if (!confirm(confirmMessage)) return
    
    try {
      await deleteProject.mutateAsync(projectId)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }
  
  
  const handleCardClick = (card: ProjectCard) => {
    if (card.type === 'note') {
      setEditingNote(card as Note)
    } else if (card.type === 'link') {
      setEditingLink(card as LinkWithTag)
    }
  }

  // URL detection utility
  const isValidUrl = (text: string): boolean => {
    try {
      // Check if it starts with common URL schemes
      if (text.match(/^https?:\/\//i)) {
        new URL(text)
        return true
      }
      // Check if it looks like a domain (contains a dot and no spaces)
      if (text.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/) && !text.includes(' ')) {
        new URL(`https://${text}`)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const handleCreateItem = async () => {
    const input = newItemInput.trim()
    if (!input || !projectId) return

    if (isValidUrl(input)) {
      // Create a link
      const url = input.startsWith('http') ? input : `https://${input}`
      const linkData: CreateLinkData = {
        project_id: projectId,
        url: url,
      }
      
      try {
        await createLink.mutateAsync(linkData)
        setNewItemInput('')
      } catch (error) {
        console.error('Failed to create link:', error)
      }
    } else {
      // Create a note
      const noteData: CreateNoteData = {
        project_id: projectId,
        title: input.length > 50 ? input.substring(0, 50) + '...' : input,
        encrypted_content: input,
      }
      
      try {
        await createNote.mutateAsync(noteData)
        setNewItemInput('')
      } catch (error) {
        console.error('Failed to create note:', error)
      }
    }
  }

  const handleCloseNoteEditModal = () => {
    setEditingNote(null)
  }

  const handleDeleteNoteFromModal = async () => {
    if (!editingNote) return
    
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      await deleteNote.mutateAsync(editingNote.id)
      setEditingNote(null)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }
  
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      await deleteNote.mutateAsync(noteId)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }
  
  
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return
    
    try {
      await deleteLink.mutateAsync(linkId)
    } catch (error) {
      console.error('Failed to delete link:', error)
    }
  }
  
  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }


  const handleCloseEditModal = () => {
    setEditingLink(null)
  }

  const handleDeleteLinkFromModal = async () => {
    if (!editingLink) return
    
    if (!confirm('Are you sure you want to delete this link?')) return
    
    try {
      await deleteLink.mutateAsync(editingLink.id)
      setEditingLink(null)
    } catch (error) {
      console.error('Failed to delete link:', error)
    }
  }

  // Create unified project cards (notes + links)
  const projectCards: ProjectCard[] = []
  
  // Add notes as cards
  if (notes) {
    notes.forEach(note => {
      projectCards.push({ ...note, type: 'note' as const })
    })
  }
  
  // Add links as cards
  if (links) {
    links.forEach(link => {
      projectCards.push({ ...link, type: 'link' as const })
    })
  }

  // Sort cards by updated_at (most recent first)
  projectCards.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

  // Filter cards by selected tag (only applies to links)
  const filteredCards = selectedTagFilter
    ? projectCards.filter(card => 
        card.type === 'note' || (card.type === 'link' && card.tag_id === selectedTagFilter)
      )
    : projectCards

  // Get unique tags used in this project
  const projectTags = tags?.filter(tag => 
    links?.some(link => link.tag_id === tag.id)
  ) || []
  
  if (projectLoading || notesLoading || linksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    )
  }
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-gray-600 font-mono">Project not found</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back
          </button>
        </div>
      </div>
    )
  }
  
  
  return (
    <div className="h-screen bg-light-grey relative overflow-hidden">
      
      {/* Header */}
      <div className="border-b border-medium-grey bg-light-grey transition-all duration-300">
          {!isEditing ? (
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                >
                  ← Back
                </button>
                
                <span className="text-gray-400">•</span>
                
                <h1 className="text-base font-black text-black tracking-tight uppercase">{project.name}</h1>
                
                {project.description && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-600 font-medium">{project.description}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 text-xs font-bold transition-colors border border-medium-grey bg-white text-black hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="text-xs text-gray-600 hover:text-black transition-colors font-medium"
                  >
                    ← Back
                  </button>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs font-bold text-black uppercase tracking-wide">Edit Project</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleDeleteProject}
                    disabled={deleteProject.isPending}
                    className="px-2 py-1 text-xs font-bold transition-colors border border-red-500 bg-white text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteProject.isPending ? '...' : 'Delete'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-2 py-1 text-xs font-bold transition-colors border border-medium-grey bg-white text-black hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={updateProject.isPending || !editName.trim()}
                    className="px-2 py-1 text-xs font-bold transition-colors border border-black bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {updateProject.isPending ? '...' : 'Save'}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                  className="input-field text-base font-black uppercase tracking-tight flex-shrink-0"
                  style={{ width: '200px' }}
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="input-field text-xs font-medium flex-1"
                />
              </div>
            </div>
          )}
        </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 67px)' }}>
        {/* Left Panel - Cards Grid */}
        <div className={`flex flex-col transition-all duration-300 ${
          !isDesktop ? 'w-full' : (editingNote || editingLink) ? 'w-1/2' : 'w-full'
        }`}>
          {/* Controls */}
          <div className="flex-shrink-0 bg-light-grey border-b border-medium-grey overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6 space-y-4">
              {/* Tag Filter */}
              {projectTags.length > 0 && (
                <div className="bg-light-grey border border-medium-grey p-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                      Filter:
                    </span>
                    <button
                      onClick={() => setSelectedTagFilter('')}
                      className={`px-2 py-1 text-xs font-bold transition-colors border border-medium-grey ${
                        !selectedTagFilter ? 'bg-black text-white border-black' : 'bg-white text-black hover:bg-gray-50'
                      }`}
                    >
                      All
                    </button>
                    {projectTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTagFilter(tag.id)}
                        className={`px-2 py-1 text-xs font-bold transition-colors border border-medium-grey ${
                          selectedTagFilter === tag.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black hover:bg-gray-50'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Item */}
              <div className="bg-light-grey border border-medium-grey p-4 flex space-x-2">
                <input
                  type="text"
                  placeholder="Add new item (URL for link, text for note)..."
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  className="input-field flex-1 font-medium h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
                />
                <button
                  onClick={handleCreateItem}
                  disabled={(createLink.isPending || createNote.isPending) || !newItemInput.trim()}
                  className="btn-primary font-bold disabled:opacity-50 h-8"
                >
                  {(createLink.isPending || createNote.isPending) ? '...' : '+'}
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredCards && filteredCards.length > 0 ? (
              <div className="h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-6">
                  <div className={`grid gap-4 ${
                    !isDesktop ? 'grid-cols-1' :
                    (editingNote || editingLink) ? 'grid-cols-1 xl:grid-cols-2' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {filteredCards.map((card) => (
                      <ProjectCardComponent
                        key={`${card.type}-${card.id}`}
                        card={card}
                        onClick={handleCardClick}
                        onDeleteNote={handleDeleteNote}
                        onDeleteLink={handleDeleteLink}
                        onOpenLink={handleOpenLink}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  {selectedTagFilter ? (
                    <>
                      <p className="text-lg text-gray-600 font-bold">No items with this tag</p>
                      <p className="text-base text-gray-500 font-medium">
                        Try selecting a different tag or clear the filter
                      </p>
                      <button
                        onClick={() => setSelectedTagFilter('')}
                        className="btn-secondary font-bold"
                      >
                        Clear Filter
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg text-gray-600 font-bold">No notes or links yet</p>
                      <p className="text-base text-gray-500 font-medium">
                        Create your first note or link above
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Editor (Desktop) or Full Screen Modal (Mobile) */}
        {(editingNote || editingLink) && (
          <div className={`
            ${!isDesktop ? 
              'fixed inset-0 z-50 bg-light-grey' :
              'w-1/2 border-l border-medium-grey'
            }
            transition-all duration-300 ease-in-out
            ${!isDesktop && (editingNote || editingLink) ? 
              'animate-slide-in-right' : ''
            }
          `}>
            {editingLink ? (
              <LinkEditModal
                link={editingLink}
                isOpen={!!editingLink}
                onClose={handleCloseEditModal}
                onDelete={handleDeleteLinkFromModal}
              />
            ) : editingNote ? (
              <NoteEditModal
                note={editingNote}
                isOpen={!!editingNote}
                onClose={handleCloseNoteEditModal}
                onDelete={handleDeleteNoteFromModal}
              />
            ) : null}
          </div>
        )}
      </div>

    </div>
  )
}

export default ProjectPage