# Implementation plan

## Strategy

Use a planning branch and then implement in separate PRs. Do not combine design docs, content migration, visual redesign and media tooling into one production PR.

## Current technical stance

Keep Next.js.

Reasons:

- repo already uses Next.js App Router
- MDX is already configured
- Tailwind and component infrastructure exist
- metadata and static routes are already natural in Next
- the problem is not framework capability

## Branch strategy

Planning branch:

```txt
docs/website-v3-planning
```

Implementation branches:

```txt
feat/website-v3-content-foundation
feat/website-v3-design-system-homepage
feat/website-v3-work-case-studies
feat/website-v3-llm-media-qa
```

## PR 1: Content foundation

### Goal

Move from hard-coded content to typed content without needing final visual polish.

### Scope

- create `content/work`
- create `content/notes`
- add work schema
- add note schema
- add content loading functions
- add route skeletons
- preserve old routes
- add case-study shell
- add markdown route strategy

### Files

```txt
content/work/*.mdx
content/notes/*.mdx
lib/content/schema.ts
lib/content/get-work.ts
lib/content/get-notes.ts
lib/content/markdown.ts
app/work/page.tsx
app/work/[slug]/page.tsx
app/notes/page.tsx
app/notes/[slug]/page.tsx
app/mentoring/page.tsx
app/now/page.tsx
```

### Acceptance criteria

- build passes
- lint passes
- `/work` renders from content model
- `/work/[slug]` renders at least TenderLift and Shopify
- `/notes` exists
- `/mentoring` exists
- no production styling regression beyond expected skeletons

## PR 2: Design system and homepage

### Goal

Implement the Claude Design selected direction and replace the current homepage positioning.

### Scope

- add design tokens
- update typography
- implement layout primitives
- update header/footer
- build homepage sections
- remove family hero
- remove mentorship-first funnel
- update metadata positioning

### Files

```txt
styles/tokens.css
styles/prose.css
styles/motion.css
app/globals.css
app/layout.tsx
app/page.tsx
app/components/primitives/*
app/components/layout/*
app/components/typography/*
app/components/navigation/*
```

### Acceptance criteria

- no family mention remains
- hero uses new positioning
- mentoring is compact
- homepage works without JS
- mobile layout is strong
- focus states visible
- metadata no longer says `software developer, mentor, and entrepreneur`

## PR 3: Work system and case studies

### Goal

Make work the main evidence layer.

### Scope

- work index with sections
- company chapter cards
- independent product cards
- status taxonomy
- case-study template
- media gallery shell
- related work
- confidentiality notices

### Required case studies

- ZF SCALAR
- Shopify Shop Minis
- HEGIAS
- WolkAbout
- TenderLift
- studenti.rs
- FontAlternatives
- Avataurus
- Boxium

### Acceptance criteria

- company work and side products are visually distinct
- stopped projects are framed as learning
- case-study pages have SEO metadata
- no private metrics are published
- work cards are readable without hover

## PR 4: LLM, media and QA

### Goal

Finish machine-readable output, preview behaviour and launch checks.

### Scope

- `llms.txt`
- `llms-full.txt`
- markdown mirrors
- JSON-LD
- generated OG images
- media preview component
- touch fallback
- reduced-motion support
- screenshot optimization
- QA pass

### Files

```txt
app/llms.txt/route.ts
app/llms-full.txt/route.ts
app/(markdown)/*
lib/metadata/json-ld.ts
app/work/[slug]/opengraph-image.tsx
app/notes/[slug]/opengraph-image.tsx
app/components/media/*
scripts/generate-project-previews.ts
```

### Acceptance criteria

- `/llms.txt` exists
- `/llms-full.txt` exists
- important pages have markdown mirrors
- JSON-LD validates
- previews respect reduced motion
- videos do not load eagerly above fold
- Lighthouse and accessibility pass are acceptable

## Dependency plan

Likely keep:

- Next.js
- MDX
- Tailwind
- CVA
- clsx
- tailwind-merge
- Fathom

Consider reducing:

- Framer Motion for simple hover effects

Add only if useful:

- content validation helper such as Zod
- image/video build tooling only if preview generation needs it

## Claude Design loop

1. Feed Claude Design `CLAUDE_DESIGN_BRIEF.md`.
2. Ask for 3 distinct visual directions.
3. Select one direction.
4. Ask it to produce page and component specs.
5. Use `/design-sync` or equivalent handoff into Claude Code.
6. Implement PR 2 and PR 3 from the selected system.
7. Review mobile first, then desktop.

## Where Claude Code should be used

Use Claude Code for:

- route creation
- content loader
- MDX migration
- component extraction
- design tokens
- page implementation
- metadata and JSON-LD
- markdown route generation
- media preview component
- QA fixes

## Where not to over-engineer

Avoid:

- CMS migration
- database
- auth
- admin dashboard
- complex search
- too many themes
- animation framework expansion
- design system package extraction
- client-side routing for static content

## Local validation commands

```txt
npm run format:check
npm run lint
npm run build
```

Add later if useful:

```txt
npm run test:a11y
npm run test:e2e
```

## Launch sequence

1. content accuracy pass
2. confidentiality pass
3. mobile design pass
4. keyboard pass
5. no-JS pass
6. metadata pass
7. OG image pass
8. markdown/LLM pass
9. analytics pass
10. deploy preview review
11. production deploy
