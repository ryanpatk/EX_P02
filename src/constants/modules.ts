export type ModuleKey = 'notes' | 'links' | 'tasks' | 'spaces';

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  path: string;
}

export const MODULES: ModuleDef[] = [
  { key: 'notes', label: 'Notes', path: '/notes' },
  { key: 'links', label: 'Links', path: '/links' },
  { key: 'tasks', label: 'Tasks', path: '/tasks' },
  { key: 'spaces', label: 'Spaces', path: '/spaces' },
];

export const DEFAULT_MODULE_PATH = '/links';
