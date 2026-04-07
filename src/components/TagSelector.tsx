import { useEffect, useMemo, useRef, useState } from 'react'
import { TAG_COLORS } from '../hooks/useTags'
import { Tag } from '../types/database'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  onCreateTag: (name: string, color: string) => Promise<Tag>
  onDeleteTag?: (tagId: string) => Promise<void>
  onClose: () => void
  position: { top: number; left: number }
  subtitle?: string
}

const TagSelector = ({
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
  onDeleteTag,
  onClose,
  position,
  subtitle = 'Assign, create, or remove labels.',
}: TagSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [deletingTagIds, setDeletingTagIds] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tags
    const query = searchQuery.toLowerCase()
    return tags.filter((tag) => tag.name.toLowerCase().includes(query))
  }, [searchQuery, tags])

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
      return
    }
    onChange([...selectedTagIds, tagId])
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    try {
      const created = await onCreateTag(newTagName.trim(), newTagColor)
      onChange([...selectedTagIds, created.id])
      setNewTagName('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleDeleteTag = async (tag: Tag) => {
    if (!onDeleteTag) return
    const confirmDelete = window.confirm(
      `Delete tag "${tag.name}"?\n\nThis will remove it from all links.`
    )
    if (!confirmDelete) return

    if (selectedTagIds.includes(tag.id)) {
      onChange(selectedTagIds.filter((id) => id !== tag.id))
    }

    setDeletingTagIds((prev) => {
      const next = new Set(prev)
      next.add(tag.id)
      return next
    })

    try {
      await onDeleteTag(tag.id)
    } catch (error) {
      console.error('Failed to delete tag:', error)
    } finally {
      setDeletingTagIds((prev) => {
        const next = new Set(prev)
        next.delete(tag.id)
        return next
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className="tag-selector"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose()
        }
        event.stopPropagation()
      }}
    >
      <div className="tag-selector-header">
        <div>
          <p className="tag-selector-title">TAGS</p>
          <p className="tag-selector-subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="tag-selector-close"
          onClick={onClose}
          aria-label="Close tag selector"
        >
          ×
        </button>
      </div>

      <div className="tag-selector-search">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tag-selector-input"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="tag-selector-list">
        {filteredTags.length === 0 && (
          <div className="tag-selector-empty">No tags found</div>
        )}
        {filteredTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          const isDeleting = deletingTagIds.has(tag.id)
          return (
            <div
              key={tag.id}
              className={`tag-selector-item ${isSelected ? 'is-selected' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="tag-selector-toggle"
              >
                <span className="tag-dot" style={{ backgroundColor: tag.color }} />
                <span className="tag-selector-name">{tag.name}</span>
              </button>
              {(isSelected || onDeleteTag) && (
                <div className="tag-selector-actions">
                  {isSelected && <span className="tag-selector-check">✓</span>}
                  {onDeleteTag && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteTag(tag)
                      }}
                      className="tag-selector-delete"
                      disabled={isDeleting}
                      title={`Delete ${tag.name}`}
                    >
                      {isDeleting ? '…' : '×'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="tag-selector-create">
        <p className="tag-selector-section-label">NEW TAG</p>
        <div className="tag-selector-create-row">
          <input
            type="text"
            placeholder="New tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="tag-selector-input"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleCreateTag()
              }
            }}
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="tag-selector-create-button"
            disabled={!newTagName.trim()}
          >
            CREATE
          </button>
        </div>

        <div className="tag-selector-palette">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`tag-selector-color-swatch ${
                newTagColor === color ? 'is-active' : ''
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setNewTagColor(color)}
              aria-label={`Choose ${color}`}
              aria-pressed={newTagColor === color}
              title={color}
            >
              {newTagColor === color ? <span>✓</span> : null}
            </button>
          ))}
        </div>

        <div className="tag-selector-color-readout">
          <span className="tag-selector-color-chip" style={{ backgroundColor: newTagColor }} />
          <span>{newTagColor.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

export default TagSelector
