import {
  CANVAS_COLOR_STORAGE_KEY,
  DEFAULT_CANVAS_COLOR_ID,
  getCanvasColorOption,
  isCanvasColorId,
  type CanvasColorId,
} from '../constants/canvasColors';

function isDarkTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function getStoredCanvasColorId(): CanvasColorId {
  const saved = localStorage.getItem(CANVAS_COLOR_STORAGE_KEY);
  if (saved && isCanvasColorId(saved)) {
    return saved;
  }
  return DEFAULT_CANVAS_COLOR_ID;
}

export function applyCanvasColor(colorId: CanvasColorId): void {
  const option = getCanvasColorOption(colorId);
  const dark = isDarkTheme();
  const background = dark ? option.dark : option.light;

  document.documentElement.style.setProperty(
    '--bookmark-experiment-bg',
    background,
  );
}

export function initCanvasColor(): void {
  applyCanvasColor(getStoredCanvasColorId());
}

export function persistCanvasColor(colorId: CanvasColorId): void {
  localStorage.setItem(CANVAS_COLOR_STORAGE_KEY, colorId);
}
