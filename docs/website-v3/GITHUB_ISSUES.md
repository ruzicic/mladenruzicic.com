# GitHub issues

Use these as ready-to-create implementation issues.

## Issue 1: Build typed content foundation

Labels:

```txt
website-v3, content, architecture
```

Goal:

Move work, notes and mentoring content out of hard-coded pages and into typed content files.

Scope:

- create content directories
- define TypeScript content models
- add content loading helpers
- migrate current work list into initial content entries
- add confidence and confidentiality fields

Acceptance criteria:

- `getAllWorkEntries()` works
- `getWorkEntryBySlug()` works
- work entries include status, kind, links, metrics and confidentiality
- build passes
- old routes still compile

## Issue 2: Add work case-study routes

Labels:

```txt
website-v3, work, routing
```

Goal:

Add `/work/[slug]` pages powered by the content model.

Scope:

- dynamic route
- metadata generation
- case-study layout shell
- related work
- not-found handling

Acceptance criteria:

- TenderLift case study renders
- Shopify case study renders
- missing slug returns not found
- metadata is generated per page

## Issue 3: Replace homepage positioning

Labels:

```txt
website-v3, homepage, copy
```

Goal:

Replace current generic homepage and remove family/mentorship-first framing.

Scope:

- new hero
- current focus section
- company chapters
- independent products
- AI-native practice
- notes preview
- compact mentoring section
- final CTA

Acceptance criteria:

- no family imagery
- no family copy
- no mentorship pricing on homepage
- hero communicates new positioning
- mobile layout works

## Issue 4: Implement design tokens and typography

Labels:

```txt
website-v3, design-system
```

Goal:

Add new design tokens and typography system.

Scope:

- colors
- type scale
- spacing
- radius
- motion tokens
- focus states
- prose styles
- dark mode support

Acceptance criteria:

- tokens live in predictable CSS files
- components use tokens instead of one-off values where practical
- focus states are visible
- text contrast is acceptable

## Issue 5: Build core component system

Labels:

```txt
website-v3, components
```

Goal:

Create reusable primitives and page building blocks.

Scope:

- Button
- Link
- Chip
- Card
- Section
- SectionHeader
- WorkCard
- CaseStudyHeader
- Metric
- Timeline
- NoteCard
- TestimonialCard

Acceptance criteria:

- components are typed
- components are accessible
- server components are default
- client components are used only where needed

## Issue 6: Build work index

Labels:

```txt
website-v3, work
```

Goal:

Replace the hard-coded year-grouped work page with a structured work index.

Scope:

- page intro
- active flagship section
- company chapters
- independent products
- paused/stopped/historical work
- optional filters

Acceptance criteria:

- ZF, Shopify, TenderLift and studenti.rs are prominent
- stopped work is framed professionally
- old Trello project is minimized
- work cards do not require hover

## Issue 7: Write initial company case studies

Labels:

```txt
website-v3, content, case-study
```

Goal:

Create public-safe company case studies.

Scope:

- ZF SCALAR
- Shopify Shop Minis
- HEGIAS
- WolkAbout

Acceptance criteria:

- confidential details excluded
- public-safe metrics only
- each page includes role, constraints, contribution, outcomes and learnings
- open questions are marked

## Issue 8: Write initial product case studies

Labels:

```txt
website-v3, content, case-study
```

Goal:

Create independent product case studies.

Scope:

- TenderLift
- studenti.rs
- FontAlternatives
- FontSwap
- Avataurus
- Boxium
- MontePop
- stopped product learning entries

Acceptance criteria:

- metrics have confidence labels
- TenderLift private metrics not published
- studenti.rs revenue not published
- stopped projects framed as lessons

## Issue 9: Add media and preview system

Labels:

```txt
website-v3, media, motion
```

Goal:

Support screenshots and hover/focus/touch previews.

Scope:

- media schema
- poster images
- responsive images
- HoverPreview component
- touch preview dialog
- reduced motion fallback
- asset naming convention

Acceptance criteria:

- no autoplay on initial page load
- no hover-only content
- reduced motion shows stills
- alt text exists for screenshots

## Issue 10: Add notes section

Labels:

```txt
website-v3, notes, content
```

Goal:

Add writing/notes pages focused on product engineering and AI-native workflows.

Scope:

- notes index
- note detail route
- topic tags
- metadata
- prose styling
- RSS optional

Acceptance criteria:

- notes render from content model
- at least 3 starter notes exist as drafts or published placeholders
- prose is readable on mobile

## Issue 11: Add mentoring page

Labels:

```txt
website-v3, mentoring
```

Goal:

Move mentoring into a dedicated page while keeping homepage compact.

Scope:

- who it is for
- topics
- how it works
- testimonials
- availability note
- CTA

Acceptance criteria:

- homepage does not look like a mentorship funnel
- page explains limited availability
- testimonials are permission-safe

## Issue 12: Add LLM-readable and structured outputs

Labels:

```txt
website-v3, seo, llm
```

Goal:

Generate machine-readable routes from the same content source.

Scope:

- `/llms.txt`
- `/llms-full.txt`
- markdown mirrors
- JSON-LD
- sitemap updates
- OG images

Acceptance criteria:

- LLM routes exist
- markdown mirrors have canonical URLs
- JSON-LD validates
- private claims are excluded

## Issue 13: Website v3 QA and launch pass

Labels:

```txt
website-v3, qa
```

Goal:

Validate accessibility, mobile, performance, metadata and content accuracy before launch.

Scope:

- keyboard testing
- no-JS testing
- mobile Safari
- metadata preview
- OG image preview
- broken link check
- content confidentiality pass

Acceptance criteria:

- build passes
- lint passes
- accessibility pass acceptable
- no private data leaks
- no family content remains
- contact links work
