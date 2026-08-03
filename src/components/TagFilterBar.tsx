import { useState } from 'react';
import { Tag } from '../types/database';
import { useCreateTag, TAG_COLORS } from '../hooks/useTags';
import { FilterChip, InlineCreateForm } from './ui';

interface TagFilterBarProps {
  tags: Tag[];
  selectedTagIds: string[];
  includeUntagged: boolean;
  untaggedCount: number;
  tagCounts: Record<string, number>;
  onToggleTag: (tagId: string) => void;
  onToggleUntagged: () => void;
  bulkAssignMode?: boolean;
}

const TagFilterBar = ({
  tags,
  selectedTagIds,
  includeUntagged,
  untaggedCount,
  tagCounts,
  onToggleTag,
  onToggleUntagged,
  bulkAssignMode = false,
}: TagFilterBarProps) => {
  const createTag = useCreateTag();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (name: string) => {
    try {
      await createTag.mutateAsync({
        name,
        color: TAG_COLORS[0],
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div className="bookmark-tag-filter">
      <div className="bookmark-tag-filter-inner">
        {tags.map((tag) => (
          <FilterChip
            key={tag.id}
            variant="tag"
            active={!bulkAssignMode && selectedTagIds.includes(tag.id)}
            label={tag.name}
            count={tagCounts[tag.id] ?? 0}
            onClick={() => onToggleTag(tag.id)}
            bulkTarget={bulkAssignMode}
            title={bulkAssignMode ? `Add “${tag.name}” to selection` : undefined}
          />
        ))}

        {!bulkAssignMode && untaggedCount > 0 && (
          <FilterChip
            variant="tag"
            active={includeUntagged}
            label="Untagged"
            count={untaggedCount}
            onClick={onToggleUntagged}
          />
        )}
      </div>

      <div className="bookmark-tag-filter-footer">
        {isCreating ? (
          <InlineCreateForm
            placeholder="Tag name…"
            pending={createTag.isPending}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        ) : (
          <button
            type="button"
            className="bookmark-tag-new"
            onClick={() => setIsCreating(true)}
          >
            New tag
          </button>
        )}
      </div>
    </div>
  );
};

export default TagFilterBar;
