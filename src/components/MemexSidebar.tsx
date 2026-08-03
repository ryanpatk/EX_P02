import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { MODULES, ModuleKey } from '../constants/modules';

const ICON_PROPS = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const NotesIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M4 2.75h8a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75H4a.75.75 0 0 1-.75-.75v-9A.75.75 0 0 1 4 2.75Z" />
    <path d="M5.75 6h4.5" />
    <path d="M5.75 8.5h4.5" />
    <path d="M5.75 11h2.5" />
  </svg>
);

const LinksIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M6.75 9.25 9.25 6.75" />
    <path d="M7.5 4.75 8.9 3.35a2.3 2.3 0 0 1 3.25 3.25L10.75 8" />
    <path d="M8.5 11.25 7.1 12.65a2.3 2.3 0 0 1-3.25-3.25L5.25 8" />
  </svg>
);

const TasksIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="2.5" />
    <path d="M5.5 8.25 7.25 10 10.5 6.25" />
  </svg>
);

const SpacesIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="2.75" y="2.75" width="4.5" height="4.5" rx="1.25" />
    <rect x="8.75" y="2.75" width="4.5" height="4.5" rx="1.25" />
    <rect x="2.75" y="8.75" width="4.5" height="4.5" rx="1.25" />
    <rect x="8.75" y="8.75" width="4.5" height="4.5" rx="1.25" />
  </svg>
);

const MODULE_ICONS: Record<ModuleKey, () => ReactElement> = {
  notes: NotesIcon,
  links: LinksIcon,
  tasks: TasksIcon,
  spaces: SpacesIcon,
};

const MemexSidebar = () => {
  return (
    <nav className="memex-sidebar" aria-label="Modules">
      <div className="memex-sidebar-brand">
        <div className="bookmark-toolbar-brand-shell">
          <span className="bookmark-toolbar-brand" translate="no">
            memex
          </span>
        </div>
      </div>

      <div className="memex-sidebar-nav">
        {MODULES.map((module) => {
          const Icon = MODULE_ICONS[module.key];
          return (
            <NavLink
              key={module.key}
              to={module.path}
              className={({ isActive }) =>
                isActive ? 'memex-sidebar-item is-active' : 'memex-sidebar-item'
              }
            >
              <span className="memex-sidebar-item-icon">
                <Icon />
              </span>
              <span className="memex-sidebar-item-label">{module.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MemexSidebar;
