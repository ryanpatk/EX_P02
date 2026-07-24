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

interface ParsedOklch {
  l: number;
  c: number;
  h: number;
}

export interface ThemeSurfaceColors {
  activeBg: string;
  activeFg: string;
  prominentBg: string;
  prominentBgStrong: string;
  prominentFg: string;
  prominentText: string;
}

const LIGHT_SURFACE_FALLBACK: ThemeSurfaceColors = {
  activeBg: 'oklch(0.56 0.052 264)',
  activeFg: 'oklch(0.985 0.004 264)',
  prominentBg: 'oklch(0.54 0.058 264)',
  prominentBgStrong: 'oklch(0.52 0.064 264)',
  prominentFg: 'oklch(0.985 0.004 264)',
  prominentText: 'oklch(0.54 0.058 264)',
};

const DARK_SURFACE_FALLBACK: ThemeSurfaceColors = {
  activeBg: 'oklch(0.96 0.018 264)',
  activeFg: 'oklch(0.22 0.028 264)',
  prominentBg: 'oklch(0.94 0.028 264)',
  prominentBgStrong: 'oklch(0.92 0.034 264)',
  prominentFg: 'oklch(0.22 0.028 264)',
  prominentText: 'oklch(0.9 0.024 264)',
};

export function isDarkTheme(): boolean {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function parseOklch(color: string): ParsedOklch | null {
  const match = color.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+\s*)?\)/i,
  );
  if (!match) return null;

  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatOklch(l: number, c: number, h: number): string {
  return `oklch(${clamp(l, 0, 1).toFixed(3)} ${clamp(c, 0, 0.4).toFixed(3)} ${h.toFixed(3)})`;
}

function adjustOklchLightness(oklch: string, deltaL: number): string {
  const parsed = parseOklch(oklch);
  if (!parsed) return oklch;

  return formatOklch(parsed.l + deltaL, parsed.c, parsed.h);
}

export function buildThemeSurfaceColors(
  baseColor: string,
  darkMode = false,
): ThemeSurfaceColors {
  const parsed = parseOklch(baseColor);
  if (!parsed) {
    return darkMode ? DARK_SURFACE_FALLBACK : LIGHT_SURFACE_FALLBACK;
  }

  const { c, h } = parsed;

  if (darkMode) {
    const activeChroma = clamp(c * 0.75 + 0.014, 0.014, 0.055);
    const activeBg = formatOklch(0.96, activeChroma, h);
    const activeFg = formatOklch(0.22, clamp(c * 0.7 + 0.02, 0.02, 0.055), h);
    const prominentChroma = clamp(activeChroma * 1.18 + 0.008, activeChroma, 0.065);
    const prominentBg = formatOklch(0.94, prominentChroma, h);

    return {
      activeBg,
      activeFg,
      prominentBg,
      prominentBgStrong: formatOklch(
        0.92,
        clamp(prominentChroma * 1.08, prominentChroma, 0.07),
        h,
      ),
      prominentFg: activeFg,
      prominentText: formatOklch(
        0.9,
        clamp(activeChroma * 1.05, activeChroma, 0.06),
        h,
      ),
    };
  }

  const activeChroma = clamp(c * 2.5 + 0.032, 0.028, 0.15);
  const activeBg = formatOklch(0.56, activeChroma, h);
  const prominentChroma = clamp(activeChroma * 1.12 + 0.008, activeChroma, 0.17);
  const prominentBg = formatOklch(0.54, prominentChroma, h);
  const prominentFg = formatOklch(0.985, 0.004, h);

  return {
    activeBg,
    activeFg: prominentFg,
    prominentBg,
    prominentBgStrong: formatOklch(
      0.52,
      clamp(prominentChroma * 1.08, prominentChroma, 0.18),
      h,
    ),
    prominentFg,
    prominentText: prominentBg,
  };
}

/** Opaque fill matching the list panel interior (single frosted wash over canvas). */
export function buildStackSurfaceColor(
  baseColor: string,
  darkMode = false,
): string {
  const parsed = parseOklch(baseColor);
  if (!parsed) {
    return darkMode ? 'oklch(0.26 0.012 264)' : 'oklch(0.982 0.009 264)';
  }

  const topDelta = darkMode
    ? CANVAS_GRADIENT_TOP_DELTA_DARK
    : CANVAS_GRADIENT_TOP_DELTA_LIGHT;
  // The feed stack already applies frosted glass once; match gradient top + a
  // light lift — not a second full frost composite (which reads too dark/heavy).
  const frostLift = darkMode ? 0.008 : 0.012;

  return adjustOklchLightness(baseColor, topDelta + frostLift);
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

function applyThemeSurfaceColors(surfaces: ThemeSurfaceColors): void {
  const root = document.documentElement.style;

  root.setProperty('--bookmark-active-bg', surfaces.activeBg);
  root.setProperty('--bookmark-active-fg', surfaces.activeFg);
  root.setProperty('--bookmark-prominent-bg', surfaces.prominentBg);
  root.setProperty('--bookmark-prominent-bg-strong', surfaces.prominentBgStrong);
  root.setProperty('--bookmark-prominent-fg', surfaces.prominentFg);
  root.setProperty('--bookmark-prominent-text', surfaces.prominentText);
}

export function applyCanvasColor(colorId: CanvasColorId): void {
  const option = getCanvasColorOption(colorId);
  const dark = isDarkTheme();
  const baseColor = dark ? option.dark : option.light;
  const surfaces = buildThemeSurfaceColors(baseColor, dark);

  document.documentElement.style.setProperty(
    '--bookmark-experiment-bg',
    buildCanvasGradient(baseColor, dark),
  );
  document.documentElement.style.setProperty('--bookmark-canvas-base', baseColor);
  document.documentElement.style.setProperty(
    '--bookmark-stack-surface',
    buildStackSurfaceColor(baseColor, dark),
  );
  applyThemeSurfaceColors(surfaces);
}

export function initCanvasColor(): void {
  applyCanvasColor(getStoredCanvasColorId());
}

export function persistCanvasColor(colorId: CanvasColorId): void {
  localStorage.setItem(CANVAS_COLOR_STORAGE_KEY, colorId);
}
