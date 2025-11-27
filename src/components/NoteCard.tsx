import { Note } from '../types/database'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (noteId: string) => void
}

const NoteCard = ({ note, onEdit, onDelete }: NoteCardProps) => {
  const previewContent = note.encrypted_content.slice(0, 150)
  const hasMoreContent = note.encrypted_content.length > 150

  return (
    <div className="card p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-4 h-4 flex-shrink-0 bg-orange border border-black"></div>
            <h3 className="font-bold text-base truncate">
              {note.title || 'Untitled Note'}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit(note)
            }}
            className="px-2 py-1 text-xs font-bold border border-medium-grey bg-white hover:bg-gray-50 transition-colors flex-shrink-0 ml-2 relative z-10 cursor-pointer"
            title="Edit note"
            type="button"
          >
            EDIT
          </button>
        </div>
        
        {previewContent && (
          <p className="text-sm text-gray-600 font-medium line-clamp-3 leading-relaxed font-mono">
            {previewContent}{hasMoreContent ? '...' : ''}
          </p>
        )}
        
        <p className="text-sm text-gray-500 font-medium truncate border-t border-light-grey pt-2">
          {new Date(note.updated_at).toLocaleDateString()}
        </p>
        
        <div className="flex justify-between items-center pt-2 border-t border-light-grey">
          <button
            onClick={() => onDelete(note.id)}
            className="text-sm text-red-500 font-bold hover:bg-red-50 py-1 px-2 border border-red-500 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => onEdit(note)}
            className="text-sm btn-primary py-1 px-3 font-bold"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteCard