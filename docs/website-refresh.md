# Website Refresh Spec (for Claude Code)

Owner: Mladen  
Scope: Update copy + structure + UX for landing, /work, /about, new /mentoring  
Visual rules: MUST follow `docs/design-system.md` (typography scale, spacing, colors, components, buttons, links, layout, breakpoints, etc.)

## 0) Goals / Non-goals

### Goals
- Make the site represent current positioning: platform/product/engineering leadership (not “just senior FE”).
- Separate “Mentoring” into a conversion-focused page with testimonials + booking link.
- Turn `/work` into high-signal case studies (keep URL for SEO/history).
- Keep the landing hero image and wire navigation/CTAs coherently.
- Make the site skim-friendly: fast comprehension in < 30s.

### Non-goals
- No redesign beyond what `docs/design-system.md` already defines.
- No new CMS unless already present.
- No long-form blog work unless already in the project.

### Constraints
- Keep `/work` route and page name as-is, but refactor content into case studies.
- Keep the landing page hero image (same asset, same placement). Copy can change.
- All pages must be accessible (semantic headings, focus states, contrast per design system).
- Performance: avoid heavy new dependencies; keep bundle lean.

---

## 1) Information Architecture

Routes:
- `/` (Landing)
- `/work` (Case studies; keep existing URL)
- `/about` (Narrative + working style)
- `/mentoring` (Mentorship product page: testimonials + booking)

Global nav:
- Work
- About
- Mentoring
- (Optional) CV link (PDF) if currently present

Footer:
- Email
- LinkedIn
- MentorCruise
- (Optional) GitHub
- (Optional) Location: Lugano, CH

---

## 2) Shared Components (design-system driven)

Implement or reuse these components aligned with `docs/design-system.md`:
- `PageLayout` (max width, vertical rhythm)
- `PageHeader` (h1 + intro)
- `Section` (consistent spacing)
- `Callout` (subtle emphasis block)
- `Button` (primary/secondary/ghost per DS)
- `InlineLink`
- `Card` (for testimonials / case study summary blocks)
- `Tag` (optional for “Platform”, “Design system”, “Product” etc.)
- `Divider`

Data patterns:
- Testimonials should be data-driven (array / JSON / MD frontmatter) to keep editing easy.
- Case studies should be structured, not free-form paragraphs.

---

## 3) Page Specs

## 3.1) `/mentoring` (NEW)

### Primary job
Convert visitors who already want mentorship, while pre-filtering mismatched requests.

### Page structure (sections + acceptance criteria)

#### A) Header
- H1: Mentoring for engineers who want leverage, not just growth.
- Intro (2–3 lines): senior engineers + emerging leaders; decisions, impact, platform thinking.
- Primary CTA: “Book on MentorCruise” (external link)
- Secondary CTA: “See what we work on” (anchor to topics section)

Acceptance:
- CTA visible above the fold on desktop and mobile.
- External booking link uses `rel="noopener noreferrer"` and opens in new tab (unless DS says otherwise).

#### B) Credibility strip
Short bullets, factual:
- “Top 3% mentor on MentorCruise”
- “~5 years mentoring”
- “60+ mentees”
- “44 five-star reviews”
(Adjust numbers if needed; keep truthful and consistent with current profiles.)

Acceptance:
- Presented as concise inline list or small cards (per DS).

#### C) Who it’s for / not for
Two columns on desktop, stacked on mobile:
- For: Senior -> Staff+, new EMs, platform owners, people navigating scope/visibility.
- Not for: complete beginners, generic “tell me what to learn”, purely mock interview drills.

Acceptance:
- Clear pre-filtering; avoids negative tone; direct.

#### D) Topics / outcomes
Use 6–10 bullets maximum:
- Staff-level impact and scope
- Platform + design system strategy
- Cross-team influence and stakeholder alignment
- Execution systems (roadmaps, docs, RFCs)
- Career moves: role shaping, negotiation, narrative
- Feedback on artifacts: PRDs, RFCs, architecture docs, resumes (if you want)

Acceptance:
- Each bullet reads like an outcome, not a buzzword.

#### E) Testimonials
- 6–12 testimonials (initially can ship with 6)
- Each testimonial includes:
  - Quote
  - Name (or initials if privacy)
  - Role + company (optional)
  - Source: “MentorCruise” (optional)
- Provide a “More on MentorCruise” link if you want.

Acceptance:
- Quotes are scannable; no wall-of-text.
- Responsive layout: 1 column mobile, 2 column desktop.

#### F) How it works
Short, specific:
- cadence (e.g. async + calls)
- what you review
- response time expectations (avoid SLAs, keep human)

Acceptance:
- No fluff, no corporate tone.

#### G) Final CTA
Repeat primary booking CTA + optional email fallback:
- “Book on MentorCruise”
- “Prefer email? ruzicic@gmail.com”

Acceptance:
- CTA repeated at bottom.

### Suggested copy (ship-ready; tweak as desired)
Hero:
- Title: “Mentoring for engineers who want leverage, not just growth.”
- Intro: “I mentor senior engineers and early leaders on staff-level impact, platform work, and career inflection points. Direct, pragmatic, heavy on decisions and artifacts.”

---

## 3.2) `/about` (TWEAK EXISTING COPY)

### Decision
Keep the existing page and URL, but rewrite for narrative + working style. Do NOT copy-paste CV.

### Page structure

#### A) Header
- H1: About
- 1–2 sentence positioning:
