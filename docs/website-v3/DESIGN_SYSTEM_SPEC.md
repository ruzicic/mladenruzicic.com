# Design system spec

## Design principles

1. Evidence over decoration
2. Editorial hierarchy over portfolio grid noise
3. Dense information, readable rhythm
4. Mobile first, desktop enriched
5. Motion as explanation, not entertainment
6. AI-era without AI cliches
7. Accessible by default
8. Machine-readable by design

## Typography

Recommended stack:

```txt
Display: Newsreader Variable
UI and body: Geist Sans
Mono: Geist Mono
```

Fallback:

```css
--font-display: Newsreader, Georgia, serif;
--font-sans: Geist, Inter, system-ui, sans-serif;
--font-mono: Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace;
```

Usage:

- Display: hero, section headings, case-study titles, pull quotes
- Sans: body, navigation, UI, cards, captions
- Mono: dates, statuses, metrics, route names, tags, code

## Type scale

```css
:root {
  --font-size-step--1: clamp(0.875rem, 0.84rem + 0.18vw, 0.95rem);
  --font-size-step-0: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --font-size-step-1: clamp(1.2rem, 1.08rem + 0.6vw, 1.5rem);
  --font-size-step-2: clamp(1.5rem, 1.25rem + 1.2vw, 2.25rem);
  --font-size-step-3: clamp(2rem, 1.55rem + 2.25vw, 3.5rem);
  --font-size-step-4: clamp(3rem, 2rem + 5vw, 6rem);
  --font-size-step-5: clamp(4rem, 2.5rem + 7vw, 8rem);
}
```

## Color tokens

```css
:root {
  color-scheme: light dark;

  --color-canvas: #f7f4ed;
  --color-surface: #efebe2;
  --color-surface-raised: #ffffff;
  --color-surface-inset: #ebe5d9;

  --color-text: #121212;
  --color-text-muted: #5f5a52;
  --color-text-subtle: #80796f;
  --color-border: #d8d2c7;

  --color-accent: #5b3df5;
  --color-accent-hover: #4424dc;
  --color-on-accent: #ffffff;

  --color-positive: #176b45;
  --color-warning: #936400;
  --color-danger: #9d2b2b;
  --color-focus: #5b3df5;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-canvas: #111111;
    --color-surface: #191919;
    --color-surface-raised: #212121;
    --color-surface-inset: #151515;

    --color-text: #f7f4ed;
    --color-text-muted: #bcb5aa;
    --color-text-subtle: #918b82;
    --color-border: #383633;

    --color-accent: #b8aaff;
    --color-accent-hover: #cec5ff;
    --color-on-accent: #121212;

    --color-positive: #86d9a5;
    --color-warning: #f0c36a;
    --color-danger: #ff9a9a;
    --color-focus: #b8aaff;
  }
}
```

## Spacing tokens

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --space-9: 6rem;
  --space-10: 8rem;
  --space-11: 10rem;
}
```

## Radius tokens

```css
:root {
  --radius-xs: 0.25rem;
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
  --radius-full: 999px;
}
```

## Layout

```txt
max-site-width: 1440px
max-content-width: 760px
case-study-content-width: 720px
wide-media-width: 1200px
mobile-padding: 20px
tablet-padding: 32px
desktop-padding: 64px
large-desktop-padding: 80px
section-gap: clamp(5rem, 10vw, 10rem)
```

## Grid

Use simple, stable grids:

- 1 column on mobile
- 2 columns for most tablet cards
- 3 columns only when cards remain readable
- case studies use a content column plus optional sticky metadata on desktop
- do not use masonry

## Motion tokens

```css
:root {
  --duration-fast: 120ms;
  --duration-normal: 220ms;
  --duration-slow: 450ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

## Motion rules

Use:

- opacity
- transform
- subtle scale
- View Transitions where useful
- CSS transitions for simple state changes

Avoid:

- parallax
- scroll-jacking
- animated blobs
- particles
- autoplay decoration
- heavy Framer Motion for simple hover states

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Focus states

All interactive elements need visible focus:

```css
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 4px;
}
```

## Surfaces

- `canvas`: page background
- `surface`: default section/card background
- `surface-raised`: cards, media frames, popovers
- `surface-inset`: code blocks, metadata panels

Elevation should be mostly border and contrast, not heavy shadows.

## Prose styling

- body copy width around 68 to 78 characters
- line-height 1.6 to 1.75
- visible links with underline or strong affordance
- generous spacing between sections
- code blocks use mono and inset surface
- tables scroll horizontally on mobile if needed

## Accessibility requirements

- one `h1` per page
- heading levels must not skip for visual reasons
- skip link present
- tap targets at least 44px where practical
- no color-only status
- all video previews muted by default
- all previews have still-image fallback
- all images have meaningful alt text or empty alt when decorative
- no focus traps
- no important text embedded only in images

## Modern platform features

Use progressively:

- CSS custom properties
- cascade layers
- container queries
- `:has()`
- `color-mix()`
- `light-dark()` where supported
- `clamp()`
- logical properties
- Dialog API
- Popover API
- View Transitions
- native lazy loading
- responsive images

## Dark mode stance

Prefer automatic dark mode through `prefers-color-scheme`. A manual toggle is optional and should not block v1.

## Claude Design output expectations

Claude Design should output:

- final token choices
- component compositions
- mobile and desktop screenshots
- homepage layout
- work index layout
- case-study layout
- key states: hover, focus, active, reduced motion
- handoff notes for Claude Code
