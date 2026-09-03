# Primitives

The shared, unopinionated building blocks for v3. Everything visual in
`app/components/{site,hero,work,timeline,mentoring,…}` composes these.

**Rules**

- Server Components by default. Only `Dialog`, `Popover`, `TransitionLink` and
  `NavPending` are `'use client'`.
- Colours, fonts, easings, durations and radii come from the tokens in
  `app/globals.css` (`bg-surface`, `text-muted`, `font-display`, `ease-pill`,
  `rounded-pill`, …). Never hardcode a hex except a per-brand `color` prop.
- Import from `@/app/components/primitives` (barrel) in Server Components, or
  from the individual file when you want to keep a client boundary small.

---

## `Eyebrow`

12px mono, uppercase, `.08em`, muted. Pass `items` for accent-dot separators.

```tsx
<Eyebrow items={["Technical product owner", "Founder", "Builder", "Lausanne, CH"]} />
<Eyebrow as="h2" className="text-fg">Selected work</Eyebrow>
```

## `Display`

Gloock display heading. `{braced}` words render as `<em>` in Instrument Serif
Italic, accent colour. `parseDisplay` / `displayToPlainText` are exported for
metadata and markdown mirrors.

```tsx
<Display as="h1" size="hero">
  {"I build products, platforms and the {systems} around them."}
</Display>
```

## `Button`

`cva` variants `primary | outline | ghost`, sizes `sm | md | lg | icon`.
Renders `next/link` when `href` is set, otherwise a real `<button>`. External
hrefs get `target="_blank" rel="noreferrer noopener"` automatically. It never
throws.

```tsx
<Button href="/work" variant="outline" size="lg">All work</Button>
<Button onClick={dialog.show} variant="ghost">Open preview</Button>
```

## `Chip`

Small mono label. `tech` (hairline), `accent` (filled), `brand` (outlined in
`color`, optional 1–2 letter `mark`).

```tsx
<Chip>Next.js</Chip>
<Chip variant="brand" color="#0057B8" mark="ZF">ZF SCALAR</Chip>
```

## `Container`

Centred 1400px column with the `--gutter` inline padding (40px, 24px < 720px).

```tsx
<Container as="header">…</Container>
<Container bleed>…</Container>   {/* no gutters, for full-bleed rails */}
```

## `Section` + `SectionHeader`

`Section` handles vertical rhythm, the optional hairline and the container.
`SectionHeader` is the design's eyebrow-left / meta-right row with a hairline on
top.

```tsx
<Section id="work" label="Selected work" divider>
  <SectionHeader title="Selected work" meta="5 of many · most recent first" />…
</Section>
```

## `VisuallyHidden`

```tsx
<VisuallyHidden as="h2">Work history</VisuallyHidden>
```

## `SkipLink`

First focusable element in `<body>`; visible only on focus. Targets `#main`.

```tsx
<SkipLink />          {/* or <SkipLink targetId="content" /> */}
```

## `Dialog` + `useDialog`

Native `<dialog>`: `showModal`, cancellable `requestClose` when available,
`closedby="any"` plus a Safari backdrop-click fallback, blurred `::backdrop`,
`@starting-style` enter/exit, focus returns to the invoker, scroll lock via
`html:has(dialog[open])`, `overscroll-behavior: contain`.

```tsx
"use client"
const lightbox = useDialog()

<Button onClick={lightbox.show}>Open</Button>
<Dialog {...lightbox.props} title="Screenshot">
  <img src="/static/work/tenderlift-1.webp" alt="" />
</Dialog>
```

## `Popover`

Popover API (`popover="auto"`, top layer, light dismiss, Escape) positioned with
CSS anchor positioning. `@oddbird/css-anchor-positioning` is dynamically
imported only when `CSS.supports('anchor-name: --a')` is false.

```tsx
"use client"
<Popover
  label="Radovan Skendžić"
  positionArea="block-end span-inline-end"
  trigger={({ popoverTarget, id, style }) => (
    <button popoverTarget={popoverTarget} id={id} style={style}>Radovan</button>
  )}
>
  <p>Worked together at Execom and WolkAbout.</p>
</Popover>
```

## `PageTransition` / `SharedElement` / `TransitionLink` / `useBackNavigationType`

Wrap the body of **each `page.tsx`** (never `layout.tsx`).

```tsx
export default function Page() {
  return (
    <PageTransition>
      <main id="main">…</main>
    </PageTransition>
  )
}
```

Shared-element morph, same `name` on both sides:

```tsx
<SharedElement name={workArtTransitionName(work.slug)}>
  <div className="aspect-[16/10] …" />
</SharedElement>
```

Links that should animate forward:

```tsx
<TransitionLink href="/work/tenderlift">TenderLift</TransitionLink>
```

`useBackNavigationType()` returns a getter (`'nav-forward' | 'nav-back'`) from
the read-only Navigation API, for in-page transitions that need to know the
direction.

## `NavPending`

Must be a **child of a `<Link>`** — `useLinkStatus` reads the nearest link.
Renders a 1px accent hairline with a 100ms `animation-delay`, so prefetched
navigations never flash.

```tsx
<Link href="/work">
  Work
  <NavPending />
</Link>
```
