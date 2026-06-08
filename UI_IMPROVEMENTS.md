# Design Language

A complete, consistent design system for the app. All values are defined as CSS custom properties and composed into themes.

---

## Fonts

Two font pairs are used across the system. Display fonts carry personality; body fonts carry readability.

```css
@import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap");
```

| Role               | Font               | Notes                                         |
| ------------------ | ------------------ | --------------------------------------------- |
| Display / Headings | `Instrument Serif` | Warm, editorial serif with expressive italics |
| Body / UI          | `DM Sans`          | Clean, optical-size aware grotesque           |

---

## Color Palette

### Apache (Brand)

The primary palette. Warm amber/gold with a parchment feel.

| Stop | Variable             | Hex       |
| ---- | -------------------- | --------- |
| 50   | `--color-apache-50`  | `#fcf8ee` |
| 100  | `--color-apache-100` | `#f5ebd0` |
| 200  | `--color-apache-200` | `#ead59d` |
| 300  | `--color-apache-300` | `#e2c178` |
| 400  | `--color-apache-400` | `#d7a448` |
| 500  | `--color-apache-500` | `#ce8832` |
| 600  | `--color-apache-600` | `#b66a29` |
| 700  | `--color-apache-700` | `#984e25` |
| 800  | `--color-apache-800` | `#7c3f24` |
| 900  | `--color-apache-900` | `#673420` |
| 950  | `--color-apache-950` | `#3a1a0e` |

### Neutral (Structural)

Cool-leaning gray for body text and UI chrome. Pairs with Apache's warmth without competing.

| Stop | Variable              | Hex       |
| ---- | --------------------- | --------- |
| 50   | `--color-neutral-50`  | `#f8f8f7` |
| 100  | `--color-neutral-100` | `#efefed` |
| 200  | `--color-neutral-200` | `#d9d9d5` |
| 300  | `--color-neutral-300` | `#b8b8b2` |
| 400  | `--color-neutral-400` | `#8f8f88` |
| 500  | `--color-neutral-500` | `#6b6b64` |
| 600  | `--color-neutral-600` | `#555550` |
| 700  | `--color-neutral-700` | `#3e3e3a` |
| 800  | `--color-neutral-800` | `#2b2b28` |
| 900  | `--color-neutral-900` | `#1a1a18` |
| 950  | `--color-neutral-950` | `#0d0d0c` |

### Semantic

Fixed-meaning colors for system feedback. Theme-independent.

| Role          | Variable                | Hex       |
| ------------- | ----------------------- | --------- |
| Success       | `--color-success`       | `#3d8f5f` |
| Success light | `--color-success-light` | `#eaf5ef` |
| Warning       | `--color-warning`       | `#c47d1a` |
| Warning light | `--color-warning-light` | `#fef6e7` |
| Danger        | `--color-danger`        | `#c0392b` |
| Danger light  | `--color-danger-light`  | `#fdecea` |
| Info          | `--color-info`          | `#2e6fa8` |
| Info light    | `--color-info-light`    | `#e8f2fb` |

---

## Role Mapping

Semantic roles that components reference. Themes swap these values; components never reference raw palette stops directly.

### Interactive

| Role            | Variable                  |
| --------------- | ------------------------- |
| Primary         | `--color-primary`         |
| Primary hover   | `--color-primary-hover`   |
| Primary active  | `--color-primary-active`  |
| On Primary      | `--color-on-primary`      |
| Secondary       | `--color-secondary`       |
| Secondary hover | `--color-secondary-hover` |
| On Secondary    | `--color-on-secondary`    |

### Surfaces

| Role                     | Variable                  |
| ------------------------ | ------------------------- |
| Surface (page bg)        | `--color-surface`         |
| Surface raised (cards)   | `--color-surface-raised`  |
| Surface overlay (modals) | `--color-surface-overlay` |
| Muted fill               | `--color-muted`           |

### Borders

| Role           | Variable                |
| -------------- | ----------------------- |
| Border subtle  | `--color-border-subtle` |
| Border default | `--color-border`        |
| Border strong  | `--color-border-strong` |
| Focus ring     | `--color-focus`         |

### Typography

| Role           | Variable                 |
| -------------- | ------------------------ |
| Text primary   | `--color-text-primary`   |
| Text secondary | `--color-text-secondary` |
| Text tertiary  | `--color-text-tertiary`  |
| Text disabled  | `--color-text-disabled`  |
| Text on dark   | `--color-text-inverse`   |

### Decorative

| Role          | Variable                |
| ------------- | ----------------------- |
| Accent        | `--color-accent`        |
| Accent subtle | `--color-accent-subtle` |

---

## Themes

Each theme is a `data-theme` attribute on `<html>` or a wrapping element. All components use role variables only — themes swap the values underneath.

### Cream (Default)

Warm parchment. Light, editorial, inviting.

```css
[data-theme="cream"] {
    /* Interactive */
    --color-primary: var(--color-apache-500);
    --color-primary-hover: var(--color-apache-600);
    --color-primary-active: var(--color-apache-700);
    --color-on-primary: var(--color-apache-50);
    --color-secondary: var(--color-apache-200);
    --color-secondary-hover: var(--color-apache-300);
    --color-on-secondary: var(--color-apache-900);

    /* Surfaces */
    --color-surface: var(--color-apache-50);
    --color-surface-raised: #ffffff;
    --color-surface-overlay: #ffffff;
    --color-muted: var(--color-apache-100);

    /* Borders */
    --color-border-subtle: var(--color-apache-100);
    --color-border: var(--color-apache-200);
    --color-border-strong: var(--color-apache-300);
    --color-focus: var(--color-apache-400);

    /* Typography */
    --color-text-primary: var(--color-neutral-900);
    --color-text-secondary: var(--color-neutral-600);
    --color-text-tertiary: var(--color-neutral-400);
    --color-text-disabled: var(--color-neutral-300);
    --color-text-inverse: var(--color-apache-50);

    /* Decorative */
    --color-accent: var(--color-apache-400);
    --color-accent-subtle: var(--color-apache-100);
}
```

---

### Ember (Dark)

Deep, rich, firelit. Dark surfaces with glowing amber accents.

```css
[data-theme="ember"] {
    /* Interactive */
    --color-primary: var(--color-apache-400);
    --color-primary-hover: var(--color-apache-300);
    --color-primary-active: var(--color-apache-200);
    --color-on-primary: var(--color-apache-950);
    --color-secondary: var(--color-apache-800);
    --color-secondary-hover: var(--color-apache-700);
    --color-on-secondary: var(--color-apache-100);

    /* Surfaces */
    --color-surface: var(--color-apache-950);
    --color-surface-raised: var(--color-apache-900);
    --color-surface-overlay: var(--color-apache-800);
    --color-muted: #2a1509;

    /* Borders */
    --color-border-subtle: var(--color-apache-900);
    --color-border: var(--color-apache-800);
    --color-border-strong: var(--color-apache-700);
    --color-focus: var(--color-apache-400);

    /* Typography */
    --color-text-primary: var(--color-apache-50);
    --color-text-secondary: var(--color-apache-200);
    --color-text-tertiary: var(--color-apache-400);
    --color-text-disabled: var(--color-apache-700);
    --color-text-inverse: var(--color-apache-950);

    /* Decorative */
    --color-accent: var(--color-apache-400);
    --color-accent-subtle: var(--color-apache-900);
}
```

---

### Slate (Neutral Dark)

Cool-dark system UI feel. Apache brand colors used sparingly as accents only.

```css
[data-theme="slate"] {
    /* Interactive */
    --color-primary: var(--color-apache-400);
    --color-primary-hover: var(--color-apache-300);
    --color-primary-active: var(--color-apache-200);
    --color-on-primary: var(--color-neutral-950);
    --color-secondary: var(--color-neutral-700);
    --color-secondary-hover: var(--color-neutral-600);
    --color-on-secondary: var(--color-neutral-100);

    /* Surfaces */
    --color-surface: var(--color-neutral-900);
    --color-surface-raised: var(--color-neutral-800);
    --color-surface-overlay: var(--color-neutral-700);
    --color-muted: var(--color-neutral-800);

    /* Borders */
    --color-border-subtle: var(--color-neutral-800);
    --color-border: var(--color-neutral-700);
    --color-border-strong: var(--color-neutral-500);
    --color-focus: var(--color-apache-400);

    /* Typography */
    --color-text-primary: var(--color-neutral-50);
    --color-text-secondary: var(--color-neutral-300);
    --color-text-tertiary: var(--color-neutral-500);
    --color-text-disabled: var(--color-neutral-700);
    --color-text-inverse: var(--color-neutral-950);

    /* Decorative */
    --color-accent: var(--color-apache-400);
    --color-accent-subtle: var(--color-neutral-800);
}
```

---

### Parchment (High Contrast Light)

Warmer and more saturated than Cream. For UGC contexts and reader-style views.

```css
[data-theme="parchment"] {
    /* Interactive */
    --color-primary: var(--color-apache-600);
    --color-primary-hover: var(--color-apache-700);
    --color-primary-active: var(--color-apache-800);
    --color-on-primary: var(--color-apache-50);
    --color-secondary: var(--color-apache-100);
    --color-secondary-hover: var(--color-apache-200);
    --color-on-secondary: var(--color-apache-900);

    /* Surfaces */
    --color-surface: var(--color-apache-100);
    --color-surface-raised: var(--color-apache-50);
    --color-surface-overlay: #ffffff;
    --color-muted: var(--color-apache-200);

    /* Borders */
    --color-border-subtle: var(--color-apache-200);
    --color-border: var(--color-apache-300);
    --color-border-strong: var(--color-apache-400);
    --color-focus: var(--color-apache-500);

    /* Typography */
    --color-text-primary: var(--color-apache-950);
    --color-text-secondary: var(--color-apache-800);
    --color-text-tertiary: var(--color-apache-600);
    --color-text-disabled: var(--color-apache-300);
    --color-text-inverse: var(--color-apache-50);

    /* Decorative */
    --color-accent: var(--color-apache-500);
    --color-accent-subtle: var(--color-apache-200);
}
```

---

## Typography Scale

All heading elements use `Instrument Serif`. Body and UI copy use `DM Sans`.

```css
:root {
    --font-display: "Instrument Serif", Georgia, serif;
    --font-body: "DM Sans", system-ui, sans-serif;
    --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### Headings

```css
h1,
h2,
h3,
h4,
h5,
h6 {
    font-family: var(--font-display);
    font-weight: 400;
    color: var(--color-text-primary);
    line-height: 1.1;
    letter-spacing: -0.01em;
}
```

| Element   | Size   | Weight | Usage                         |
| --------- | ------ | ------ | ----------------------------- |
| `h1` hero | `52px` | 400    | Page hero, landing sections   |
| `h1`      | `42px` | 400    | Primary page title            |
| `h2`      | `32px` | 400    | Section headings              |
| `h3`      | `24px` | 400    | Sub-section, card titles      |
| `h4`      | `20px` | 400    | Component headings            |
| `h5`      | `17px` | 400    | Labels that need serif weight |
| `h6`      | `15px` | 400    | Small titled groups           |

```css
.text-hero {
    font-size: 52px;
    line-height: 1.05;
    letter-spacing: -0.02em;
}
h1 {
    font-size: 42px;
    line-height: 1.1;
    letter-spacing: -0.01em;
}
h2 {
    font-size: 32px;
    line-height: 1.15;
    letter-spacing: -0.01em;
}
h3 {
    font-size: 24px;
    line-height: 1.2;
}
h4 {
    font-size: 20px;
    line-height: 1.3;
}
h5 {
    font-size: 17px;
    line-height: 1.4;
}
h6 {
    font-size: 15px;
    line-height: 1.4;
}
```

### Italic Pattern

Emphasis inside headings uses italic to create voice and rhythm. Always `<em>`, never faked with `font-style`.

```html
<h1>What are we<br /><em>learning today?</em></h1>
<h2>Built for <em>curious minds</em></h2>
<h3>Your progress, <em>at a glance</em></h3>
```

```css
h1 em,
h2 em,
h3 em {
    font-style: italic;
    color: var(--color-text-secondary);
}
```

### Body

```css
body {
    font-family: var(--font-body);
    font-size: 16px;
    font-weight: 400;
    line-height: 1.7;
    color: var(--color-text-primary);
}
```

| Class        | Size   | Weight | Line height | Usage                    |
| ------------ | ------ | ------ | ----------- | ------------------------ |
| `.text-lg`   | `18px` | 400    | 1.7         | Lead paragraphs, intros  |
| `.text-base` | `16px` | 400    | 1.7         | Body copy (default)      |
| `.text-sm`   | `14px` | 400    | 1.6         | Secondary copy, captions |
| `.text-xs`   | `12px` | 400    | 1.5         | Labels, hints, metadata  |
| `.text-2xs`  | `11px` | 500    | 1.4         | Eyebrows, tags, badges   |

### UI Labels

```css
.label {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-tertiary);
}
```

Used for: section eyebrows, form labels, table column headers, status indicators.

---

## Spacing Scale

Based on a 4px base unit. All spatial values snap to this grid.

| Token        | Value  | Usage                                |
| ------------ | ------ | ------------------------------------ |
| `--space-1`  | `4px`  | Icon gaps, tight internal padding    |
| `--space-2`  | `8px`  | Chip internal padding, icon-text gap |
| `--space-3`  | `12px` | Input padding, compact card gaps     |
| `--space-4`  | `16px` | Standard internal padding            |
| `--space-5`  | `20px` | Card padding (compact)               |
| `--space-6`  | `24px` | Card padding (default)               |
| `--space-8`  | `32px` | Section internal spacing             |
| `--space-10` | `40px` | Between sections (tight)             |
| `--space-12` | `48px` | Between sections (default)           |
| `--space-16` | `64px` | Hero vertical padding                |
| `--space-20` | `80px` | Major section breaks                 |
| `--space-24` | `96px` | Page-level vertical rhythm           |

---

## Border Radius

| Token           | Value    | Usage                            |
| --------------- | -------- | -------------------------------- |
| `--radius-sm`   | `4px`    | Tags, badges, small chips        |
| `--radius-md`   | `8px`    | Inputs, buttons, small cards     |
| `--radius-lg`   | `12px`   | Cards, panels, dropdowns         |
| `--radius-xl`   | `16px`   | Modals, large cards              |
| `--radius-2xl`  | `24px`   | Feature cards, hero elements     |
| `--radius-full` | `9999px` | Pills, avatars, circular buttons |

---

## Elevation (Shadows)

Warm-tinted shadows that complement the Apache palette.

```css
--shadow-sm: 0 1px 2px rgba(58, 26, 14, 0.06);
--shadow-md: 0 4px 12px rgba(58, 26, 14, 0.08), 0 1px 3px rgba(58, 26, 14, 0.05);
--shadow-lg: 0 8px 24px rgba(58, 26, 14, 0.1), 0 2px 6px rgba(58, 26, 14, 0.06);
--shadow-xl: 0 16px 48px rgba(58, 26, 14, 0.12), 0 4px 12px rgba(58, 26, 14, 0.07);
--shadow-focus: 0 0 0 3px rgba(215, 164, 72, 0.35);
```

| Token            | Usage                                            |
| ---------------- | ------------------------------------------------ |
| `--shadow-sm`    | Subtle card lift, hover states                   |
| `--shadow-md`    | Default card elevation                           |
| `--shadow-lg`    | Dropdowns, popovers                              |
| `--shadow-xl`    | Modals, drawers                                  |
| `--shadow-focus` | Keyboard focus rings on all interactive elements |

---

## Motion

```css
--duration-fast: 100ms;
--duration-base: 160ms;
--duration-slow: 240ms;
--duration-slower: 400ms;

--ease-default: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

| Transition             | Duration            | Easing           | Usage                 |
| ---------------------- | ------------------- | ---------------- | --------------------- |
| Color, bg, border      | `--duration-fast`   | `--ease-default` | Hover states          |
| Transform (hover lift) | `--duration-base`   | `--ease-spring`  | Cards, buttons        |
| Expand/collapse        | `--duration-slow`   | `--ease-out`     | Dropdowns, accordions |
| Page transitions       | `--duration-slower` | `--ease-out`     | Route changes         |

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

---

## Z-Index Scale

```css
--z-base: 0;
--z-raised: 10;
--z-dropdown: 100;
--z-sticky: 200;
--z-overlay: 300;
--z-modal: 400;
--z-toast: 500;
```

---

## Notes

- Components always reference **role variables**, never raw palette stops.
- Themes are applied via `data-theme` on `<html>` or a section wrapper — enabling per-tile theming for UGC content.
- The `Parchment` theme is the recommended default for UGC/reader views. `Cream` for app chrome.
- The italic heading pattern (`<em>` inside `<h1>–<h3>`) is a consistent brand voice gesture — use it on at least one heading per major page section.
- Shadow color is derived from `--color-apache-950` (`#3a1a0e`) at low opacity, keeping them warm even in neutral contexts.
