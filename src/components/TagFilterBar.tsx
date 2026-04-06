import { Tag } from '../types/database';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTagIds: string[];
  includeUntagged: boolean;
  totalCount: number;
  untaggedCount: number;
  tagCounts: Record<string, number>;
  onToggleTag: (tagId: string) => void;
  onToggleUntagged: () => void;
  onClear: () => void;
}

interface TagRowProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}

const TagRow = ({ active, label, count, onClick }: TagRowProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`bookmark-tag-row ${active ? 'is-active' : ''}`}
  >
    <span className="bookmark-tag-row-label">{label}</span>
    <span className="bookmark-tag-row-count">{count}</span>
  </button>
);

const TagFilterBar = ({
  tags,
  selectedTagIds,
  includeUntagged,
  totalCount,
  untaggedCount,
  tagCounts,
  onToggleTag,
  onToggleUntagged,
  onClear,
}: TagFilterBarProps) => {
  const hasFilters = selectedTagIds.length > 0 || includeUntagged;

  return (
    <div className="bookmark-sidebar">
      <div className="bookmark-sidebar-header">
        <div className="bookmark-sidebar-title">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 3.5h4l5.5 5.5-3 3L4 6.5v-3Z" />
            <circle cx="5.2" cy="5.2" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          <span>TAGS</span>
        </div>
      </div>

      <div className="bookmark-sidebar-body">
        <TagRow active={!hasFilters} label="ALL" count={totalCount} onClick={onClear} />

        {tags.map((tag) => (
          <TagRow
            key={tag.id}
            active={selectedTagIds.includes(tag.id)}
            label={tag.name.toUpperCase()}
            count={tagCounts[tag.id] ?? 0}
            onClick={() => onToggleTag(tag.id)}
          />
        ))}

        {untaggedCount > 0 && (
          <TagRow
            active={includeUntagged}
            label="UNTAGGED"
            count={untaggedCount}
            onClick={onToggleUntagged}
          />
        )}
      </div>
    </div>
  );
};

export default TagFilterBar;
