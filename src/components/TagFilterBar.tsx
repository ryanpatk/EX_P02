import { Tag } from '../types/database'

interface TagFilterBarProps {
  tags: Tag[]
  selectedTagIds: string[]
  includeUntagged: boolean
  onToggleTag: (tagId: string) => void
  onToggleUntagged: () => void
  onClear: () => void
}

const TagFilterBar = ({
  tags,
  selectedTagIds,
  includeUntagged,
  onToggleTag,
  onToggleUntagged,
  onClear,
}: TagFilterBarProps) => {
  const hasFilters = selectedTagIds.length > 0 || includeUntagged

  return (
    <div className="tag-filter-bar">
      <button
        type="button"
        onClick={onClear}
        className={`tag-pill ${!hasFilters ? 'tag-pill-active' : ''}`}
      >
        All
      </button>
      <button
        type="button"
        onClick={onToggleUntagged}
        className={`tag-pill ${includeUntagged ? 'tag-pill-active' : ''}`}
      >
        Untagged
      </button>
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.id)}
            className={`tag-pill ${isSelected ? 'tag-pill-active' : ''}`}
          >
            <span className="tag-dot" style={{ backgroundColor: tag.color }} />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}

export default TagFilterBar
