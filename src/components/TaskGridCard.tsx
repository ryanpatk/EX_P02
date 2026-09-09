import { useMemo } from 'react';
import { TaskWithTags } from '../types/database';
import { mergeTags } from '../utils/streamItems';
import StreamCard from './StreamCard';
import { CheckIcon } from './icons';
import { formatDueDate } from '../utils/streamCardFormat';

interface TaskGridCardProps {
  task: TaskWithTags;
  onToggleDone: (task: TaskWithTags) => void;
  onDelete?: (taskId: string) => void;
  hideActions?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

/** Task as a stream card: checkbox in the leading slot + due date, title, detail, tags. */
const TaskGridCard = ({
  task,
  onToggleDone,
  onDelete,
  hideActions = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TaskGridCardProps) => {
  const tags = useMemo(() => mergeTags(task.task_tags, task.tags), [task]);
  const due = task.due_date ? formatDueDate(task.due_date) : null;

  return (
    <StreamCard
      type="task"
      leading={
        <button
          type="button"
          role="checkbox"
          aria-checked={task.is_done}
          aria-label={
            task.is_done ? `Mark “${task.title}” not done` : `Mark “${task.title}” done`
          }
          className="memex-task-check"
          disabled={selectionMode}
          onClick={(event) => {
            event.stopPropagation();
            onToggleDone(task);
          }}
        >
          <CheckIcon />
        </button>
      }
      meta={due ? <span className="memex-task-due">{due}</span> : 'Task'}
      metaTitle={due ? `Due ${due}` : undefined}
      title={task.title}
      excerpt={task.detail?.trim() || undefined}
      tags={tags}
      onActivate={selectionMode ? () => onToggleSelect?.(task.id) : undefined}
      isSelected={isSelected}
      selectionMode={selectionMode}
      isDone={task.is_done}
      actions={
        !hideActions && onDelete ? (
          <button
            type="button"
            className="bookmark-list-row-action"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task.id);
            }}
            aria-label={`Delete “${task.title}”`}
            title="Delete task"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8" />
              <path d="M12 4 4 12" />
            </svg>
          </button>
        ) : undefined
      }
    />
  );
};

export default TaskGridCard;
