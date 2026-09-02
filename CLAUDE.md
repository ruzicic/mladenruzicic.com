@AGENTS.md

# mladenruzicic.com — v3

Personal site of Mladen Ružičić. Dark, single-theme, Gloock + Instrument +
JetBrains Mono, three.js glass-shard hero, content-driven. The full plan lives in
`docs/v3-redesign-plan.md` and the content contract in
`docs/v3-content-contract.md`. **`docs/` is intentionally untracked — never
`git add` anything under it.**

## Stack

| Package | Version | Note |
|---|---|---|
| next | 16.3.4 | Turbopack, Cache Components, Partial Prefetching, React Compiler |
| react / react-dom | 19.2.8 | `ViewTransition` and `Activity` come from Next's bundled React |
| typescript | ^5.9.3 | **not 7.0.2** — `typescript-eslint@8` peers on `typescript <6.1.0` |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | CSS-first config, no `tailwind.config.ts` |
| @tailwindcss/typography | ^0.5.19 | loaded with `@plugin` in `app/globals.css` |
| eslint-config-next | 16.3.4 | flat config, core-web-vitals + typescript |
| babel-plugin-react-compiler | 1.0.0 | enabled via `reactCompiler: true` |
| three / @react-three/fiber | 0.185.1 / 9.7.0 | hero only, lazy, after LCP. 233 KB gz: r3f's `extend(THREE)` keeps the whole namespace, so three does not tree-shake |
| @paper-design/shaders-react | 0.0.80 (exact pin) | breaking changes ship under 0.0.x |
| @oddbird/css-anchor-positioning | 0.10.2 | dynamically imported only when `!CSS.supports('anchor-name: --a')` |
| zod | ^4.5.4 | content schemas |
| gray-matter + next-mdx-remote | ^4.0.3 / ^5.0.0 | MDX in `content/` |
| @vercel/speed-insights | 2.0.0 | `sampleRate={0.3}` |
| fathom-client | ^3.5.0 | App Router pattern, inside a Suspense boundary |

Removed for v3: framer-motion, date-fns, next-sitemap, contentlayer leftovers,
@mdx-js/react, @next/mdx, eslint-plugin-react, eslint-plugin-tailwindcss,
eslint-config-prettier, @eslint/eslintrc, pretty-quick, autoprefixer, IBM Plex,
@react-three/drei (the hero uses r3f and three directly) and @types/mdx (there
is no `mdx-components.tsx`; MDX goes through gray-matter + next-mdx-remote/rsc,
and nothing imports an `.mdx` file as a module). Removing both left every
`.next/static` chunk byte-identical.

Package manager: **pnpm 11.12.0** (`packageManager` field; CI reads it via
`pnpm/action-setup@v4`). Node 22.

## Commands

```bash
pnpm dev            # next dev (Turbopack)
pnpm build          # next build
pnpm start          # next start (build first)
pnpm lint           # eslint .
pnpm typecheck      # tsc --noEmit
pnpm format:write   # prettier
pnpm format:check
```

CI runs on every pull request and on push to `main`:
`.github/workflows/code-check.yml` does lint + typecheck + build, and
`.github/workflows/e2e.yml` does its own `pnpm build` (cached on `.next/cache`)
and then the Playwright suite against `pnpm start -p 3104`.

## Folder map and ownership

Parallel agents must stay inside their own paths.

| Area | Owns |
|---|---|
| **hero** | `app/components/hero/**`, `app/components/shaders/**` |
| **shell** | `app/components/{site,timeline,work,mentoring,preloader,sound}/**`, `app/layout.tsx`, `app/page.tsx` |
| **work-system** | `app/work/**`, `app/mentoring/**`, `app/about/**`, `app/uses/**`, `lib/seo/**`, `app/md/**`, `app/llms*` |
| **copy** | everything under `content/` |
| **foundation (done)** | `app/components/primitives/**`, `app/globals.css`, `app/fonts.ts`, `lib/content/**`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `types/**` |

Shared, low-churn: `lib/utils.ts` (`cn`), `app/components/icons.tsx`,
`app/components/FathomAnalytics.tsx`, `proxy.ts`, `app/sitemap.ts`,
`app/robots.ts`, `app/not-found.tsx`, `app/opengraph-image.tsx`.

```
app/
  components/primitives/   Eyebrow Display Button Chip Container Section
                           VisuallyHidden SkipLink Dialog Popover
                           PageTransition TransitionLink NavPending  (+ README.md)
  fonts/                   four subset .woff2 faces (next/font/local)
  fonts.ts                 the four localFont() calls + `fontVariables`
  globals.css              @theme inline tokens, base, vt-* classes, .grain
  md/[...path]/route.ts    markdown mirrors
  llms.txt/, llms-full.txt/
assets/fonts/              Gloock-Regular.ttf — for next/og (Satori needs TTF)
content/                   site, companies, people, testimonials, work/*.mdx, pages/*
lib/content/               schema.ts (zod) · index.ts (loaders) · markdown.ts
lib/seo/                   metadata.ts · jsonld.ts · og.tsx
types/                     react-view-transition.d.ts (temporary augmentation)
proxy.ts                   Accept: text/markdown → /md/* rewrite (Node runtime)
```

## Conventions

- **Server Components by default.** `'use client'` only for: the hero canvas,
  the timeline rail, the mobile pill, sound, dialogs/popovers, shader mounts and
  the nav-pending indicator. All copy and data render on the server.
- **Tokens only.** Colours, fonts, easings, durations, radii and the container
  width come from `@theme inline` in `app/globals.css`
  (`bg-surface`, `text-muted`, `font-display`, `ease-pill`, `rounded-pill`,
  `max-w-page`). The only acceptable inline hex is a per-brand `color` coming
  from `content/`.
- **Compose the primitives.** Do not re-implement buttons, chips, section
  headers, dialogs or popovers. See `app/components/primitives/README.md`.
- **No new global CSS.** `app/globals.css` is foundation-owned. Area-specific CSS
  goes in `app/styles/<area>.css`, imported from the area's entry component.
- **Content is the source of truth.** Pages, JSON-LD, `llms.txt`, markdown
  mirrors, the sitemap and OG images all read `lib/content`. A zod failure throws
  with the file path and fails `next build`.
- **No family mentions anywhere**, and no private metrics. Unverified numbers
  carry `confidence: 'needs-verification'`; `limited`/`high` confidentiality
  entries show public claims only.
- React 19.2 / Next 16.3 idioms only: `Activity` and `ViewTransition` from
  `'react'`, `useLinkStatus`, `preload` (not `priority`) on `next/image`, no
  `experimental.viewTransition` flag.

## Decisions (plan §10)

1. Motion mode at launch is **calm**. Playful is a later toggle.
2. **Custom cursor dropped** — it cannot render above the browser top layer where
   native `<dialog>` and popovers live, and adds nothing on touch.
3. **Newsletter dropped for v3.** `app/api/subscribe/route.ts` stays in the repo,
   dormant; `NewsletterBanner` is deleted.
4. Analytics: **keep Fathom, add `@vercel/speed-insights`** at `sampleRate 0.3`.
5. Hero logo set: **six employers** — ZF SCALAR, Shopify, HEGIAS, WolkAbout,
   Execom, Nemestic (`HERO_LOGOS` in `content/companies.ts`).
6. Header keeps `mix-blend-mode: difference`; verify it over yellow surfaces.
7. Preloader: 0→100 Gloock counter plus rotating Claude-Code-style status verbs
   (`HOME.preloader`), final verb always "Shipping".
8. Shopify uses the **Shopify bag** mark; the band colour is Shopify green
   (`#96BF48` placeholder — sample the exact value from the official asset), not
   `#5A31F4`.
9. `/mentoring` is canonical; `/mentorship` 308-redirects to it.
10. One `/work/<slug>` namespace for companies, products and experiments.

## Gotchas

- `ViewTransition` is exported by the React that Next bundles, but
  `@types/react@19.2` declares it only in `canary.d.ts`, which nothing here
  opts into. `types/react-view-transition.d.ts` augments it. Delete that file
  once `ViewTransition` moves out of `@types/react/canary.d.ts` into
  `index.d.ts` — not merely "once the types ship upstream".
- Source comments cite `docs/v3-redesign-plan.md` and `docs/v3-content-contract.md`
  on purpose: they are the real reference for the decisions the code encodes.
  `docs/` is untracked, so on a fresh clone every one of those pointers dangles.
  That is the accepted trade for keeping the dossier private — do not strip the
  citations, and do not commit the directory to satisfy them.
- `next/font/local` variables are private (`--font-gloock`, …) and are mapped to
  the public token names (`--font-display`, …) in `@theme inline`. Using the same
  name on both sides would be self-referential — do not "simplify" it.
- Content loaders are **synchronous** (`readFileSync` + memoised at module init)
  so they never interact with Cache Components. Keep them that way.
- `lib/content/index.ts` reads the filesystem: server-only. Client components
  import types and schemas from `@/lib/content/schema`.
- ESLint ignores `.claude/**` (agent worktrees) and `content/**/*.mdx`.
- `dynamicParams` is rejected alongside `cacheComponents`. `/work/[slug]` uses
  `export const instant = false` instead: every slug is prerendered, but Next
  still builds a fallback shell whose generated `opengraph-image` metadata
  module awaits `params`, which trips instant-navigation validation in dev.
- `next-env.d.ts` flips between `.next/dev/types/*` and `.next/types/*`. The
  committed version is what `next build` produces; ignore the dev-time diff.

## TODO — assets and facts the owner must supply

- [ ] **Monochrome brand marks** as SVG in `public/static/logos/`: `zf-scalar`,
      `shopify` (**the Shopify bag**), `execom`, `nemestic`. The existing HEGIAS
      and WolkAbout files are 128px white tiles with embedded metadata — replace
      them with clean marks before the hero etches them.
- [ ] **Sample the exact Shopify green** from the official bag asset and update
      `content/companies.ts` (currently `#96BF48`).
- [ ] **Verified employer dates** for Shopify, HEGIAS, WolkAbout/Execom,
      Freelance and Nemestic. Five of six are `approx: true` and ship with a
      "dates approximate" badge until confirmed.
- [ ] **"Worked alongside" entries**: real LinkedIn URLs and one or two sentences
      each. `content/people.ts` omits `linkedin` and `note` rather than shipping
      placeholders; the section ships without people until the copy exists.
- [ ] **Project screenshots** (1440×1000, 834×1112, 390×844) for TenderLift,
      studenti.rs, FontAlternatives, Amada and EVO Touch, plus `blurDataURL`s.
      Until then the accent-tinted shader header stands in.
- [ ] **Metric permissions**: Shop.app MAU, Velocity adoption, studenti.rs user
      and document counts (currently `needs-verification`).
- [ ] **Case-study copy** for ZF SCALAR, Shopify, TenderLift and studenti.rs.
- [ ] Confirm "eighteen years of shipping" (2008 → 2026) in `content/site.ts`.
