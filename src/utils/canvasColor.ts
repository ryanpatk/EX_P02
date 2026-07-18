import {
  CANVAS_COLOR_STORAGE_KEY,
  DEFAULT_CANVAS_COLOR_ID,
  getCanvasColorOption,
  isCanvasColorId,
  type CanvasColorId,
} from '../constants/canvasColors';

const CANVAS_GRADIENT_FADE_END = 0.95;
const CANVAS_GRADIENT_TOP_DELTA_LIGHT = 0.042;
const CANVAS_GRADIENT_TOP_DELTA_DARK = 0.038;

export function isDarkTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function adjustOklchLightness(oklch: string, deltaL: number): string {
  const match = oklch.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+\s*)?\)/i,
  );
  if (!match) return oklch;

  const l = Math.max(0, Math.min(1, parseFloat(match[1]) + deltaL));
  return `oklch(${l} ${match[2]} ${match[3]})`;
}

export function buildCanvasGradient(
  baseColor: string,
  darkMode = false,
): string {
  const topDelta = darkMode
    ? CANVAS_GRADIENT_TOP_DELTA_DARK
    : CANVAS_GRADIENT_TOP_DELTA_LIGHT;
  const topColor = adjustOklchLightness(baseColor, topDelta);
  const fadeEndPercent = Math.round(CANVAS_GRADIENT_FADE_END * 100);

  return `linear-gradient(180deg, ${topColor} 0%, ${baseColor} ${fadeEndPercent}%, ${baseColor} 100%)`;
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
  const baseColor = dark ? option.dark : option.light;

  document.documentElement.style.setProperty(
    '--bookmark-experiment-bg',
    buildCanvasGradient(baseColor, dark),
  );
  document.documentElement.style.setProperty('--bookmark-canvas-base', baseColor);
}

export function initCanvasColor(): void {
  applyCanvasColor(getStoredCanvasColorId());
}

export function persistCanvasColor(colorId: CanvasColorId): void {
  localStorage.setItem(CANVAS_COLOR_STORAGE_KEY, colorId);
}
