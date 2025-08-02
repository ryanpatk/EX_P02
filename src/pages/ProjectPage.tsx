import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBreakpointValue } from '@chakra-ui/react'
import { useProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects'
import { useProjectNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes'
import { useProjectLinks, useCreateLink, useDeleteLink } from '../hooks/useLinks'
import { useTags } from '../hooks/useTags'
import { useAppStore } from '../store'
import { CreateNoteData, CreateLinkData, LinkWithTag } from '../types/database'
import LinkEditModal from '../components/LinkEditModal'

const ProjectPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editingLink, setEditingLink] = useState<LinkWithTag | null>(null)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('')
  
  // Chakra breakpoint: [mobile, tablet, desktop]
  const isDesktop = useBreakpointValue([false, false, true])
  
  const { leftPaneExpanded, rightPaneExpanded, currentNoteIndex, setLeftPaneExpanded, setRightPaneExpanded, setCurrentNoteIndex } = useAppStore()
  
  // Data hooks
  const { data: project, isLoading: projectLoading } = useProject(projectId!)
  const { data: notes, isLoading: notesLoading } = useProjectNotes(projectId!)
  const { data: links, isLoading: linksLoading } = useProjectLinks(projectId!)
  const { data: tags } = useTags()
  
  // Mutation hooks
  const createNote = useCreateNote()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const createLink = useCreateLink()
  // const updateLink = useUpdateLink() // TODO: implement link editing
  const deleteLink = useDeleteLink()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  
  // Current note from React Query data
  const currentNote = notes?.[currentNoteIndex] || null
  
  // Initialize edit state when project loads
  useEffect(() => {
    if (project) {
      setEditName(project.name)
      setEditDescription(project.description || '')
    }
  }, [project])

  // Update note content and title when current note changes
  useEffect(() => {
    if (currentNote) {
      setNoteContent(currentNote.encrypted_content || '')
      setNoteTitle(currentNote.title || '')
    } else {
      setNoteContent('')
      setNoteTitle('')
    }
  }, [currentNote])
  
  // Auto-save note content with debounce
  useEffect(() => {
    if (!currentNote || noteContent === currentNote.encrypted_content) return
    
    const timeoutId = setTimeout(() => {
      updateNote.mutate({
        id: currentNote.id,
        updates: { encrypted_content: noteContent }
      })
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [noteContent, currentNote, updateNote])

  // Auto-save note title with debounce
  useEffect(() => {
    if (!currentNote || noteTitle === currentNote.title) return
    
    const timeoutId = setTimeout(() => {
      updateNote.mutate({
        id: currentNote.id,
        updates: { title: noteTitle }
      })
    }, 500) // Shorter delay for title since it's smaller

    return () => clearTimeout(timeoutId)
  }, [noteTitle, currentNote, updateNote])
  
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
  
  const handleCreateNote = async () => {
    if (!projectId) return
    
    const noteData: CreateNoteData = {
      project_id: projectId,
      title: `Note ${(notes?.length || 0) + 1}`,
      encrypted_content: '',
    }
    
    try {
      await createNote.mutateAsync(noteData)
    } catch (error) {
      console.error('Failed to create note:', error)
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
  
  const handleCreateLink = async () => {
    if (!newLinkUrl.trim() || !projectId) return
    
    const linkData: CreateLinkData = {
      project_id: projectId,
      url: newLinkUrl.trim(),
    }
    
    try {
      await createLink.mutateAsync(linkData)
      setNewLinkUrl('')
    } catch (error) {
      console.error('Failed to create link:', error)
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

  const handleEditLink = (link: LinkWithTag) => {
    console.log('Setting editing link:', link)
    setEditingLink(link)
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

  // Filter links by selected tag
  const filteredLinks = selectedTagFilter
    ? links?.filter(link => link.tag_id === selectedTagFilter)
    : links

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
  
  // Desktop: show both by default, optionally one, never neither
  // Mobile: show only one at a time, never both, never neither
  let shouldShowLeftPane: boolean
  let shouldShowRightPane: boolean
  
  if (isDesktop) {
    // Desktop logic: both by default, or individual toggles, but never neither
    if (!leftPaneExpanded && !rightPaneExpanded) {
      // If both are off, show both (default state)
      shouldShowLeftPane = true
      shouldShowRightPane = true
    } else {
      // Individual toggles work as expected
      shouldShowLeftPane = leftPaneExpanded
      shouldShowRightPane = rightPaneExpanded
    }
  } else {
    // Mobile logic: only one at a time, never both, never neither
    if (!leftPaneExpanded && !rightPaneExpanded) {
      // Default to notes on mobile
      shouldShowLeftPane = true
      shouldShowRightPane = false
    } else if (leftPaneExpanded && rightPaneExpanded) {
      // If both somehow get enabled, prefer notes
      shouldShowLeftPane = true
      shouldShowRightPane = false
    } else {
      // Normal toggle behavior - only one can be true
      shouldShowLeftPane = leftPaneExpanded
      shouldShowRightPane = rightPaneExpanded
    }
  }
  
  // Custom toggle handlers that respect mobile/desktop constraints
  const handleNotesToggle = () => {
    if (isDesktop) {
      // Desktop: simple toggle
      setLeftPaneExpanded(!leftPaneExpanded)
    } else {
      // Mobile: always switch to notes (turn on notes, turn off links)
      setLeftPaneExpanded(true)
      setRightPaneExpanded(false)
    }
  }
  
  const handleLinksToggle = () => {
    if (isDesktop) {
      // Desktop: simple toggle
      setRightPaneExpanded(!rightPaneExpanded)
    } else {
      // Mobile: always switch to links (turn on links, turn off notes)
      setRightPaneExpanded(true)
      setLeftPaneExpanded(false)
    }
  }
  
  return (
    <div className="h-screen bg-light-grey relative overflow-hidden">
      
      {/* Header */}
      <div className="border-b border-medium-grey bg-light-grey transition-all duration-300">
          {/* Mobile Layout */}
          <div className="hidden">
            {/* Top Row - Navigation */}
            <div className="flex items-center justify-between p-4 pb-2">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-600 hover:text-black transition-colors font-medium"
              >
                ← Back
              </button>
              
            </div>
            
            {/* Project Info */}
            <div className="px-4 pb-3">
              <h1 className="text-xl font-black text-black tracking-tight leading-tight uppercase mb-1">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-600 font-medium mb-3">{project.description}</p>
              )}
              
              {/* Toggle Buttons */}
              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleNotesToggle}
                  className={`py-1 px-4 text-xs font-bold transition-colors border border-medium-grey ${
                    shouldShowLeftPane ? 'bg-black text-white border-black' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={handleLinksToggle}
                  className={`py-1 px-4 text-xs font-bold transition-colors border border-medium-grey ${
                    shouldShowRightPane ? 'bg-black text-white border-black' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Links
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
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
                <button
                  onClick={handleNotesToggle}
                  className={`px-2 py-1 text-xs font-bold transition-colors border border-medium-grey ${
                    shouldShowLeftPane ? 'bg-black text-white border-black' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={handleLinksToggle}
                  className={`px-2 py-1 text-xs font-bold transition-colors border border-medium-grey ${
                    shouldShowRightPane ? 'bg-black text-white border-black' : 'bg-white text-black hover:bg-gray-50'
                  }`}
                >
                  Links
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
      <div className="flex gap-px overflow-hidden" style={{ height: 'calc(100vh - 67px)' }}>
        {/* Left Pane - Notes */}
        {shouldShowLeftPane && (
          <div className={`${isDesktop && shouldShowRightPane ? 'w-1/2' : 'w-full'} bg-light-grey flex flex-col h-full`}>
            {/* Notes Header */}
            <div className="p-5 bg-light-grey border-b border-medium-grey min-h-[80px] flex flex-col flex-shrink-0">
              {/* Note Navigation - Always reserve space */}
              <div className="bg-light-grey border border-medium-grey p-4 flex items-center space-x-3 min-h-[40px]">
                {notes && notes.length > 0 ? (
                  <>
                    <span className="text-base text-gray-600 font-bold uppercase tracking-wide">
                      {currentNoteIndex + 1} of {notes.length}
                    </span>
                    <div className="flex space-x-1">
                      {notes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentNoteIndex(index)}
                          className={`w-3 h-3 border border-black transition-colors ${
                            index === currentNoteIndex ? 'bg-orange' : 'bg-white hover:bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleCreateNote}
                      disabled={createNote.isPending}
                      className="btn-primary text-base font-bold disabled:opacity-50 h-8"
                    >
                      {createNote.isPending ? '...' : '+ New Note'}
                    </button>
                    {currentNote && (
                      <button
                        onClick={() => handleDeleteNote(currentNote.id)}
                        className="text-red-500 text-base ml-auto hover:bg-red-50 px-3 py-1 border border-red-500 font-bold transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-base text-gray-400 font-bold uppercase tracking-wide">
                      No notes yet
                    </span>
                    <button
                      onClick={handleCreateNote}
                      disabled={createNote.isPending}
                      className="btn-primary text-base font-bold disabled:opacity-50 h-8 ml-auto"
                    >
                      {createNote.isPending ? '...' : '+ New Note'}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Note Editor */}
            <div className="flex-1 bg-white border-2 border-t-0 border-medium-grey font-mono mx-5 flex flex-col">
              {currentNote ? (
                <div className="px-4 py-4 flex-1 flex flex-col h-full">
                  <input
                    type="text"
                    placeholder="Note title..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full mb-4 py-2 px-0 border-b-2 border-medium-grey font-normal text-base bg-transparent focus:outline-none focus:border-black shadow-none"
                    style={{ boxShadow: 'none' }}
                  />
                  <textarea
                    placeholder="Start writing..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full flex-1 resize-none bg-transparent font-normal text-base leading-relaxed focus:outline-none p-0 border-none"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <p className="text-lg text-gray-600 font-bold">No notes yet</p>
                    <button
                      onClick={handleCreateNote}
                      className="btn-primary font-bold"
                    >
                      Create First Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Right Pane - Links */}
        {shouldShowRightPane && (
          <div className={`${isDesktop && shouldShowLeftPane ? 'w-1/2' : 'w-full'} bg-light-grey flex flex-col`}>
            {/* Links Header */}
            <div className="p-5 bg-light-grey border-b border-medium-grey min-h-[80px] flex flex-col flex-shrink-0">
              {/* Add Link - Always reserve space */}
              <div className="bg-light-grey border border-medium-grey p-4 flex space-x-2 min-h-[40px] items-start">
                <input
                  type="url"
                  placeholder="Paste URL..."
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="input-field flex-1 font-medium h-8"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateLink()}
                />
                <button
                  onClick={handleCreateLink}
                  disabled={createLink.isPending || !newLinkUrl.trim()}
                  className="btn-primary font-bold disabled:opacity-50 h-8"
                >
                  {createLink.isPending ? '...' : '+'}
                </button>
              </div>
              
              {/* Tag Filter */}
              {projectTags.length > 0 && (
                <div className="bg-light-grey border border-medium-grey border-t-0 p-3">
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
                        className={`px-2 py-1 text-xs font-bold transition-colors border ${
                          selectedTagFilter === tag.id 
                            ? 'text-white border-black' 
                            : 'text-black border-medium-grey hover:bg-gray-50'
                        }`}
                        style={{ 
                          backgroundColor: selectedTagFilter === tag.id ? tag.color : 'white',
                          borderColor: selectedTagFilter === tag.id ? tag.color : undefined
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Links Grid or Edit Modal */}
            <div className="flex-1 overflow-y-auto">
              {editingLink ? (
                <LinkEditModal
                  link={editingLink}
                  isOpen={!!editingLink}
                  onClose={handleCloseEditModal}
                  onDelete={handleDeleteLinkFromModal}
                />
              ) : filteredLinks && filteredLinks.length > 0 ? (
                <div className="h-full overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px">
                    {filteredLinks.map((link) => (
                        <div key={link.id} className="card p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {link.favicon_url && (
                                  <img 
                                    src={link.favicon_url} 
                                    alt="" 
                                    className="w-4 h-4 flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )}
                                <h3 className="font-bold text-base truncate">
                                  {link.title || new URL(link.url).hostname}
                                </h3>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('Edit button clicked for link:', link.id)
                                  handleEditLink(link)
                                }}
                                className="px-2 py-1 text-xs font-bold border border-medium-grey bg-white hover:bg-gray-50 transition-colors flex-shrink-0 ml-2 relative z-10 cursor-pointer"
                                title="Edit link"
                                type="button"
                              >
                                EDIT
                              </button>
                            </div>
                            
                            {link.tag && (
                              <div className="flex items-center">
                                <span
                                  className="inline-block px-2 py-1 text-xs font-bold text-white border border-black"
                                  style={{ backgroundColor: link.tag.color }}
                                >
                                  {link.tag.name}
                                </span>
                              </div>
                            )}
                            
                            {link.description && (
                              <p className="text-sm text-gray-600 font-medium line-clamp-2 leading-relaxed">
                                {link.description}
                              </p>
                            )}
                            
                            <p className="text-sm text-gray-500 font-medium truncate border-t border-light-grey pt-2">
                              {link.url}
                            </p>
                            
                            <div className="flex justify-between items-center pt-2 border-t border-light-grey">
                              <button
                                onClick={() => handleDeleteLink(link.id)}
                                className="text-sm text-red-500 font-bold hover:bg-red-50 py-1 px-2 border border-red-500 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleOpenLink(link.url)}
                                className="text-sm btn-primary py-1 px-3 font-bold"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    {selectedTagFilter ? (
                      <>
                        <p className="text-lg text-gray-600 font-bold">No links with this tag</p>
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
                        <p className="text-lg text-gray-600 font-bold">No links yet</p>
                        <p className="text-base text-gray-500 font-medium">
                          Add your first link above
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default ProjectPage