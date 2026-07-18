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

function stackShadow(hue: number, dark: boolean): string {
  if (dark) {
    return [
      '0 2px 6px oklch(0 0 0 / 0.28)',
      '0 8px 22px oklch(0 0 0 / 0.32)',
      '0 20px 44px -12px oklch(0 0 0 / 0.38)',
    ].join(', ');
  }

  return [
    `0 1px 2px oklch(0.45 0.03 ${hue} / 0.05)`,
    `0 4px 14px oklch(0.42 0.035 ${hue} / 0.09)`,
    `0 16px 36px -10px oklch(0.38 0.04 ${hue} / 0.11)`,
  ].join(', ');
}

function stackShadowFocus(hue: number, dark: boolean): string {
  if (dark) {
    return [
      '0 3px 8px oklch(0 0 0 / 0.32)',
      '0 10px 26px oklch(0 0 0 / 0.36)',
      '0 22px 48px -12px oklch(0 0 0 / 0.42)',
    ].join(', ');
  }

  return [
    `0 2px 4px oklch(0.45 0.03 ${hue} / 0.06)`,
    `0 6px 18px oklch(0.42 0.035 ${hue} / 0.1)`,
    `0 18px 40px -10px oklch(0.38 0.04 ${hue} / 0.12)`,
  ].join(', ');
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
  document.documentElement.style.setProperty(
    '--bookmark-stack-shadow',
    stackShadow(option.shadowHue, dark),
  );
  document.documentElement.style.setProperty(
    '--bookmark-stack-shadow-focus',
    stackShadowFocus(option.shadowHue, dark),
  );
}

export function initCanvasColor(): void {
  applyCanvasColor(getStoredCanvasColorId());
}

export function persistCanvasColor(colorId: CanvasColorId): void {
  localStorage.setItem(CANVAS_COLOR_STORAGE_KEY, colorId);
}
