export type FilterChipVariant = 'space' | 'tag';

interface FilterChipProps {
  label: string;
  count?: number;
  active?: boolean;
  bulkTarget?: boolean;
  disabled?: boolean;
  title?: string;
  variant?: FilterChipVariant;
  onClick?: () => void;
}

// Class names still say "profile" for the space variant until the spaces
// rename ships in CSS; the component API is already space-first.
const VARIANT_BASE: Record<FilterChipVariant, string> = {
  space: 'bookmark-profile-chip',
  tag: 'bookmark-tag-chip',
};

const FilterChip = ({
  label,
  count,
  active = false,
  bulkTarget = false,
  disabled,
  title,
  variant = 'tag',
  onClick,
}: FilterChipProps) => {
  const base = VARIANT_BASE[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      data-cuelume-hover="tick"
      className={`${base} ${active ? 'is-active' : ''}${
        bulkTarget ? ' is-bulk-target' : ''
      }`}
    >
      <span className={`${base}-label`}>{label}</span>
      {count !== undefined && <span className={`${base}-count`}>{count}</span>}
    </button>
  );
};

export default FilterChip;
