# JOYFUL_SYSTEMS

A design language for tools that feel like well-made objects: engineered, dependable, and quietly fun. Products built on JOYFUL_SYSTEMS should feel the way a good game controller feels in the hand — everything reachable, everything responsive, nothing decorative for its own sake.

This document is abstract on purpose. It defines the system's values, tokens, and rules independent of any one product, so any project can adopt it and express it through its own components.

---

## Philosophy

**Joy through utility.** Delight is never a layer painted on top; it is the byproduct of an interface that responds instantly, predictably, and with a little warmth. If a flourish slows the user down, cut it.

**Game-design ergonomics.** Borrow from games, not in aesthetics but in feel: immediate feedback for every input, generous hit targets, states you can read at a glance, zero-ambiguity affordances. The user should always know what just happened and what they can do next.

**The Honda/Nintendo standard.** Both brands make products that are approachable, humble in form, and obsessively engineered underneath. JOYFUL_SYSTEMS aims for the same posture: friendly surfaces, serious mechanics. Nothing flashy; everything considered. A JOYFUL_SYSTEMS product should feel like it will still work perfectly in ten years.

**Utilitarian core.** Every interaction pattern is chosen for efficiency first. Playfulness lives in color, sound, and micro-feedback — never in the structure of a workflow.

---

## Color

### Foundations

Backgrounds are close-to-white — near-white neutrals that read as paper, with at most a whisper of hue (OKLCH lightness ≥ 0.985, chroma ≤ 0.008 in light contexts). Bold color never floods a surface; it concentrates in the interactive layer, where it signals meaning.

Dark contexts invert to deep, softly tinted near-blacks (lightness ≈ 0.22–0.24) with the same restraint.

### Palette

Eight bold, saturated hues. They are the voice of the system — used for accents, states, categories, and moments of feedback against the near-white ground.

| Name   | Hex       | OKLCH (approx.)        |
| ------ | --------- | ---------------------- |
| Blue   | `#5077FF` | `oklch(0.62 0.21 268)` |
| Cyan   | `#00C4FF` | `oklch(0.77 0.15 229)` |
| Green  | `#00C500` | `oklch(0.71 0.24 143)` |
| Gold   | `#FFD700` | `oklch(0.89 0.18 95)`  |
| Orange | `#FFA422` | `oklch(0.79 0.17 68)`  |
| Coral  | `#FF5A6F` | `oklch(0.69 0.20 17)`  |
| Violet | `#B38CFD` | `oklch(0.72 0.16 298)` |
| Pink   | `#FF98D0` | `oklch(0.80 0.14 347)` |

### Usage rules

- **One dominant hue per surface.** A screen may key itself to a single palette hue (user-chosen or context-chosen); the other hues appear only as semantic or categorical accents.
- **Color carries meaning, not decoration.** Green for success/go, Coral for destructive/stop, Gold for attention. Categorical uses (tags, labels) may use any hue, but consistently.
- **Derive, don't hardcode.** Tints, hovers, and fills should be computed from the palette hue (e.g., in OKLCH: hold hue, move lightness/chroma) so every hue produces a coherent family of surfaces.
- **Never color-only.** Every state signaled by color also gets a shape, icon, or text cue.

### Contrast

- Measure with **APCA** (preferred over WCAG 2 ratios).
- Body text on near-white: APCA Lc ≥ 75. UI labels and secondary text: Lc ≥ 60. Large/bold display text: Lc ≥ 45.
- Palette hues at full strength are for fills and accents — text set in a palette hue must be darkened along its hue until it meets the targets above.
- Interactive states increase contrast on hover/active/focus, never decrease it.

---

## Typography

**Soft, not slack.** Type is rounded and warm in character (soft terminals, gentle curves — the humanist end of geometric), but set compactly and precisely: small sizes, tight leading, restrained weights.

- UI text sits small (≈13px base, ≈12px captions) and earns legibility through contrast and spacing, not size.
- Lowercase is welcome in brand and interface voice; it reads friendly and unpretentious.
- Numbers that will be compared use tabular figures.
- Two weights are usually enough: a regular for content, one heavier cut for emphasis. Hierarchy comes from spacing and color before it comes from scale.

---

## Spacing

A **4px base unit**. All padding, gaps, and layout rhythm are multiples of it:

| Token  | Value | Typical use                          |
| ------ | ----- | ------------------------------------ |
| `s-1`  | 4px   | Icon-to-label gaps, tight inline     |
| `s-2`  | 8px   | Intra-component padding              |
| `s-3`  | 12px  | Component padding, list row insets   |
| `s-4`  | 16px  | Gaps between related components      |
| `s-6`  | 24px  | Section spacing                      |
| `s-8`  | 32px  | Region spacing                       |
| `s-12` | 48px  | Page-level breathing room            |

Density is a feature — JOYFUL_SYSTEMS products are working tools, so prefer the compact end of the scale and let near-white space, not large gaps, provide calm. Hit targets stay generous regardless: **≥ 24px** desktop, **≥ 44px** touch, expanding the hit area beyond the visual when needed.

---

## Corner radius

Soft geometry, like molded hardware. Corners are rounded enough to feel friendly, never so round that shapes lose their structure.

| Token       | Value  | Typical use                        |
| ----------- | ------ | ---------------------------------- |
| `r-sm`      | 6px    | Inline elements, tags, small chips |
| `r-md`      | 10px   | Inputs, buttons, list rows         |
| `r-lg`      | 16px   | Cards, panels, popovers            |
| `r-xl`      | 24px   | Modals, sheets, top-level surfaces |
| `r-pill`    | 999px  | Pills, toggles, avatars            |

**Nesting rule:** a child's radius is always ≤ its parent's, ideally concentric (child radius = parent radius − parent padding). Never a sharper corner inside a softer one.

---

## Motion

**Short and unobtrusive.** Animation exists to confirm cause and effect, not to entertain.

- Micro-feedback (press, toggle, hover): **80–120ms**.
- State/layout transitions (open, dismiss, reorder): **150–250ms**. Nothing routine exceeds 300ms.
- Ease-out for things entering, ease-in for things leaving; snappy starts, soft landings.
- Animate only compositor-friendly properties (`transform`, `opacity`).
- Every animation is interruptible and input-driven — nothing autoplays, nothing loops.
- Honor `prefers-reduced-motion` with a reduced or disabled variant, always.

The reference feel is a good mechanical button: instant engagement, a tiny travel, a clean settle.

---

## Sound

Sound is a first-class feedback channel — the audible version of the same mechanical honesty.

- Short, quiet, tactile: clicks, ticks, and soft confirmation blips under ~150ms. Think console UI and camera shutters, not notification chimes.
- Map sounds to *mechanics*, not events: one sound family for confirm, one for dismiss/cancel, one for error/blocked, one for movement/reorder. Consistency is what makes them informative.
- Sound accompanies feedback the interface already gives visually; it never carries meaning alone.
- Always user-controllable, default respectful: low volume, no sound on passive/ambient events, silenced entirely when the OS or user signals it.

---

## Interaction principles

1. **Respond first, resolve second.** Optimistic UI everywhere it's safe; reconcile quietly, offer Undo on failure.
2. **Everything reachable.** Full keyboard support, visible focus, no dead ends — every state offers a next step.
3. **If it looks pressable, it presses.** And it clicks, dips, or blips when it does.
4. **Fast is a feature.** Mutations target < 500ms; feedback is immediate even when work is not.
5. **Read at a glance.** State is legible without hovering, opening, or remembering.

---

## Adopting JOYFUL_SYSTEMS

A project adopts this language by: keying its neutrals to close-to-white/near-black foundations; deriving its interactive color families from the eight palette hues; using the 4px spacing scale and the radius ramp; keeping motion inside the timing envelope; and treating sound as part of its feedback vocabulary. Component shapes and product structure remain the project's own.
