import { useEffect, useRef, useState } from 'react';
import { Tag } from '../types/database';
import { useCreateTag, TAG_COLORS } from '../hooks/useTags';

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

interface TagChipProps {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  bulkTarget?: boolean;
}

const TagChip = ({
  active,
  label,
  count,
  onClick,
  disabled,
  title,
  bulkTarget,
}: TagChipProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    data-cuelume-hover="tick"
    className={`bookmark-tag-chip ${active ? 'is-active' : ''}${
      bulkTarget ? ' is-bulk-target' : ''
    }`}
  >
    <span className="bookmark-tag-chip-label">{label}</span>
    <span className="bookmark-tag-chip-count">{count}</span>
  </button>
);

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
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCreating) {
      return;
    }
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isCreating]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    try {
      await createTag.mutateAsync({
        name,
        color: TAG_COLORS[0],
      });
      setNewName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div className="bookmark-tag-filter">
      <div className="bookmark-tag-filter-inner">
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            active={!bulkAssignMode && selectedTagIds.includes(tag.id)}
            label={tag.name}
            count={tagCounts[tag.id] ?? 0}
            onClick={() => onToggleTag(tag.id)}
            bulkTarget={bulkAssignMode}
            title={bulkAssignMode ? `Add “${tag.name}” to selected bookmarks` : undefined}
          />
        ))}

        {!bulkAssignMode && untaggedCount > 0 && (
          <TagChip
            active={includeUntagged}
            label="Untagged"
            count={untaggedCount}
            onClick={onToggleUntagged}
          />
        )}
      </div>

      <div className="bookmark-tag-filter-footer">
        {isCreating ? (
          <div className="bookmark-profile-create">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleCreate();
                }
                if (event.key === 'Escape') {
                  setIsCreating(false);
                  setNewName('');
                }
              }}
              placeholder="Tag name"
              className="bookmark-profile-create-input"
              disabled={createTag.isPending}
            />
            <div className="bookmark-profile-create-actions">
              <button
                type="button"
                className="bookmark-profile-create-button is-primary"
                onClick={() => void handleCreate()}
                disabled={!newName.trim() || createTag.isPending}
              >
                Add
              </button>
              <button
                type="button"
                className="bookmark-profile-create-button"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
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
