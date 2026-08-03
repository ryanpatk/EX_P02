import type { ViewMode } from '../../hooks/useViewMode';

interface ViewToggleFabProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 4.5h10" />
    <path d="M3 8h10" />
    <path d="M3 11.5h10" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="4.25" height="4.25" rx="1" />
    <rect x="8.75" y="3" width="4.25" height="4.25" rx="1" />
    <rect x="3" y="8.75" width="4.25" height="4.25" rx="1" />
    <rect x="8.75" y="8.75" width="4.25" height="4.25" rx="1" />
  </svg>
);

/**
 * Bottom-left corner view switcher. Shows the icon of the view you would
 * switch TO (grid icon while in list view, and vice versa).
 */
const ViewToggleFab = ({ mode, onChange }: ViewToggleFabProps) => {
  const target: ViewMode = mode === 'list' ? 'grid' : 'list';
  const label = target === 'grid' ? 'Switch to grid view' : 'Switch to list view';

  return (
    <button
      type="button"
      className="memex-view-fab"
      onClick={() => onChange(target)}
      aria-label={label}
      title={label}
    >
      {target === 'grid' ? <GridIcon /> : <ListIcon />}
    </button>
  );
};

export default ViewToggleFab;
