# Claude Design brief

## Objective

Design the next version of `mladenruzicic.com` as a high-signal personal brand site for a product-minded engineer, technical product leader and founder/operator working in the AI era.

The site must help serious visitors understand that Mladen has operated across:

- high-scale consumer product engineering
- frontend platform and design-system leadership
- technical product ownership
- independent B2B SaaS and education products
- AI-native development and operations workflows
- mentoring as leadership proof

## Current repo context

The existing site is a Next.js app using App Router, MDX, Tailwind, local fonts, Framer Motion and Fathom. Keep that technical foundation unless implementation discovers a blocker.

Important current problems:

- homepage opens with generic greeting and weak positioning
- current metadata says `Software developer, mentor, and entrepreneur`
- homepage uses family imagery and family copy
- mentoring is too prominent on homepage
- work page is a hard-coded chronological list
- current work and AI-native practice are underrepresented

## Hard design constraints

- No family imagery.
- No family copy.
- Mentoring gets one compact homepage section and a dedicated page.
- Homepage must not feel like a mentoring funnel.
- Site must not feel like an agency landing page.
- Site must work beautifully on mobile.
- Site must be accessible.
- Key content must render in HTML without relying on JS.
- Every hover interaction needs keyboard and touch equivalents.
- Avoid generic AI neon, particles, glassmorphism and fake-futuristic visuals.

## Visual personality

Use:

- editorial
- technical
- mature
- precise
- warm
- product-led
- evidence-backed
- distinctive but not loud

Avoid:

- SaaS template look
- developer dark-mode cliche
- cyberpunk AI style
- overly playful portfolio style
- sterile enterprise deck style
- animation for its own sake

## Required visual directions

Create at least three homepage design directions before converging.

### Direction 1: Editorial technical

Best likely default.

Characteristics:

- strong typographic hierarchy
- warm neutral canvas
- elegant case-study rhythm
- large but readable hero
- serious technology-publication feel
- restrained accent color
- clear evidence sections

### Direction 2: Operating system / command center

Higher risk, potentially more distinctive.

Characteristics:

- modular panels
- status indicators
- metadata rows
- current focus and system telemetry
- command-palette inspired navigation
- AI-native workbench feel

Avoid making it look like a generic dashboard.

### Direction 3: Product lab / case-study driven

Most visual and portfolio-like.

Characteristics:

- large project surfaces
- screenshots as proof
- hover/focus previews
- media-led work cards
- strong case-study structure

Avoid turning the site into a Dribbble portfolio.

## Recommended convergence

Blend:

- Direction 1 as base
- Direction 2 for metadata density and AI-native/system feeling
- Direction 3 for project evidence and media previews

## Pages to design

Design complete responsive layouts for:

1. Homepage
2. Work index
3. Work case study
4. Notes index
5. Note detail
6. Mentoring page
7. About page
8. Now page
9. Uses page refresh
10. Machine-readable / markdown route shell, visually simple

## Homepage sections

1. Hero
2. Current focus
3. Selected company chapters
4. Independent products
5. AI-native practice
6. Notes and learnings
7. Compact mentoring proof
8. Final contact CTA

## Key copy to design around

Hero headline:

```txt
I build products, platforms and the systems around them.
```

Hero support:

```txt
I am a product-minded engineer, technical product leader and founder/operator with deep experience across frontend architecture, mobile apps, developer experience, design systems, product ownership and AI-native execution.
```

Current focus line:

```txt
I work where product ambiguity, technical systems and execution meet.
```

AI section line:

```txt
AI changed the economics of building, not the need for judgment.
```

## Design system expectations

Claude Design should produce:

- typography system
- color tokens
- spacing scale
- component variants
- homepage and case-study visual system
- mobile layouts
- card system
- media preview treatment
- navigation treatment
- prose styling
- dark mode recommendation
- interaction notes
- handoff notes for Claude Code

## Typography recommendation

Explore:

```txt
Newsreader Variable + Geist Sans + Geist Mono
```

Alternatives allowed if stronger:

- Fraunces + Geist Sans
- Literata + Geist Sans
- IBM Plex Sans + IBM Plex Mono if staying closer to current repo

## Color direction

Warm editorial neutrals with one electric accent.

Light theme:

```css
--color-canvas: #f7f4ed;
--color-surface: #efebe2;
--color-surface-raised: #ffffff;
--color-text: #121212;
--color-text-muted: #5f5a52;
--color-border: #d8d2c7;
--color-accent: #5b3df5;
--color-on-accent: #ffffff;
```

Dark theme:

```css
--color-canvas: #111111;
--color-surface: #191919;
--color-surface-raised: #212121;
--color-text: #f7f4ed;
--color-text-muted: #bcb5aa;
--color-border: #383633;
--color-accent: #b8aaff;
--color-on-accent: #121212;
```

## Component set to design

- SiteHeader
- SiteFooter
- PageContainer
- Section
- SectionHeader
- Button
- Chip
- Badge
- WorkCard
- FeaturedWorkCard
- CompanyChapterCard
- ProductCard
- CaseStudyHeader
- MetricStrip
- RoleScopePanel
- MediaGallery
- HoverPreview
- Timeline
- NoteCard
- TestimonialCard
- CTASection
- MarkdownRouteLink

## Interaction expectations

- Use motion to reveal structure or evidence.
- Use hover preview only for fine-pointer devices.
- Touch users get explicit preview controls.
- Reduced motion users get still images.
- No autoplay video on initial page load.
- Navigation should be simple and fast.

## Claude Code handoff expectations

The final design handoff should include:

- selected visual direction
- exact component list
- responsive examples
- token values
- implementation notes
- which parts should be CSS only
- which parts require client components
- asset requirements
- page-by-page build order

## Acceptance for design

A good design makes this obvious without reading an About page:

```txt
This is a senior builder who can own ambiguous product and engineering problems, operate with small-team leverage, and bring serious AI-native execution to real products.
```
