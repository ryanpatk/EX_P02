import { DEFAULT_MODULE_PATH, MODULES } from '../constants/modules';

const STORAGE_KEY = 'memex.last-module';

export const rememberModulePath = (pathname: string) => {
  const module = MODULES.find(
    (m) => pathname === m.path || pathname.startsWith(`${m.path}/`),
  );
  if (!module) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, module.path);
  } catch {
    /* storage unavailable — skip */
  }
};

export const getLastModulePath = (): string => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && MODULES.some((m) => m.path === stored)) {
      return stored;
    }
  } catch {
    /* storage unavailable — fall through */
  }
  return DEFAULT_MODULE_PATH;
};
