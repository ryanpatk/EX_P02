# Pastel Sky

Generated from the current project, including edits awaiting autosave. Return to the [theme index](../themes.md). Install the selected fonts and icons using the setup below; assets are acquired separately from their official sources.

## Font and icon setup

Follow [asset installation](../assets.md) when implementing this theme. Download and configure the selected free assets from their official sources; no font files or icon artwork are bundled. Weights below are the authored requests: load matching static faces or a variable range and report any unavailable weight. Register the exact family aliases below, or map the role tokens to the loader’s actual family.

| Selected font | Roles | Weights | Family stack | Setup |
| --- | --- | --- | --- | --- |
| <code>Inter</code> (free) | brand, ui, editorial, data | 400, 500, 600 | <code>"Sidebar Inter", sans-serif</code> | Download and load [Inter](https://rsms.me/inter/) in the app. |

### Icons

Selected: [Lucide](https://lucide.dev/guide/react/getting-started), outlined. Install and wire the selected free pack (React: <code>lucide-react</code>); reuse it if already installed. Use the official adapter for other frameworks.

Preserve icon size, color, weight, style, and accessible names. Match the selected style only where the pack supports it; Lucide’s official pack supplies outlines, so report a filled-style gap rather than claiming exact filled artwork. Keep existing package versions and add only missing packages using the receiving project’s package manager.

## Foundations

```json
{
  "name": "Pastel Sky",
  "text": {
    "l": {
      "size": 24,
      "lineHeight": 32
    },
    "m": {
      "size": 16,
      "lineHeight": 24
    },
    "s": {
      "size": 14,
      "lineHeight": 20
    },
    "xl": {
      "size": 37,
      "lineHeight": 41
    },
    "xs": {
      "size": 12,
      "lineHeight": 16
    },
    "xxl": {
      "size": 49,
      "lineHeight": 53
    },
    "xxs": {
      "size": 10,
      "lineHeight": 14
    }
  },
  "fonts": {
    "ui": {
      "family": "\"Sidebar Inter\", sans-serif",
      "weights": {
        "regular": 400,
        "medium": 500,
        "heavy": 600
      }
    },
    "data": {
      "family": "\"Sidebar Inter\", sans-serif",
      "weights": {
        "regular": 400,
        "medium": 500,
        "heavy": 600
      }
    },
    "brand": {
      "family": "\"Sidebar Inter\", sans-serif",
      "weights": {
        "regular": 400,
        "medium": 500,
        "heavy": 600
      }
    },
    "editorial": {
      "family": "\"Sidebar Inter\", sans-serif",
      "weights": {
        "regular": 400,
        "medium": 500,
        "heavy": 600
      }
    }
  },
  "border": {
    "none": 0,
    "s": 0.7506429036458333,
    "m": 0.79,
    "l": 1.43
  },
  "radius": {
    "l": 19,
    "m": 12,
    "s": 8,
    "xl": 29,
    "xs": 4,
    "full": 9999,
    "zero": 0
  },
  "shadows": {
    "l": {
      "x": 0,
      "y": 12,
      "blur": 36,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 14
    },
    "m": {
      "x": 0,
      "y": 4,
      "blur": 16,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 10
    },
    "s": {
      "x": 0,
      "y": 1,
      "blur": 3,
      "color": {
        "dark": "neutral-1",
        "light": "neutral-10"
      },
      "spread": 0,
      "opacity": 12
    }
  },
  "spacing": {
    "l": 25,
    "m": 17,
    "s": 12,
    "xl": 33,
    "xs": 8,
    "xxl": 50,
    "xxs": 4,
    "zero": 0
  },
  "animation": {
    "type": "spring",
    "large": {
      "type": "spring",
      "bounce": 0.3,
      "easing": [
        0.16,
        1,
        0.3,
        1
      ],
      "duration": 280,
      "visualDuration": 0.36
    },
    "bounce": 0.2,
    "easing": [
      0.16,
      1,
      0.3,
      1
    ],
    "duration": 160,
    "popupScale": 0.98,
    "pressDistance": 1,
    "visualDuration": 0.2
  },
  "focusRing": {
    "color": "color-1",
    "width": "l",
    "opacity": 55
  },
  "iconStyle": "outlined",
  "iconFamily": "Lucide",
  "neutralTone": "cool",
  "buttonRadius": "s",
  "colorEmphasis": 50.12858072916667,
  "surfaceDetails": {
    "dark": {
      "shade": 24,
      "highlight": 24,
      "gradientTop": 10,
      "recessedShade": 20,
      "gradientBottom": 12
    },
    "light": {
      "shade": 16,
      "highlight": 70,
      "gradientTop": 12,
      "recessedShade": 8,
      "gradientBottom": 5
    },
    "edgeColor": "neutral-6-transparent"
  },
  "primaryActionColor": "color-1",
  "letterSpacing": {
    "xs": -0.02,
    "s": -0.01,
    "m": 0,
    "l": 0.01,
    "xl": 0.02
  },
  "primaryForeground": {
    "light": "neutral-2",
    "dark": "neutral-2"
  }
}
```

## light CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Pastel Sky |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | 1.43px solid color-mix(in srgb, #247474 55%, transparent) |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 400ms |
| `--motion-easing` | linear(0, 0.2375, 0.5904, 0.8358, 0.9599, 1.0061, 1.0152, 1.0116, 1.0062, 1.0025, 1.0006, 0.9999, 1) |
| `--motion-type` | spring |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 600ms |
| `--motion-large-easing` | linear(0, 0.0846, 0.2691, 0.4778, 0.6674, 0.8179, 0.9249, 0.9926, 1.0293, 1.0442, 1.0452, 1.0388, 1.0296, 1.0202, 1.0121, 1.0061, 1.0019, 0.9995, 0.9983, 1) |
| `--motion-large-type` | spring |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.3 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.98 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | color-mix(in srgb, var(--color-1) 10%, transparent) |
| `--option-badge-foreground` | #247474 |
| `--navigation-active-foreground` | #1d2127 |
| `--emphasis-chart-fill` | #24747433 |
| `--emphasis-balance-background` | #f1f2f4 |
| `--emphasis-rewards-background` | #f1f2f4 |
| `--emphasis-icon-background` | #f1f2f4 |
| `--emphasis-icon-foreground` | #1d2127 |
| `--emphasis-type-background` | #f1f2f4 |
| `--emphasis-type-foreground` | #1d2127 |
| `--navigation-active-background` | #24747433 |
| `--surface-raised-image` | linear-gradient(180deg, #ffffff1f 0%, #ffffff00 48%, #1d21270d 100%) |
| `--surface-raised-shadow` | inset 0px 1px 0px 0px #ffffffb3, inset 0px -1px 0px 0px #1d212729 |
| `--surface-recessed-image` | linear-gradient(180deg, #1d21270d 0%, #1d212700 55%) |
| `--surface-recessed-shadow` | inset 0px 1px 2px 0px #1d212714, inset 0px -1px 0px 0px #ffffff59 |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 17px |
| `--space-l` | 25px |
| `--space-xl` | 33px |
| `--space-xxl` | 50px |
| `--tracking-xs` | -0.02em |
| `--tracking-s` | -0.01em |
| `--tracking-m` | 0em |
| `--tracking-l` | 0.01em |
| `--tracking-xl` | 0.02em |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0.02em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0.01em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | 0.01em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.01em |
| `--size-xl` | 37px |
| `--line-xl` | 41px |
| `--letter-spacing-xl` | -0.01em |
| `--size-xxl` | 49px |
| `--line-xxl` | 53px |
| `--letter-spacing-xxl` | -0.02em |
| `--radius-zero` | 0px |
| `--radius-xs` | 4px |
| `--radius-s` | 8px |
| `--radius-m` | 12px |
| `--radius-l` | 19px |
| `--radius-xl` | 29px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0.7506429036458333px |
| `--border-m` | 0.79px |
| `--border-l` | 1.43px |
| `--border-default-color` | #8f959c33 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | 0 0 0 0.7506429036458333px #8f959c33 |
| `--border-shadow-m` | 0 0 0 0.79px #8f959c33 |
| `--border-shadow-l` | 0 0 0 1.43px #8f959c33 |
| `--font-ui` | "Sidebar Inter", sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | "Sidebar Inter", sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | "Sidebar Inter", sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | "Sidebar Inter", sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #247474 |
| `--color-1-transparent` | #24747433 |
| `--color-2` | #bce0d9 |
| `--color-2-transparent` | #bce0d933 |
| `--color-3` | #c0c9df |
| `--color-3-transparent` | #c0c9df33 |
| `--color-4` | #dfcbb6 |
| `--color-4-transparent` | #dfcbb633 |
| `--neutral-1` | #ffffff |
| `--neutral-1-transparent` | #ffffff33 |
| `--neutral-2` | #f9fafb |
| `--neutral-2-transparent` | #f9fafb33 |
| `--neutral-3` | #f1f2f4 |
| `--neutral-3-transparent` | #f1f2f433 |
| `--neutral-4` | #dde0e5 |
| `--neutral-4-transparent` | #dde0e533 |
| `--neutral-5` | #c0c6cd |
| `--neutral-5-transparent` | #c0c6cd33 |
| `--neutral-6` | #8f959c |
| `--neutral-6-transparent` | #8f959c33 |
| `--neutral-7` | #6a6f75 |
| `--neutral-7-transparent` | #6a6f7533 |
| `--neutral-8` | #4c5157 |
| `--neutral-8-transparent` | #4c515733 |
| `--neutral-9` | #30353a |
| `--neutral-9-transparent` | #30353a33 |
| `--neutral-10` | #1d2127 |
| `--neutral-10-transparent` | #1d212733 |
| `--success` | #247348 |
| `--success-transparent` | #24734833 |
| `--warning` | #94651e |
| `--warning-transparent` | #94651e33 |
| `--error` | #bd3d42 |
| `--error-transparent` | #bd3d4233 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 0.25px 0.75px 0px #1d21270d, 0px 1px 3px 0px #1d212713 |
| `--shadow-m` | 0px 1px 4px 0px #1d21270b, 0px 4px 16px 0px #1d212710 |
| `--shadow-l` | 0px 3px 9px 0px #1d21270f, 0px 12px 36px 0px #1d212716 |
| `--cte-canvas` | #ffffff |
| `--cte-surface` | #f9fafb |
| `--cte-surface-muted` | #f1f2f4 |
| `--cte-text` | #1d2127 |
| `--cte-text-muted` | #6a6f75 |
| `--cte-border` | #8f959c33 |
| `--cte-accent` | #247474 |
| `--cte-accent-text` | #f9fafb |
| `--cte-danger` | #bd3d42 |
| `--cte-focus` | #247474 |
| `--cte-font` | "Sidebar Inter", sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | 0.01em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0.01em |

## dark CSS variables

Define these in the app’s existing theme scope for this mode. Keep component styles linked to the variables.

| Variable | Value |
| --- | --- |
| `--theme-name` | Pastel Sky |
| `--theme-icon-family` | Lucide |
| `--theme-icon-style` | outlined |
| `--toolbar-divider-bleed` | 0 |
| `--focus-ring-outline` | 1.43px solid color-mix(in srgb, #8ed6cd 55%, transparent) |
| `--icon-stroke-width` | 2 |
| `--icon-light-display` | none |
| `--icon-regular-display` | inline |
| `--icon-bold-display` | none |
| `--motion-duration` | 400ms |
| `--motion-easing` | linear(0, 0.2375, 0.5904, 0.8358, 0.9599, 1.0061, 1.0152, 1.0116, 1.0062, 1.0025, 1.0006, 0.9999, 1) |
| `--motion-type` | spring |
| `--motion-visual-duration` | 0.2 |
| `--motion-bounce` | 0.2 |
| `--motion-enabled` | 1 |
| `--motion-small-iterations` | infinite |
| `--motion-large-duration` | 600ms |
| `--motion-large-easing` | linear(0, 0.0846, 0.2691, 0.4778, 0.6674, 0.8179, 0.9249, 0.9926, 1.0293, 1.0442, 1.0452, 1.0388, 1.0296, 1.0202, 1.0121, 1.0061, 1.0019, 0.9995, 0.9983, 1) |
| `--motion-large-type` | spring |
| `--motion-large-visual-duration` | 0.36 |
| `--motion-large-bounce` | 0.3 |
| `--motion-large-iterations` | infinite |
| `--motion-popup-scale` | 0.98 |
| `--motion-press-distance` | 1px |
| `--option-badge-background` | color-mix(in srgb, var(--color-1) 10%, transparent) |
| `--option-badge-foreground` | #8ed6cd |
| `--navigation-active-foreground` | #f9fafb |
| `--emphasis-chart-fill` | #8ed6cd33 |
| `--emphasis-balance-background` | #272b31 |
| `--emphasis-rewards-background` | #272b31 |
| `--emphasis-icon-background` | #272b31 |
| `--emphasis-icon-foreground` | #f9fafb |
| `--emphasis-type-background` | #272b31 |
| `--emphasis-type-foreground` | #f9fafb |
| `--navigation-active-background` | #8ed6cd33 |
| `--surface-raised-image` | linear-gradient(180deg, #f9fafb1a 0%, #f9fafb00 48%, #13171d1f 100%) |
| `--surface-raised-shadow` | inset 0px 1px 0px 0px #f9fafb3d, inset 0px -1px 0px 0px #13171d3d |
| `--surface-recessed-image` | linear-gradient(180deg, #13171d1f 0%, #13171d00 55%) |
| `--surface-recessed-shadow` | inset 0px 1px 2px 0px #13171d33, inset 0px -1px 0px 0px #f9fafb1f |
| `--space-zero` | 0px |
| `--space-xxs` | 4px |
| `--space-xs` | 8px |
| `--space-s` | 12px |
| `--space-m` | 17px |
| `--space-l` | 25px |
| `--space-xl` | 33px |
| `--space-xxl` | 50px |
| `--tracking-xs` | -0.02em |
| `--tracking-s` | -0.01em |
| `--tracking-m` | 0em |
| `--tracking-l` | 0.01em |
| `--tracking-xl` | 0.02em |
| `--size-xxs` | 10px |
| `--line-xxs` | 14px |
| `--letter-spacing-xxs` | 0.02em |
| `--size-xs` | 12px |
| `--line-xs` | 16px |
| `--letter-spacing-xs` | 0.01em |
| `--size-s` | 14px |
| `--line-s` | 20px |
| `--letter-spacing-s` | 0.01em |
| `--size-m` | 16px |
| `--line-m` | 24px |
| `--letter-spacing-m` | 0em |
| `--size-l` | 24px |
| `--line-l` | 32px |
| `--letter-spacing-l` | -0.01em |
| `--size-xl` | 37px |
| `--line-xl` | 41px |
| `--letter-spacing-xl` | -0.01em |
| `--size-xxl` | 49px |
| `--line-xxl` | 53px |
| `--letter-spacing-xxl` | -0.02em |
| `--radius-zero` | 0px |
| `--radius-xs` | 4px |
| `--radius-s` | 8px |
| `--radius-m` | 12px |
| `--radius-l` | 19px |
| `--radius-xl` | 29px |
| `--radius-full` | 9999px |
| `--border-none` | 0px |
| `--border-s` | 0.7506429036458333px |
| `--border-m` | 0.79px |
| `--border-l` | 1.43px |
| `--border-default-color` | #7c828833 |
| `--border-shadow-none` | 0 0 0 0 transparent |
| `--border-shadow-s` | inset 0 0 0 0.7506429036458333px #7c828833 |
| `--border-shadow-m` | inset 0 0 0 0.79px #7c828833 |
| `--border-shadow-l` | inset 0 0 0 1.43px #7c828833 |
| `--font-ui` | "Sidebar Inter", sans-serif |
| `--weight-ui-regular` | 400 |
| `--weight-ui-medium` | 500 |
| `--weight-ui-heavy` | 600 |
| `--font-brand` | "Sidebar Inter", sans-serif |
| `--weight-brand-regular` | 400 |
| `--weight-brand-medium` | 500 |
| `--weight-brand-heavy` | 600 |
| `--font-editorial` | "Sidebar Inter", sans-serif |
| `--weight-editorial-regular` | 400 |
| `--weight-editorial-medium` | 500 |
| `--weight-editorial-heavy` | 600 |
| `--font-data` | "Sidebar Inter", sans-serif |
| `--weight-data-regular` | 400 |
| `--weight-data-medium` | 500 |
| `--weight-data-heavy` | 600 |
| `--color-none` | transparent |
| `--color-1` | #8ed6cd |
| `--color-1-transparent` | #8ed6cd33 |
| `--color-2` | #659b94 |
| `--color-2-transparent` | #659b9433 |
| `--color-3` | #9aa8c7 |
| `--color-3-transparent` | #9aa8c733 |
| `--color-4` | #bfaa91 |
| `--color-4-transparent` | #bfaa9133 |
| `--neutral-1` | #13171d |
| `--neutral-1-transparent` | #13171d33 |
| `--neutral-2` | #1d2127 |
| `--neutral-2-transparent` | #1d212733 |
| `--neutral-3` | #272b31 |
| `--neutral-3-transparent` | #272b3133 |
| `--neutral-4` | #373c41 |
| `--neutral-4-transparent` | #373c4133 |
| `--neutral-5` | #51565c |
| `--neutral-5-transparent` | #51565c33 |
| `--neutral-6` | #7c8288 |
| `--neutral-6-transparent` | #7c828833 |
| `--neutral-7` | #a7adb4 |
| `--neutral-7-transparent` | #a7adb433 |
| `--neutral-8` | #c8ced5 |
| `--neutral-8-transparent` | #c8ced533 |
| `--neutral-9` | #e6e8ec |
| `--neutral-9-transparent` | #e6e8ec33 |
| `--neutral-10` | #f9fafb |
| `--neutral-10-transparent` | #f9fafb33 |
| `--success` | #8fd5ad |
| `--success-transparent` | #8fd5ad33 |
| `--warning` | #e5c279 |
| `--warning-transparent` | #e5c27933 |
| `--error` | #f49fa5 |
| `--error-transparent` | #f49fa533 |
| `--shadow-none` | none |
| `--shadow-s` | 0px 0.25px 0.75px 0px #13171d0d, 0px 1px 3px 0px #13171d13 |
| `--shadow-m` | 0px 1px 4px 0px #13171d0b, 0px 4px 16px 0px #13171d10 |
| `--shadow-l` | 0px 3px 9px 0px #13171d0f, 0px 12px 36px 0px #13171d16 |
| `--cte-canvas` | #13171d |
| `--cte-surface` | #1d2127 |
| `--cte-surface-muted` | #272b31 |
| `--cte-text` | #f9fafb |
| `--cte-text-muted` | #a7adb4 |
| `--cte-border` | #7c828833 |
| `--cte-accent` | #8ed6cd |
| `--cte-accent-text` | #1d2127 |
| `--cte-danger` | #f49fa5 |
| `--cte-focus` | #8ed6cd |
| `--cte-font` | "Sidebar Inter", sans-serif |
| `--cte-font-size` | 14px |
| `--cte-font-weight` | 400 |
| `--cte-line-height` | 20px |
| `--cte-letter-spacing` | 0.01em |
| `--cte-detail-font-size` | 12px |
| `--cte-detail-line-height` | 16px |
| `--cte-detail-letter-spacing` | 0.01em |

## Authored component assignments

These are project edits. The [component reference](pastel-sky-components.md) includes the effective assignments with defaults and shared parts resolved.

```json
{
  "componentTokens": {
    "button:outline:rest": {
      "borderColor": "neutral-6-transparent"
    },
    "button:primary:rest": {
      "shadow": "s",
      "borderColor": "neutral-6-transparent"
    },
    "button:primary:focus": {
      "shadow": "s",
      "borderColor": "neutral-7-transparent"
    },
    "button:primary:hover": {
      "shadow": "s",
      "borderColor": "neutral-7-transparent"
    },
    "button:secondary:rest": {
      "shadow": "s",
      "background": "neutral-1",
      "borderColor": "neutral-6-transparent"
    },
    "button:secondary:focus": {
      "shadow": "s",
      "background": "neutral-2",
      "borderColor": "neutral-7-transparent"
    },
    "button:secondary:hover": {
      "shadow": "s",
      "background": "neutral-2",
      "borderColor": "neutral-7-transparent"
    }
  },
  "componentVariants": {}
}
```
