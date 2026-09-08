import { DEFAULT_MODULE_PATH, HOME_PATH, SPACES_PATH } from '../constants/modules';

const STORAGE_KEY = 'memex.last-module';

const isStreamPath = (pathname: string) =>
  pathname === HOME_PATH || /^\/spaces\/[^/]+$/.test(pathname);

/** Remember the last stream the user stood in (Home or a specific space). */
export const rememberModulePath = (pathname: string) => {
  if (!isStreamPath(pathname)) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, pathname);
  } catch {
    /* storage unavailable — skip */
  }
};

/** Forget a remembered space (e.g. after it is deleted). */
export const forgetSpacePath = (spaceId: string) => {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === `${SPACES_PATH}/${spaceId}`) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable — skip */
  }
};

export const getLastModulePath = (): string => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isStreamPath(stored)) {
      return stored;
    }
  } catch {
    /* storage unavailable — fall through */
  }
  return DEFAULT_MODULE_PATH;
};
