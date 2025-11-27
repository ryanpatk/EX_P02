import { ProjectCard, LinkWithTag, Note } from '../types/database'

interface ProjectCardProps {
  card: ProjectCard
  onClick?: (card: ProjectCard) => void
  onDeleteNote?: (noteId: string) => void
  onDeleteLink?: (linkId: string) => void
  onOpenLink?: (url: string) => void
}

const ProjectCardComponent = ({ 
  card, 
  onClick,
  onDeleteNote, 
  onDeleteLink, 
  onOpenLink 
}: ProjectCardProps) => {
  if (card.type === 'note') {
    const note = card as Note & { type: 'note' }
    const previewContent = note.encrypted_content.slice(0, 150)
    const hasMoreContent = note.encrypted_content.length > 150

    return (
      <div 
        className="card p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onClick?.(card)}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="w-4 h-4 flex-shrink-0 bg-white border border-black flex items-center justify-center">
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none" 
                  className="text-black"
                >
                  <rect x="2" y="3" width="8" height="1" fill="currentColor"/>
                  <rect x="2" y="5" width="6" height="1" fill="currentColor"/>
                  <rect x="2" y="7" width="7" height="1" fill="currentColor"/>
                  <rect x="2" y="9" width="5" height="1" fill="currentColor"/>
                </svg>
              </div>
              <h3 className="font-bold text-base truncate">
                {note.title || 'Untitled Note'}
              </h3>
            </div>
          </div>
          
          {previewContent && (
            <p className="text-sm text-gray-600 font-medium line-clamp-3 leading-relaxed font-mono">
              {previewContent}{hasMoreContent ? '...' : ''}
            </p>
          )}
          
          <p className="text-sm text-gray-500 font-medium truncate border-t border-light-grey pt-2">
            Updated {new Date(note.updated_at).toLocaleDateString()}
          </p>
          
          <div className="flex justify-end items-center pt-2 border-t border-light-grey">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNote?.(note.id)
              }}
              className="text-sm text-red-500 font-bold hover:bg-red-50 py-1 px-2 border border-red-500 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (card.type === 'link') {
    const link = card as LinkWithTag & { type: 'link' }
    
    return (
      <div 
        className="card p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onClick?.(card)}
      >
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
          </div>
          
          {link.tag && (
            <div className="flex items-center">
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-black border border-black">
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
              onClick={(e) => {
                e.stopPropagation()
                onDeleteLink?.(link.id)
              }}
              className="text-sm text-red-500 font-bold hover:bg-red-50 py-1 px-2 border border-red-500 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenLink?.(link.url)
              }}
              className="text-sm btn-primary py-1 px-3 font-bold"
            >
              Open
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default ProjectCardComponent