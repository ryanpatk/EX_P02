import { useEffect, useMemo, useRef, useState } from 'react'
import { TAG_COLORS } from '../hooks/useTags'
import { Tag } from '../types/database'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
  onCreateTag: (name: string, color: string) => Promise<Tag>
  onClose: () => void
  position: { top: number; left: number }
}

const TagSelector = ({
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
  onClose,
  position,
}: TagSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
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

  return (
    <div
      ref={containerRef}
      className="tag-selector"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
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
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`tag-selector-item ${isSelected ? 'is-selected' : ''}`}
            >
              <span className="tag-dot" style={{ backgroundColor: tag.color }} />
              <span className="tag-selector-name">{tag.name}</span>
              {isSelected && (
                <span className="tag-selector-check">✓</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="tag-selector-create">
        <div className="tag-selector-create-row">
          <input
            type="text"
            placeholder="New tag"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="tag-selector-input"
          />
          <select
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="tag-selector-color"
          >
            {TAG_COLORS.map((color) => (
              <option key={color} value={color}>
                {color.replace('#', '')}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleCreateTag}
          className="tag-selector-create-button"
          disabled={!newTagName.trim()}
        >
          Create tag
        </button>
      </div>
    </div>
  )
}

export default TagSelector
