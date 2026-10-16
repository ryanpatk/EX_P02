import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Tag, TaskWithTags } from '../types/database';

interface TaskListRowProps {
  task: TaskWithTags;
  onToggleDone: (task: TaskWithTags) => void;
  onDelete: (taskId: string) => void;
  hideActions?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

const getTagsForTask = (task: TaskWithTags): Tag[] => {
  if (task.tags && task.tags.length > 0) {
    return task.tags;
  }
  const map = new Map<string, Tag>();
  (task.task_tags ?? []).forEach((taskTag) => {
    if (taskTag.tag) {
      map.set(taskTag.tag.id, taskTag.tag);
    }
  });
  return Array.from(map.values());
};

const formatDueDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const TaskListRow = ({
  task,
  onToggleDone,
  onDelete,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TaskListRowProps) => {
  const tags = useMemo(() => getTagsForTask(task), [task]);

  return (
    <article
      className={`memex-task-row${task.is_done ? ' is-done' : ''}${
        isSelected ? ' is-selected' : ''
      }${selectionMode ? ' is-selection-mode' : ''}`}
      role={selectionMode ? 'button' : undefined}
      tabIndex={selectionMode ? 0 : undefined}
      aria-pressed={selectionMode ? isSelected : undefined}
      onClick={selectionMode ? () => onToggleSelect?.(task.id) : undefined}
      onKeyDown={
        selectionMode
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onToggleSelect?.(task.id);
              }
            }
          : undefined
      }
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={task.is_done}
        aria-label={task.is_done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`}
        className="memex-task-check"
        onClick={() => onToggleDone(task)}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 8.25 6.75 11 12 5.5" />
        </svg>
      </button>

      <div className="memex-task-body">
        <p className="memex-task-title" title={task.title}>
          {task.title}
        </p>
        {(tags.length > 0 || task.due_date) && (
          <div className="memex-task-meta">
            {task.due_date && (
              <span className="memex-task-due">{formatDueDate(task.due_date)}</span>
            )}
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="bookmark-list-row-tag"
                style={tag.color ? ({ '--edge': tag.color, color: tag.color } as CSSProperties) : undefined}
                title={tag.name}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="bookmark-list-row-tag is-more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {!hideActions && (
      <div className="memex-task-actions">
        <button
          type="button"
          className="bookmark-list-row-action"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete “${task.title}”`}
          title="Delete task"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8" />
            <path d="M12 4 4 12" />
          </svg>
        </button>
      </div>
      )}
    </article>
  );
};

export default TaskListRow;
