@AGENTS.md

# mladenruzicic.com

The personal site of Mladen Ružičić. One light theme, quiet and typographic,
content-driven. The repository is **public**: no key, token, account id or
private detail goes into it.

**`docs/` is private and untracked: never `git add` anything under it.** It
holds the build brief and the owner's open questions
(`docs/v4-build/PLAN.md`, `PLACEHOLDERS.md`, `AUDIT.md`, `REVIEW.md`,
`ASSETS.md`, `DIAGRAMS.md`, `CAPTURE.md`, `ABOUT-SOURCES.md`, and
`sources/`, the provenance of every outside picture and mark), the dossiers
the case studies were researched from, and the design boards
(`docs/v4-ideation/board/`). Source comments cite these paths on purpose; on
a fresh clone they dangle. Do not strip the citations and do not commit the
folder to satisfy them. The owner's decisions also live on the local-only
branch `ideation/2027-checkpoint` (`DECISIONS.md`): never push that branch.

## Stack

next 16.4.6 (Turbopack, Cache Components, React Compiler), react 19.3.1,
tailwindcss 4.3.5 (CSS-first, no `tailwind.config`), TypeScript 6.0.3 (the
ceiling of `typescript-eslint` 8, which peers on `<6.1.0`; no `baseUrl`),
ESLint 10 (pnpm prints a peer warning from the plugins inside
`eslint-config-next`; lint runs fine), Prettier 3, Playwright 1.65, zod 4,
gray-matter (front matter of `content/work/*.mdx`; the body stays markdown
text, nothing renders it as MDX), `geist` 1.9.2 (the source of the subset
fonts in `app/fonts/`; `app/fonts.ts` has the regeneration commands),
`mcp-handler` + `@modelcontextprotocol/server` 2.4.0 for `/mcp`, `vgpu` 0.6.0
exact (`@vgpu/wgsl` in devDependencies) for the homepage dent, `web-haptics`
0.0.6 exact, `@oddbird/css-anchor-positioning` (loaded only where anchor
positioning is missing), Fathom and `@vercel/speed-insights`. Node 22.x
(`engines`, `.nvmrc`, CI); pnpm 11.19.0 (`packageManager`).

## Commands

```bash
pnpm dev            # next dev (Turbopack); the shared dev server is on 3200
pnpm build
pnpm start
pnpm lint           # eslint .
pnpm typecheck      # tsc --noEmit
pnpm format:check   # pnpm format:write to fix
PLAYWRIGHT_BASE_URL=http://localhost:<port> pnpm test:e2e   # against a running server
pnpm --dir workers/ask run context        # regenerate content/ask/context.md
pnpm --dir workers/ask run context:check  # CI-style check that it is fresh
pnpm build && pnpm cv:pdf                 # regenerate public/cv.pdf from /cv
pnpm cv:pdf --check                       # CI: the committed PDF is fresh
```

The budget specs run only with `CI` or `PLAYWRIGHT_PROD=1` against a
production build; see `tests/README.md`. CI (`.github/workflows/`) runs lint,
typecheck and build on every pull request and push to `main`, and the
Playwright suite against `pnpm start -p 3104`.

## Routes

`/`, `/work` (every product and job in one list), `/work/<slug>` for nine case
studies (`tenderlift`, `studenti-rs`, `fontalternatives`, `zarez`,
`panciona`, `zf-scalar`, `shopify`, `hegias`, `wolkabout`; other old slugs
redirect, see `next.config.ts`), `/mentoring` (`/mentorship` redirects),
`/about` with the CV rows (`/uses` redirects), `/cv` (the CV page) and
`/cv.pdf` (the PDF printed from it), `/press`. For machines:
`/llms.txt`, `/llms-full.txt`, a markdown version of every page (`.md` or
`Accept: text/markdown`, rewritten by `proxy.ts` to `app/md/`), JSON-LD on
every page (`lib/seo/jsonld.ts`), the read-only `/mcp` endpoint. Markdown
wins when `text/markdown` has the highest q (ties included); `noindex` is
only on the `.md` and `/md/` URLs and the llms files, never on the
negotiated answer at the canonical URL. `/robots.txt` is a route
(`lib/seo/robots.ts`, `CONTENT_SIGNAL` in every group and on every markdown
response); `/.well-known/mcp/server-card.json` and `/.well-known/api-catalog`
describe `/mcp` from `lib/mcp/info.ts` (its `serverInfo` and tool names), and
`/`'s `Link` header points at both.
`/dev/icons` and `/dev/diagrams` are specimen pages that 404 in production.

## Folders

- `content/`: all copy and data. `products.ts` (every product and job; the
  list, tiles, links), `pages/*.ts`, `work/*.mdx` (case studies: front matter
  is the page, the body feeds the mirrors, `llms-full.txt`, `/mcp` and Ask),
  `diagrams/*.ts`, `media.ts` (generated sizes and blur placeholders),
  `ask.ts`, `site.ts`. Schemas in `lib/content/schema*.ts`; loaders in
  `lib/content/index.ts` (synchronous, server-only; client components import
  types from `@/lib/content/schema`). A zod failure fails the build with the
  file path.
- `app/components/{site,landing,work,story,diagram,mentoring,about,press,ask,seo,primitives}/`;
  area CSS in `app/styles/<area>.css`, imported by the area's entry
  component; tokens in `app/globals.css`. A page's CSS is inlined into its
  HTML (`experimental.inlineCss`, 2026-11-17, `next.config.ts`), so no
  stylesheet blocks the first paint; keep `style-src 'unsafe-inline'` in
  the CSP.
- `lib/seo/` (metadata, JSON-LD, markdown mirrors, OG), `lib/ask/` (the Ask
  context and the protocol shared with the Worker).
- `workers/ask/`: the Cloudflare Worker for typed Ask questions.
- `public/`: media only. Everything there is served, so no notes go in it:
  the provenance of outside material is in the private notes
  (`docs/v4-build/sources/<path under static>/SOURCES.md`,
  `docs/v4-build/ABOUT-SOURCES.md`), and what must be credited publicly is
  credited on the page itself (`credit` on a story square or a strip card's
  media).

## Conventions

- **Content is the source of truth.** Pages, JSON-LD, `llms.txt`, mirrors,
  the sitemap, OG images and the Ask context all read `lib/content`.
- **Press is derived** (2026-11-16): `content/pages/press.ts` reads its
  facts from `SITE`, the About CV, `products.ts` and the mentoring figures;
  the short bio, `DAY_JOB_TEAM` and `OWN_PRODUCT_ROLE` are typed and held to
  the CV and the `tenderlift`/`zf-scalar` case-study roles by `checkPress`
  (`lib/content/index.ts`, fails the build) and `tests/press.spec.ts`. When
  About, a role, a product line or a number changes, reread the Press bio,
  then regenerate the Ask context.
- **Server Components by default**; `'use client'` only for real
  interaction.
- **Tokens only** for colours, fonts, easings, durations and radii. The only
  inline hex is a per-brand colour from content.
- **Type scale** (2026-11-16, "all increased by 15-20%"): every text size is
  a design step times `--type-scale` (1.17, `app/globals.css`): `var(--fs-11)`
  is the boards' 11px, rendered at 13px; px line-heights beside them are
  `calc(<px> * var(--type-scale))`. The text column (632px) and the story
  panel (468px) are the boards' widths times the scale. Display type (the
  headline, page titles, story covers) has its own fitted sizes; diagrams
  keep their drawn sizes (fixed geometry in the square).
- **Compose the primitives** (`app/components/primitives/README.md`):
  `Button`, `Icon` (the site's one icon set; specimen at `/dev/icons`),
  `ExternalLink`, `TransitionLink`, `Popover`, `MediaSlot`, `ProductTile`,
  `IslandBoundary`, the rail hook. No new global CSS.
- **Branded links** (`app/styles/brand-link.css`, `.blk` / `.blk-w`): a
  product named in running text is its tile and an underlined name in the
  product's colour.
- React 19 / Next 16 idioms: `ViewTransition` from `'react'`, `preload`
  (not `priority`) on `next/image`. Read the guide in
  `node_modules/next/dist/docs/` before using a Next API (`AGENTS.md`).

## Copy rules

- No em dashes in site copy (testimonials stay verbatim). Nothing in square
  brackets is ever rendered: a `[` followed by a capital letter in story or
  diagram content fails the build; open questions go to
  `docs/v4-build/PLACEHOLDERS.md`.
- Copy the owner gives is used word for word.
- No employer in any headline or identity line. Never name "drivers and
  fleets" as an audience he wants to hear from. He lives in Ticino,
  Switzerland (Lausanne is the employer's address).
- **No family mentions anywhere**, with one exception the owner made on
  2026-11-12: the ONA row's line in the landing list
  (`content/pages/home.ts`, "My mom's ecommerce business. She crochets, I do
  the online part."). Do not carry family wording anywhere else.
- **No private metrics.** Mentoring figures and reviews come from his public
  MentorCruise profile; quotes are whole-sentence excerpts under first names,
  never edited.

## Rules the owner set

- **Two actions per project** (2026-11-13, card rule 2026-11-16): a project
  has at most "Case study" and "Website" (`getProjectLinks` in
  `lib/content/index.ts`), in one type style (mono capitals, the domain
  too). Names, pictures, clips and list rows are not links. A "Recent work"
  card is the one exception: a click on the card in focus follows its
  first action (below), but the two pills stay its only real links. `/`
  and `/work` share the list row (`Row`, `RowActions` in
  `app/components/work/Ledger.tsx`). On phones the row itself is the link
  (2026-11-16, `RowLink`, at the list's 720px breakpoint): one stretched
  link to the case study, else the website (new tab), named "TenderLift,
  case study", an arrow at the row's end, the two actions hidden; a row
  with neither stays plain. A story's website is on its cover (`live`, else
  the product's `url`).
- **"Recent work" strip** (`app/components/landing/Strip.tsx`): native
  horizontal scroll with snap through the shared rail
  (`app/components/primitives/use-rail.ts`, `app/styles/rail.css`): a click
  on a card out of focus only brings it into focus, a mouse drag moves it,
  touch swipes one card at a time. On the card in focus (2026-11-16) a
  click or tap off its pills, or Enter on the strip, goes to its case
  study, else its website (new tab), else nowhere, by clicking that pill
  (`data-rail-primary`), so the page transition and the new tab are the
  pill's own; a drag never navigates. No "LIVE", "DAY JOB" or "AUTOPILOT"
  pill (the schema refuses them); `pill` is optional. Only the card in focus plays its clip
  (`use-lazy-clip.ts`). To add a clip: files in `public/static/work/<slug>/`,
  the poster in `content/media.ts`, `clip` on the card in
  `content/pages/home.ts`.
- **Case studies** (`app/components/story/`): `panel` (at most three to four
  paragraphs and highlight numbers, or a `timeline` of roles) and a `column`
  of identical squares (`image`, `clip` or `diagram`; a picture that is not
  his carries `credit`). Media is shot square (`docs/v4-build/CAPTURE.md`).
  The first screen is a cover (2026-11-16, "A · Plate", `StoryCover`): the
  whole screen in `panel.plate` with the tile, the name in large Geist Serif
  (sized to its room on the server, `fit.ts`), the summary, the meta line,
  the live site, and the numbers at the foot above a thin rule; the first
  square comes up over the foot, then the panel and the other squares on
  the paper. No site header on a story: its one header is the bar
  (`StoryBar`, "N4"): "← All work" and Ask, sticky, on the plate over the
  cover and on the paper once the name has gone under it, when the label
  becomes the project's name, the arrow turns up and the link goes to the
  top of the page (2026-11-16, `StoryBack`; named "<name>, back to top";
  without JS it stays "← All work" to `/work`). The name comes with the
  product's tile at 20px (2026-11-16, "morph logo + name"; the cover's
  `ProductTile`, in the server HTML), morphing in with the scroll over the
  last 56px before that threshold (a CSS view timeline on `#cs-title`,
  `story.css`), stepped where that is missing or motion is reduced; a long
  name ends in an ellipsis on a phone. Its row is the site
  header's (`.site-top`): same column, height and type on every page, the
  first line centred on Ask, and every way back's arrow tip on the
  column's edge (2026-11-16); wider than 1100px the bar keeps that height
  and top but its ends sit on the story's wide frame (the cover's edges). Story clips load and play only once half in
  view (`IN_VIEW` in `use-lazy-clip.ts`).
- **Diagrams** are live markup, never images: `app/components/diagram/`,
  styles in `app/styles/diagram.css`, words in `content/diagrams/*.ts`. A
  flow is a swimlane flowchart, never a list of rows
  (`docs/v4-build/DIAGRAMS.md`).
- **About**: the early projects are a carousel inside the story
  (`early.after` in `content/pages/about.ts`) that loops at both ends by
  hand, never on its own (2026-11-16, `useRail(total, { loop: true })`:
  hidden, inert copies of the end slides), the CV rows name the role (the
  company at medium weight, the role in mono capitals, the description
  muted), and
  the postscript (League of Legends) has two switches: `postscript.enabled`
  (the block) and `postscript.effect` (the "Paranoia" button and its sound).
- **Pressed paper on `/`** (2026-11-14): a press dents the paper, a drag
  carves a groove that heals in about 14 s. Code in
  `app/components/landing/dent/` (`DentGate.tsx` in the page, the rest behind
  a dynamic import), WGSL beside it (Turbopack rule in `next.config.ts`),
  layer CSS in `app/styles/dent.css`. Only with a hovering mouse, wider than
  1024px, no reduced motion and a WebGPU adapter, fetched after `load` and a
  first mouse move. Switch: `HOME.dent`; look: `dent/settings.ts`. vgpu's
  Node install scripts are off in `pnpm-workspace.yaml`; the `pnpm audit
--prod` findings left are in vgpu's own CLI dependency, not in any bundle.
- **CV** (2026-11-17, "/cv postaje stranica na sajtu, sa opcijom 'download
  PDF'"): `content/pages/cv.ts` is the source, his CV document word for
  word; the contact line is the site's (`SITE`), and there is **no phone
  number, ever**. `/cv` renders it (`app/components/cv/CvPage.tsx`,
  `app/styles/cv.css`: Geist Serif name and section headings, one ink, one
  grey, 600 on title lines; every dated line one row, the date at the right
  in muted mono). Wider than 820px the page is the A4 sheet enlarged: every
  size is a print size times `--cv-scale` (16px / 11pt on screen, 1 in print), so
  the page breaks its lines where the PDF does (`tests/cv.spec.ts`), and
  `PageFrame measure="sheet"` puts the header and footer on the sheet's
  edges; narrower, a fluid page at the site's text size. `/cv.pdf` is the same page printed
  by Chromium through the `@media print` rules, generated by
  `scripts/cv-pdf.ts` and committed. Print uses static Geist faces
  (`app/fonts/geist-sans-{regular,semibold}-latin.woff2`): the variable
  font embeds as Type 3 and loses word spaces. `checkCv`
  (`lib/content/index.ts`) holds companies, role titles and years to the
  About CV rows, projects to `products.ts`, TenderLift's role to the press
  kit, the MentorCruise figures to `/mentoring`. After a change: build,
  run `pnpm cv:pdf` (its text check needs poppler), regenerate the Ask
  context. The footer's "CV" opens the page; About's button downloads the
  PDF. Both downloads save as `Mladen-Ruzicic-CV.pdf`
  (`SITE.links.cvFilename`). `/cv` is only the CV (2026-11-17, "download
  replaces 'ask' · my header becomes just 'x'"): `PageFrame` `start`/`end`
  put Close CV (back to the previous page of the site, else `/about`) and
  Download PDF in the top row, `footer={false}` drops the site footer, and
  there is no Ask; specs about that chrome skip it (`BARE_PAGES` in
  `tests/helpers.ts`). A job with several roles (ZF) draws them as a tree:
  indented, a spine, a node per role, CSS only and nothing positioned that
  holds text (Chromium paints positioned boxes last, which reorders the
  PDF's text). Body 11pt, dates 9.5pt, 20mm side margins; bullets are drawn
  discs inside the item's indent (the marker glyph was clipped by the page
  edge).
- **Haptics** (`lib/haptics.ts`): three call sites only (Ask opens, a
  testimonial card is sent to the back by the visitor, the newsletter
  confirms). Add none without the owner asking.
- **Analytics** (2026-11-17, "dodaj svih 6 eventova"): Fathom page
  views, the newsletter's goal, and six named events through `track()` in
  `lib/analytics.ts` (`trackEvent`; a no-op unless a production build has
  `NEXT_PUBLIC_FATHOM_SITE_ID`; never throws): `ask: open`,
  `ask: prepared question`, `ask: typed question`; `website: <slug>` (a
  list row's Website, a phone's row when it goes to the website, a strip
  card's pill, a story's cover); `cv: download`;
  `mentoring: mentorcruise`, `mentoring: call` (the booking link, wherever
  it is); `contact: email` (any email link); `recent work: <slug>` (a strip
  card opened through the card in focus, `data-track-open` read by
  `useRail`). Links are counted by one listener in `FathomAnalytics.tsx`:
  `data-track`, else `linkEvent(href)`; an email link carries `data-track`
  because Cloudflare's Email Obfuscation rewrites `mailto:`
  (off for the zone since 2026-11-27: its link 404s for crawlers; keep it
  off). Names are typed (`TrackEvent`);
  only fixed names and product slugs, never a question's text, an address
  or a URL. Add none without the owner asking.
- **Hidden products**: `hidden: true` in `content/products.ts` removes an
  entry from every page, mirror, `/mcp`, JSON-LD and the Ask context
  (Bistoletti, until the owner says otherwise). `bare: true` draws a tile
  with no ground or edge (studenti.rs).
- **Newsletter** ("very modest"): one line and an email field in the landing
  footer (`app/components/site/NewsletterForm.tsx`), posting to the Server
  Action `subscribe.ts` (Kit v3; key in `CONVERTKIT_API_KEY`, host env only;
  the logic in `lib/newsletter/`). It reports success only when Kit confirms;
  reserved domains are never sent. Bots (2026-11-16, "add the same invisible
  check Ask uses"): a honeypot (`website`; filled, it answers like a success
  and sends nothing) and Ask's Turnstile widget with the action `newsletter`,
  loaded on the field's first focus or keystroke and verified in the action
  against Siteverify. Turnstile is on only when both
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (the same
  widget's secret, host env only) are set; otherwise the form works as it
  did without it (`lib/newsletter/turnstile.ts`).
- **Ask** answers the prepared questions in `content/ask.ts` at once. Typed
  questions go to the Worker at `ask.mladenruzicic.com` (`workers/ask/`,
  Workers AI, Turnstile, per-visitor and daily limits; its `README.md` and
  `SECURITY.md`) only when `NEXT_PUBLIC_ASK_ENDPOINT` and
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set; otherwise, and on any failure,
  the prepared answers. The model's context is `content/ask/context.md`,
  generated from content by `lib/ask/context.ts`, plus `content/ask/notes.md`.
  After a content change: regenerate it, and the owner redeploys the Worker
  with `pnpm --dir workers/ask run deploy`. **Questions are saved** (owner's
  decision, 2026-11-16; the panel says "QUESTIONS SAVED ANONYMOUSLY"): typed
  questions that passed the visitor check go to a D1 log (`ASK_QUESTIONS`,
  `workers/ask/src/questions-log.ts`, `migrations/`) with time, outcome,
  sources, duration, tokens, model and country; never an address, a hash,
  a session id, a user agent or the answer. A daily Cron Trigger deletes
  rows after `ASK_LOG_RETENTION_DAYS` (90; `"0"` turns the log off). The
  database id lives only in the git-ignored `deploy.local.json`; a deploy
  with the log on and no id stops. He reads it with
  `pnpm --dir workers/ask run questions` (README "Question log"). Keep
  `observability` off, and never write anywhere served that questions are
  not kept.

## Gotchas

- `dynamicParams` is rejected alongside `cacheComponents`. `/work/[slug]`
  uses `export const instant = false`: every slug is prerendered, but Next
  still builds a fallback shell whose `opengraph-image` metadata awaits
  `params`.
- `next/font/local` variables are private and mapped to the public token
  names in `@theme inline`; using one name on both sides would be
  self-referential.
- Font fallbacks are our own (2026-11-16): next/font's `adjustFontFallback`
  is off for Geist and Geist Serif, and measured `@font-face` faces
  (`local()` Arial, Roboto, Times New Roman, Noto Serif) in
  `app/globals.css` follow the web font in `--font-sans` and
  `--font-display`, so text wraps the same before and after the swap;
  re-measure their `size-adjust` after a font or large copy change
  (`app/fonts.ts`, "METRIC FALLBACKS").
- `next-env.d.ts` flips between `.next/dev/types/*` and `.next/types/*`; the
  committed version is what `next build` produces.
- ESLint ignores `.claude/**` and `content/**/*.mdx`.
- The `AGENTS.md` block is rewritten by `next dev`; committing it keeps the
  tree clean.
