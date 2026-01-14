# Design System

A practical design system for `mladenruzicic.com`. Intended as an implementation guide (tokens + components + layouts + motion) so future work stays consistent.

---

## 1) product goals

### primary outcomes
- communicate “senior builder + mentor” in 5 seconds
- make the main CTA obvious, low-friction, and repeated naturally
- make the site feel quiet, premium, and opinionated (not “portfolio-template-y”)
- keep everything readable and fast on mobile

### content hierarchy
1. identity + positioning (what you do + who you help)
2. proof (mentee outcomes, testimonials, logos, notable work)
3. process (how to start, what happens next)
4. conversion (CTA + scheduling + newsletter)

---

## 2) brand voice

### tone
- direct, confident, calm
- concrete nouns, fewer adjectives
- preference for short sentences
- no “marketing fluff”, no hype

### copy patterns
- headings: 2–6 words, verb-forward
- subhead: 1–2 lines, specific audience + outcome
- body: 2–4 short paragraphs or bullets
- CTA labels: action + value (“schedule a discovery session”, “see selected work”)

---

## 3) design principles

1. **whitespace is a feature**  
   spacious layout, low density, high legibility.
2. **typography-first**  
   text should carry the page, visuals support it.
3. **one accent color, used sparingly**  
   accent only for CTAs, key highlights, and micro-details.
4. **consistent section rhythm**  
   repeat the same layout motifs so users learn the UI.
5. **soft edges, sharp type**  
   rounded containers, crisp typography, subtle borders.

---

## 4) tokens

### 4.1 colors

Use a neutral base with a single high-energy accent.

#### neutrals
- `--bg`: `#f7f7f5` (main background)
- `--surface`: `#ffffff` (cards, panels)
- `--surface-2`: `#f1f1ee` (alt surface / subtle blocks)
- `--text`: `#111111` (primary text)
- `--text-muted`: `#5f6368` (secondary text)
- `--text-faint`: `#8a8f98` (tertiary)
- `--border`: `#e6e6e1` (hairline borders)
- `--border-strong`: `#d6d6cf` (dividers on light surfaces)

#### accent
- `--accent`: `#d7ff00` (primary accent highlight)
- `--accent-ink`: `#111111` (text on accent)
- `--accent-soft`: `rgba(215, 255, 0, 0.18)` (glow / chips / subtle fill)

#### functional
- `--success`: `#16a34a`
- `--warning`: `#f59e0b`
- `--danger`: `#dc2626`
- `--info`: `#2563eb`

#### selection / focus
- text selection background: `--accent-soft`
- focus ring: `0 0 0 3px rgba(215, 255, 0, 0.35)` + `0 0 0 1px rgba(17, 17, 17, 0.20)`

> rule: avoid additional “brand colors”. if you need variety, use neutrals + opacity.

---

### 4.2 typography

Prefer a modern sans with excellent readability.

- primary font: `Inter Variable` (variable font, loaded via next/font/google)
- font stack: `"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif`
- optional secondary (for subtle contrast): `ui-serif` only if you have a strong reason. default: no serif.

#### font rendering
```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
body {
  letter-spacing: -0.01em;
}
```

#### type scale (desktop)
- `display`: 56/60, weight 600, letter spacing -0.02em
- `h1`: 44/50, weight 600, -0.02em
- `h2`: 32/38, weight 600, -0.015em
- `h3`: 24/30, weight 600, -0.01em
- `h4`: 18/24, weight 600, 0em
- `body`: 16/26, weight 400
- `small`: 14/22, weight 400
- `meta`: 12/18, weight 500, letter spacing 0.08em, uppercase

#### responsive sizing
Use `clamp()` for hero and section headings:
- display: `clamp(38px, 4vw, 56px)`
- h2: `clamp(24px, 2.6vw, 32px)`

#### text rules
- max readable line length: 58–72ch
- paragraphs: 2–4 lines where possible
- avoid italics for emphasis; prefer weight or background highlight (accent-soft)

#### gradient headings
Use gradient text for visual depth on headings. Apply with Tailwind utilities:

**h1 / h3 (primary headings):**
```html
<h1 class="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">
  Heading text
</h1>
```

**h2 / subheadings (softer emphasis):**
```html
<h2 class="bg-gradient-to-b from-gray-600 to-gray-400 bg-clip-text text-transparent">
  Subheading text
</h2>
```

> rule: gradient headings add polish but should not replace semantic heading hierarchy. use sparingly on key pages (home, mentoring).

---

### 4.3 spacing scale

Base unit: 4px

- 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128

Use 24/32/48 as the “default trio”.

---

### 4.4 layout grid

#### container
- max width: 1120px (content), 1280px (full sections when needed)
- gutters: 24px mobile, 32px tablet, 40px desktop

#### grid
- desktop: 12-col grid
- common splits:
  - 6/6 for two-column sections
  - 7/5 for text-heavy + visual/proof
  - 8/4 for long-form pages with a side rail (optional)

#### section rhythm
- desktop section padding: 96px top/bottom
- tablet: 72px
- mobile: 56px

---

### 4.5 radius, borders, shadows

#### radius
- `--r-sm`: 10px (inputs, small cards)
- `--r-md`: 16px (cards)
- `--r-lg`: 24px (hero panels, feature blocks)

#### borders
- hairline: 1px solid `--border`
- dividers should be subtle and frequent (don’t rely on big shadows)

#### shadows
Prefer “almost invisible” shadows:
- `shadow-1`: `0 1px 2px rgba(17,17,17,0.05)`
- `shadow-2`: `0 8px 24px rgba(17,17,17,0.08)`
Use `shadow-2` only on hover or on special surfaces.

---

## 5) motion + interaction

### timing
- micro interactions: 120–180ms
- hover transitions: 180–240ms
- page/section entrance: 350–500ms

### easing
- default: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- entrances: `cubic-bezier(0.16, 1, 0.3, 1)`

### hover behavior
- buttons/cards: lift `translateY(-2px)` + shadow increase
- links: underline appears with opacity transition, not layout shift

### scroll animation
- optional, minimal:
  - fade up: opacity 0 → 1, translateY 12 → 0
  - stagger per section: 60–90ms
- ensure animations respect `prefers-reduced-motion`

---

## 6) core components

### 6.1 header / nav
- left: wordmark (text logo)
- right: nav links + primary CTA
- sticky behavior: optional; if used, add subtle border-bottom + background blur

**nav links**
- size: 14–16
- hover: underline or slight opacity
- active state: underline + `--text`

**primary header CTA**
- always present (desktop + mobile)
- label should match primary goal (mentoring/scheduling)

---

### 6.2 buttons

#### variants
1. `primary`
   - background: `--text`
   - text: `#fff`
   - hover: slightly lighter bg + shadow-2
2. `accent`
   - background: `--accent`
   - text: `--accent-ink`
   - hover: brightness + small lift
3. `secondary`
   - background: transparent
   - border: `--border-strong`
   - hover: `--surface-2`
4. `ghost`
   - background: transparent
   - hover: `--surface-2`

#### sizing
- `sm`: 36px height, 14px text, 14–16px padding
- `md`: 44px height, 15–16px text, 18–20px padding
- `lg`: 52px height, 16px text, 22–24px padding

#### rules
- only one `accent` button per viewport section
- avoid multiple competing primary buttons; use hierarchy

---

### 6.3 links

Framer-style link formatting with subtle underline:

```css
a {
  text-decoration: underline;
  text-decoration-color: rgba(0, 0, 0, 0.3);
  text-decoration-thickness: 1px;
  text-underline-offset: 2.5px;
  transition: text-decoration-color 0.15s ease;
}
a:hover {
  text-decoration-color: rgba(0, 0, 0, 0.6);
}
```

- default: inherit text color, always underlined with 30% opacity
- hover: underline darkens to 60% opacity
- external links: optionally add a small icon only in lists, not inside paragraphs

---

### 6.4 section label (“kicker”)
Small uppercase label above headings.

- style: `meta` (12px, 0.08em, uppercase)
- color: `--text-faint`
- spacing: 12px below

---

### 6.5 cards
Used for testimonials, work items, steps, and info blocks.

- background: `--surface`
- border: 1px solid `--border`
- radius: `--r-md`
- padding: 24–32
- hover (if clickable): lift + shadow-2

---

### 6.6 badge / tag (tech stack, category)
- background: `--surface-2`
- border: 1px solid `--border`
- text: 12–13, `--text-muted`
- padding: 6px 10px
- radius: 999px
- wrap allowed, consistent gap: 8px

---

### 6.7 avatar stack (social proof)
- size: 32px (desktop), 28px (mobile)
- overlap: -8px
- border: 2px solid `--surface`
- optional: show count “5.0 from 30+ mentees” beside it

---

### 6.8 steps list
Numbered steps (“01”, “02”, “03”).

- layout: 3 columns desktop, 1 column mobile
- number style:
  - 12px uppercase meta OR 14px medium
  - color: `--text-faint`
- step title: 16–18, weight 600
- step body: small/body, muted

---

### 6.9 testimonial block
Two supported formats:

**short card**
- quote: 14–16, normal
- author: 14, weight 600
- avatar optional

**featured testimonial**
- quote: 18–20, line height 1.4
- background: `--surface`
- optionally highlight with `--accent-soft` strip or dot

Rule: never show more than 6 testimonials in a row without grouping/filters.

---

### 6.10 forms (newsletter + contact)
- input height: 44
- radius: `--r-sm`
- border: `--border-strong`
- placeholder: `--text-faint`
- focus: accent ring
- error state: border `--danger`, message 12–13px

Newsletter block should always include:
- 1-line promise (what they get)
- spam disclaimer
- primary action button

---

## 7) page-level templates

### 7.1 home
**goal:** convert to discovery session (and secondarily: newsletter).

**recommended structure**
1. hero: identity + one-liner + primary CTA + secondary link (“see work”)
2. about snapshot: “i build products” style section
3. mentoring proof: ratings + outcomes + 3-step process
4. testimonials (curated)
5. contact CTA (repeat)
6. newsletter

**layout motifs**
- large hero type
- two-column text blocks
- repeated “kicker + headline + body”
- one “big CTA strip” section

---

### 7.2 about
**goal:** credibility + narrative + “why trust you”.

**sections**
- short intro (who you are + what you care about)
- background timeline (tight, skimmable)
- principles (how you work)
- optional: “outside work” human notes (keep short)
- CTA to mentoring / scheduling

Avoid long autobiographical blocks without subheads.

---

### 7.3 work
**goal:** show impact and taste, not a raw timeline.

**two supported views**
1. **selected case studies** (recommended)
   - 4–6 items, each with:
     - role + scope
     - problem
     - what you did
     - measurable outcome (or proxy)
     - tech stack tags
2. **timeline** (secondary)
   - compact list after case studies

**work item card layout**
- left: project name + role
- right: short outcome/impact
- below: 3–6 bullets max
- links only if they add real value

Rule: every item must answer “so what?”

---

### 7.4 mentoring (optional page)
If mentoring is the main conversion goal, a dedicated page is justified.

**when to create it**
- if you need deeper details (plans, expectations, fit, FAQs, outcomes)
- if homepage starts feeling too long or mixed-focus

**mentoring page sections**
- positioning: who it’s for / not for
- what we do together (concrete)
- common tracks (interview prep, architecture, career growth, product thinking)
- process (discovery → plan → cadence)
- testimonials
- FAQ
- final CTA

Homepage then becomes lighter: identity + proof + teaser + CTA to mentoring page.

---

## 8) responsive rules

### breakpoints
- `sm`: 640
- `md`: 768
- `lg`: 1024
- `xl`: 1280

### mobile principles
- reduce section padding (56)
- hero becomes single column
- keep CTA visible early (within first ~600px)
- avoid horizontal avatar stacks that overflow; allow scroll or wrap gracefully
- long testimonials become collapsible (“read more”) if needed

---

## 9) accessibility

- minimum contrast: WCAG AA for text
- focus states always visible (no “outline: none” without replacement)
- motion respects `prefers-reduced-motion`
- tap targets: 44x44 min on mobile
- headings are semantic (no skipping levels)

---

## 10) implementation conventions

### utility-first consistency
- prefer composition via shared component primitives (Button, Card, Section)
- avoid one-off arbitrary values unless the token set cannot express it
- encode tokens as CSS variables, then map to Tailwind theme where useful

### naming
- components:
  - `Section`
  - `Kicker`
  - `Button`
  - `Card`
  - `Tag`
  - `TestimonialCard`
  - `AvatarStack`
  - `Steps`
- variants:
  - `variant="primary|accent|secondary|ghost"`
  - `size="sm|md|lg"`

---

## 11) UI checklist (for future PRs)

- [ ] section starts with kicker + heading (unless hero)
- [ ] max 1 accent element per section
- [ ] text line length within 72ch
- [ ] consistent spacing (no random gaps)
- [ ] interactive elements have hover + focus states
- [ ] mobile tested (no overflow, CTA remains visible)
- [ ] every “work” item includes impact/outcome
- [ ] testimonials are curated, not exhaustive
