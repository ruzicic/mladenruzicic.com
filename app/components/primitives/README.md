# Primitives

The shared building blocks of the site. Pages and section components compose
these; nothing here knows about a specific page.

**Rules**

- Server Components by default. `'use client'`: `Popover`, `TransitionLink`,
  `IslandBoundary` and the hooks (`use-rail`, `use-lazy-clip`).
- Colours, fonts, easings, durations and radii come from the tokens in
  `app/globals.css` (`bg-paper`, `text-muted`, `border-rule`, `font-display`,
  `ease-out`, `duration-fast`, `rounded-card` …). Never
  hardcode a hex, except a per-brand colour that comes from content.
- Import each from its own file (`@/app/components/primitives/Button`); there
  is no barrel.

---

## `Button`

Every button on the site, in the Ask button's shape: 1px edge
(`--color-control-line`), 4px corner (`--radius-control`), Geist 17.5px
(the boards' 15px step, `--fs-15`) / 500.
Polymorphic: a `<button>` (default, `type="button"`), or `as="a"` /
`as={TransitionLink}` for a control that navigates. No client code.

- `size`: `regular` (48px, the Ask size), `compact` (36px), `icon` (a 36px
  square). Phones: 44px. A context can set `--btn-h` (the Ask send button,
  Subscribe beside its field).
- `tone`: `light` (default) or `dark` (the night footer). Same shape.
- `effect`: `sweep` (default): a solid fill rises from the bottom edge and the
  label inverts through `mix-blend-mode: difference`; a press snaps it full
  and drops the button 1px. `cells` is the Ask button's own fill and nothing
  else uses it.
- Disabled (`disabled` or `aria-disabled="true"`) dims; pending
  (`aria-busy="true"`) holds the fill.

```tsx
<Button onClick={copy}>Copy</Button>
<Button size="icon" aria-label="Pause"><Icon name="play-pause" size={16} on /></Button>
<Button as="a" href="/cv.pdf" download="">Download the CV</Button>
<Button tone="dark" type="submit" disabled={pending} aria-busy={pending}>Subscribe</Button>
```

Text links stay links (`ExternalLink`, plain `<a>`): do not wrap them in a
`Button`.

## `Container`

The text column: the boards' 540px times the type scale (632px), starting
30px left of centre (374px on the 1440 frame), with a 24px gutter on phones.

```tsx
<Container as="section" id="how-i-work">
  …
</Container>
```

## `ProductTile`

The rounded brand tile in front of product names. `size="text"` (default) is
1em of the surrounding text; `size="headline"` is 0.85em for the cycling
headline. Decorative (`aria-hidden`); the product name beside it is the text.

```tsx
<ProductTile mark={tenderlift} /> TenderLift
<ProductTile mark={zarez} size="headline" />
```

`mark` is a `ProductMark` (`{ slug, name, bg, fg, mark }`, where `mark` is
`{ kind: "svg", src }`, `{ kind: "letters", text }` or
`{ kind: "glyph", text }`). SVG marks render at 0.62em inside the tile.

## `MediaSlot`

A frame with a fixed aspect ratio for media that does not exist yet: a neutral
tile with a mono label saying what goes there. With `children` it is just the
frame and the media fills it. `label` always comes from content.

```tsx
<MediaSlot ratio="16 / 10" label="Clip: a tender being qualified, 12s" />
<MediaSlot ratio="16 / 10" label="TenderLift dashboard">
  <Image src={src} alt="" fill sizes="540px" />
</MediaSlot>
```

## `ExternalLink`

A link to another site: text, then the set's `arrow-up-right` (`Icon`),
whose head leads on hover and focus. `rel` always contains `noopener`
(pass `rel="me"` on his own profiles to add to it). Opens in a new tab by
default and says so to screen readers. `hideArrow` drops the arrow.

```tsx
<ExternalLink href="https://github.com/ruzicic" rel="me">
  GitHub
</ExternalLink>
```

## `Icon`

The site's own icon set (owner, 15 Nov 2026), drawn for this site: a
16-unit grid, one 1.5px stroke that never scales (`--ico-stroke` in
`app/styles/icon.css`), butt caps, mitred joins, nothing filled. `1em`
square by default, so it follows its label and sits on the text's cap
centre; `size` (px) for a free-standing control. Decorative: the control
carries the name. No client code: the motion is CSS only.

| name                          | where                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `arrow-right`                 | Case study, every in-site "go", story next, carousel next                          |
| `arrow-left`                  | header back, carousel previous                                                     |
| `arrow-up`, `arrow-down`      | Ask's send; the same arrow turned                                                  |
| `arrow-up-right`              | Website and every outgoing link: the arrow turned 45°                              |
| `arrow-down-up`               | Show all: down, turning up when `aria-expanded="true"`                             |
| `plus`, `minus`, `close`      | one cross: close is the plus turned 45°, minus the plus with its vertical bar flat |
| `plus-close`                  | the Ask button: turns 45° when the button is `data-on`                             |
| `plus-minus`                  | a disclosure: the bar turns flat in an open `<details>` (or `aria-expanded`)       |
| `play`, `pause`, `play-pause` | video and the pile and the headline; `on` = playing, the glyphs cross-fade         |
| `download`                    | Download my CV, the press files                                                    |
| `copy`, `check`, `copy-check` | copy buttons; `on` = copied, the check draws itself                                |
| `mail`, `calendar`, `list`    | the Ask cards' pictures                                                            |
| `sound`                       | the About postscript's "Sound on" sign                                             |

Motion, one rule, driven by the control around the icon (its hover where
the device hovers, and keyboard focus), 160ms on the standard easing,
nothing under reduced motion: an arrow's head moves two units forward and
the shaft follows (the tail stays); `close` turns 90°; `download` drops
toward its tray. A toggle's second state comes from `on`, or from the
control: `[data-on]`, `[aria-expanded="true"]`, an open `<details>`.
`/dev/icons` (development only) shows the whole set.

```tsx
<TransitionLink href="/work/tenderlift">Case study <Icon name="arrow-right" /></TransitionLink>
<Button size="icon" aria-label="Close"><Icon name="close" size={16} /></Button>
<Button size="compact" aria-expanded={open}>Show all <Icon name="arrow-down-up" /></Button>
```

## `VisuallyHidden`

Hidden visually, still announced by screen readers.

```tsx
<VisuallyHidden>(opens in a new tab)</VisuallyHidden>
```

## `SkipLink`

First focusable element in `<body>`; ink pill, visible only while focused.
Targets `#main`, which the root layout renders with `tabIndex={-1}`.

## `Popover`

Popover API (`popover="auto"`: top layer, light dismiss, Escape) tethered
with CSS anchor positioning. Anchor positioning is not Baseline yet, so
`@oddbird/css-anchor-positioning` loads only where `CSS.supports` says it is
missing. Placement uses `anchor()` insets (the polyfill cannot combine
`position-area` with fallbacks) and flips at viewport edges.

```tsx
<Popover
  side="below"
  label="About TenderLift"
  trigger={(p) => (
    <button type="button" {...p}>
      TenderLift
    </button>
  )}
>
  …
</Popover>
```

## `PageTransition` / `TransitionLink`

`PageTransition` wraps a page body in React's `ViewTransition` with one quiet
crossfade (`vt-fade`) in both directions. `PageFrame` already uses it, so
pages that render through `PageFrame` get it for free. `TransitionLink` is
`next/link` that tags navigations `nav-forward`.

## `IslandBoundary`

A small error boundary around one client island (a clip, a carousel): a chunk
that fails to load or a render error degrades that island to its
no-JavaScript look instead of taking the page down. Built on Next's
`catchError`.

## `rich-text`

`mapRich(text, render)`: renders content's rich text (words, links, product
lockups) and keeps punctuation that follows a lockup on the lockup's line.

## Hooks

- `useRail(total, { loop })` (`use-rail.ts`): a native horizontal scroller
  with snap, one item in focus (`data-on`), arrows, keys, click on an item
  out of focus to bring it in, a click on the item in focus following its
  `data-rail-primary` link (the strip's cards), mouse drag, one item per
  swipe on touch, instant under reduced motion. `loop` wraps around at both
  ends through invisible copies of the end items (the early projects).
  Shared by "Recent work" on `/` and the early projects on `/about`; its CSS
  is `app/styles/rail.css`. `railCounter` (`rail-counter.ts`)
  fills `{n}` and `{total}` in, on the server or the client.
- `useLazyClip` (`use-lazy-clip.ts`): the loading and playing rules every clip
  follows (nothing downloads until near the viewport, plays only while
  visible and allowed, nothing under reduced motion).
- `useDelayedOn` (`use-delayed-on.ts`): a flag that turns on only after it has
  held for a moment and drops at once.
- `lockScroll(options)` / `useScrollLock(on, options)` (`scroll-lock.ts`):
  the one way to hold the page still while a modal overlay or a full-screen
  effect is on (Ask, the press menu, a lockup's phone sheet, Paranoia).
  Counted, so overlays can overlap; inline styles on `<html>` only
  (`overflow: hidden`, `overscroll-behavior: none`, `scrollbar-gutter:
stable` where there is a classic scrollbar, or a key guard where the
  browser drops the gutter), plus non-passive touch and wheel guards that
  still let `allow()` (the sheet's scroller) scroll. `touch: "none"` also
  stops panning by touch. The scroll position is never touched. Hover
  popovers on desktop do not lock.

```ts
const unlock = lockScroll({ allow: () => scrollerRef.current })
// … on close, on unmount:
unlock()
```
