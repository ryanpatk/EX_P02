export type CanvasColorId =
  | 'grey'
  | 'blush'
  | 'lavender'
  | 'lilac'
  | 'sky'
  | 'mint'
  | 'sage'
  | 'peach'
  | 'butter';

export interface CanvasColorOption {
  id: CanvasColorId;
  label: string;
  light: string;
  dark: string;
  shadowHue: number;
}

export const CANVAS_COLOR_STORAGE_KEY = 'canvasColor';

export const DEFAULT_CANVAS_COLOR_ID: CanvasColorId = 'grey';

export const CANVAS_COLOR_OPTIONS: CanvasColorOption[] = [
  {
    id: 'grey',
    label: 'Soft grey',
    light: 'oklch(0.94 0.009 264)',
    dark: 'oklch(0.22 0.012 264)',
    shadowHue: 264,
  },
  {
    id: 'blush',
    label: 'Blush',
    light: 'oklch(0.935 0.042 355)',
    dark: 'oklch(0.24 0.035 355)',
    shadowHue: 355,
  },
  {
    id: 'lavender',
    label: 'Lavender',
    light: 'oklch(0.94 0.04 290)',
    dark: 'oklch(0.24 0.032 290)',
    shadowHue: 290,
  },
  {
    id: 'lilac',
    label: 'Lilac',
    light: 'oklch(0.938 0.045 305)',
    dark: 'oklch(0.23 0.036 305)',
    shadowHue: 305,
  },
  {
    id: 'sky',
    label: 'Sky',
    light: 'oklch(0.942 0.038 235)',
    dark: 'oklch(0.23 0.03 235)',
    shadowHue: 235,
  },
  {
    id: 'mint',
    label: 'Mint',
    light: 'oklch(0.944 0.042 165)',
    dark: 'oklch(0.23 0.034 165)',
    shadowHue: 165,
  },
  {
    id: 'sage',
    label: 'Sage',
    light: 'oklch(0.936 0.034 145)',
    dark: 'oklch(0.23 0.028 145)',
    shadowHue: 145,
  },
  {
    id: 'peach',
    label: 'Peach',
    light: 'oklch(0.94 0.045 45)',
    dark: 'oklch(0.24 0.034 45)',
    shadowHue: 45,
  },
  {
    id: 'butter',
    label: 'Butter',
    light: 'oklch(0.952 0.048 95)',
    dark: 'oklch(0.24 0.036 95)',
    shadowHue: 95,
  },
];

const canvasColorMap = new Map(
  CANVAS_COLOR_OPTIONS.map((option) => [option.id, option]),
);

export function getCanvasColorOption(id: string): CanvasColorOption {
  return (
    canvasColorMap.get(id as CanvasColorId) ??
    canvasColorMap.get(DEFAULT_CANVAS_COLOR_ID)!
  );
}

export function isCanvasColorId(value: string): value is CanvasColorId {
  return canvasColorMap.has(value as CanvasColorId);
}
