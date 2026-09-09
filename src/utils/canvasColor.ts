import {
  CANVAS_COLOR_STORAGE_KEY,
  DEFAULT_CANVAS_COLOR_ID,
  getCanvasColorOption,
  isCanvasColorId,
  type CanvasColorId,
} from '../constants/canvasColors';
import { updateThemeColorMeta, updateThemedFavicon } from './favicon';

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
  /** Same-hue tint pair: soft fill + deep ink (chips, hovers, bubbles). */
  tintBg: string;
  tintInk: string;
  tintBorder: string;
}

/** Hue-keyed neutrals: ink, muted, borders, control fills carry a whisper of the swatch hue. */
export interface ThemeNeutralColors {
  text: string;
  muted: string;
  borderInk: string;
  border: string;
  borderStrong: string;
  controlBorder: string;
  controlBg: string;
  chipBorderSoft: string;
}

const LIGHT_SURFACE_FALLBACK: ThemeSurfaceColors = {
  activeBg: 'oklch(0.56 0.052 264)',
  activeFg: 'oklch(0.985 0.004 264)',
  prominentBg: 'oklch(0.54 0.058 264)',
  prominentBgStrong: 'oklch(0.52 0.064 264)',
  prominentFg: 'oklch(0.985 0.004 264)',
  prominentText: 'oklch(0.54 0.058 264)',
  tintBg: 'oklch(0.93 0.03 264)',
  tintInk: 'oklch(0.42 0.06 264)',
  tintBorder: 'oklch(0.7 0.05 264 / 0.5)',
};

const DARK_SURFACE_FALLBACK: ThemeSurfaceColors = {
  activeBg: 'oklch(0.96 0.018 264)',
  activeFg: 'oklch(0.22 0.028 264)',
  prominentBg: 'oklch(0.94 0.028 264)',
  prominentBgStrong: 'oklch(0.92 0.034 264)',
  prominentFg: 'oklch(0.22 0.028 264)',
  prominentText: 'oklch(0.9 0.024 264)',
  tintBg: 'oklch(0.32 0.04 264)',
  tintInk: 'oklch(0.88 0.06 264)',
  tintBorder: 'oklch(0.6 0.05 264 / 0.5)',
};

/**
 * Warm paper hue for neutral (grey) swatches — the examples memex is keyed
 * to read as paper, not screen grey, because their neutrals sit around
 * hue 20–100 rather than the cool 260s.
 */
const PAPER_HUE = 70;

/** Tint pair: pastel fill + deep ink in one hue (Butterfly-chip pairing). */
function buildTintColors(h: number, c: number, darkMode: boolean) {
  const chroma = clamp(c, 0.06, 0.24);
  if (darkMode) {
    return {
      tintBg: formatOklch(0.32, clamp(chroma * 0.35, 0.03, 0.07), h),
      tintInk: formatOklch(0.88, clamp(chroma * 0.5, 0.05, 0.11), h),
      tintBorder: `oklch(0.6 ${clamp(chroma * 0.4, 0.04, 0.08).toFixed(3)} ${h.toFixed(3)} / 0.5)`,
    };
  }
  return {
    tintBg: formatOklch(0.93, clamp(chroma * 0.45, 0.04, 0.09), h),
    tintInk: formatOklch(0.44, clamp(chroma * 0.85, 0.08, 0.19), h),
    tintBorder: `oklch(0.7 ${clamp(chroma * 0.5, 0.04, 0.1).toFixed(3)} ${h.toFixed(3)} / 0.5)`,
  };
}

/**
 * Neutrals keyed to the swatch hue (or warm paper for grey). Lightness and
 * alpha match the former fixed blue-grey scale; only the hue and a little
 * chroma change, so contrast is unaffected.
 */
export function buildThemeNeutralColors(
  baseColor: string,
  darkMode = false,
): ThemeNeutralColors {
  const parsed = parseOklch(baseColor);
  const isGrey = !parsed || parsed.c < 0.012;
  const h = isGrey ? PAPER_HUE : parsed.h;
  // A touch more chroma on hue swatches than on paper grey
  const ink = isGrey ? 0.012 : 0.03;
  const soft = isGrey ? 0.008 : 0.02;

  if (darkMode) {
    return {
      text: formatOklch(0.97, isGrey ? 0.006 : 0.012, h),
      muted: formatOklch(0.72, soft, h),
      borderInk: formatOklch(0.32, soft, h),
      border: `oklch(0.32 ${soft.toFixed(3)} ${h.toFixed(3)} / 0.38)`,
      borderStrong: `oklch(0.32 ${soft.toFixed(3)} ${h.toFixed(3)} / 0.58)`,
      controlBorder: `oklch(0.32 ${soft.toFixed(3)} ${h.toFixed(3)} / 0.5)`,
      controlBg: formatOklch(0.26, isGrey ? 0.008 : 0.014, h),
      chipBorderSoft: `oklch(0.32 ${soft.toFixed(3)} ${h.toFixed(3)} / 0.28)`,
    };
  }
  return {
    text: formatOklch(0.26, ink, h),
    muted: formatOklch(0.42, ink, h),
    borderInk: formatOklch(0.42, soft + 0.008, h),
    border: `oklch(0.42 ${(soft + 0.008).toFixed(3)} ${h.toFixed(3)} / 0.16)`,
    borderStrong: `oklch(0.42 ${(soft + 0.008).toFixed(3)} ${h.toFixed(3)} / 0.28)`,
    controlBorder: `oklch(0.42 ${(soft + 0.008).toFixed(3)} ${h.toFixed(3)} / 0.22)`,
    controlBg: formatOklch(0.967, isGrey ? 0.008 : 0.012, h),
    chipBorderSoft: `oklch(0.42 ${(soft + 0.008).toFixed(3)} ${h.toFixed(3)} / 0.14)`,
  };
}

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

/**
 * Light-mode interactive family keyed to a palette source color: the fill is
 * the source itself (lightness held inside a usable band), and the label is
 * white on the deeper hues or near-black ink on the brighter ones, per the
 * JOYFUL_SYSTEMS rule that bold color lives in the interactive layer.
 */
function buildSourceSurfaceColors(source: ParsedOklch): ThemeSurfaceColors {
  const { h } = source;
  const l = clamp(source.l, 0.6, 0.84);
  const c = clamp(source.c * 0.94, 0.08, 0.24);
  const inkOnFill = l >= 0.66;

  const activeBg = formatOklch(l, c, h);
  const activeFg = inkOnFill ? formatOklch(0.2, clamp(c * 0.18, 0.01, 0.04), h) : formatOklch(0.985, 0.004, h);
  const prominentBg = formatOklch(l - 0.02, clamp(c * 1.02, c, 0.25), h);

  return {
    activeBg,
    activeFg,
    prominentBg,
    prominentBgStrong: formatOklch(l - 0.06, clamp(c * 1.04, c, 0.26), h),
    prominentFg: activeFg,
    // Palette hue used as text on paper must be darkened to meet contrast
    prominentText: formatOklch(Math.min(0.5, l - 0.16), clamp(c * 0.8, 0.06, 0.18), h),
    ...buildTintColors(h, source.c, false),
  };
}

export function buildThemeSurfaceColors(
  baseColor: string,
  darkMode = false,
  sourceColor?: string,
): ThemeSurfaceColors {
  const parsed = parseOklch(baseColor);
  if (!parsed) {
    return darkMode ? DARK_SURFACE_FALLBACK : LIGHT_SURFACE_FALLBACK;
  }

  if (!darkMode && sourceColor) {
    const source = parseOklch(sourceColor);
    if (source) return buildSourceSurfaceColors(source);
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
      ...buildTintColors(h, c * 4, true),
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
    ...buildTintColors(h, activeChroma, false),
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

export function getCanvasGradientStops(
  baseColor: string,
  darkMode = false,
): { top: string; base: string } {
  const topDelta = darkMode
    ? CANVAS_GRADIENT_TOP_DELTA_DARK
    : CANVAS_GRADIENT_TOP_DELTA_LIGHT;
  return { top: adjustOklchLightness(baseColor, topDelta), base: baseColor };
}

export function buildCanvasGradient(
  baseColor: string,
  darkMode = false,
): string {
  const { top, base } = getCanvasGradientStops(baseColor, darkMode);
  const fadeEndPercent = Math.round(CANVAS_GRADIENT_FADE_END * 100);

  return `linear-gradient(180deg, ${top} 0%, ${base} ${fadeEndPercent}%, ${base} 100%)`;
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
  root.setProperty('--bookmark-tint-bg', surfaces.tintBg);
  root.setProperty('--bookmark-tint-ink', surfaces.tintInk);
  root.setProperty('--bookmark-tint-border', surfaces.tintBorder);
}

function applyThemeNeutralColors(neutrals: ThemeNeutralColors): void {
  const root = document.documentElement.style;

  root.setProperty('--bookmark-text', neutrals.text);
  root.setProperty('--bookmark-muted', neutrals.muted);
  root.setProperty('--bookmark-border-ink', neutrals.borderInk);
  root.setProperty('--bookmark-secondary-text', neutrals.borderInk);
  root.setProperty('--bookmark-border', neutrals.border);
  root.setProperty('--bookmark-border-strong', neutrals.borderStrong);
  root.setProperty('--bookmark-control-border', neutrals.controlBorder);
  root.setProperty('--bookmark-control-bg', neutrals.controlBg);
  root.setProperty('--bookmark-chip-secondary-border-soft', neutrals.chipBorderSoft);
}

export function applyCanvasColor(colorId: CanvasColorId): void {
  const option = getCanvasColorOption(colorId);
  const dark = isDarkTheme();
  const baseColor = dark ? option.dark : option.light;
  const surfaces = buildThemeSurfaceColors(baseColor, dark, option.source);
  const root = document.documentElement.style;

  root.setProperty('--bookmark-experiment-bg', buildCanvasGradient(baseColor, dark));
  root.setProperty('--bookmark-canvas-base', baseColor);
  root.setProperty(
    '--bookmark-stack-surface',
    buildStackSurfaceColor(baseColor, dark),
  );
  root.removeProperty('--bookmark-stack-frosted-bg');
  applyThemeSurfaceColors(surfaces);
  applyThemeNeutralColors(buildThemeNeutralColors(baseColor, dark));

  const stops = getCanvasGradientStops(baseColor, dark);
  updateThemedFavicon(stops.top, stops.base, dark);
  updateThemeColorMeta(baseColor);
}

let themeObserver: MutationObserver | null = null;

export function initCanvasColor(): void {
  applyCanvasColor(getStoredCanvasColorId());

  // Neutrals and fills differ per theme; re-derive whenever data-theme flips
  if (typeof MutationObserver !== 'undefined' && !themeObserver) {
    themeObserver = new MutationObserver(() => {
      applyCanvasColor(getStoredCanvasColorId());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
}

export function persistCanvasColor(colorId: CanvasColorId): void {
  localStorage.setItem(CANVAS_COLOR_STORAGE_KEY, colorId);
}
