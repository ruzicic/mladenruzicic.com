# QA acceptance criteria

## Build checks

Required before merge:

```txt
npm run format:check
npm run lint
npm run build
```

## Positioning checks

- Homepage no longer says `software developer, mentor, and entrepreneur` as primary identity.
- Hero communicates product engineering, technical product leadership and founder/operator work.
- ZF, Shopify, TenderLift and studenti.rs are visible in the primary experience.
- Mentoring is present but secondary.
- Contact path is clear.

## Removal checks

- No family photos.
- No family alt text.
- No family support copy.
- No homepage mentorship pricing.
- No agency-style CTA.
- No crypto positioning.
- No full-time in-office signal.
- No people-management-heavy positioning.

## Accessibility checklist

- One `h1` per page.
- Heading levels are semantic.
- Skip link exists.
- Keyboard navigation works.
- Focus state is visible.
- No keyboard traps.
- All links and buttons have accessible names.
- Tap targets are usable on mobile.
- Text contrast passes WCAG AA.
- Images have meaningful alt text or empty decorative alt.
- Video previews are muted.
- Reduced motion disables autoplay and non-essential movement.
- No important content exists only in screenshots.

## Mobile checklist

Test at:

```txt
390x844
430x932
768x1024
```

Requirements:

- no horizontal scroll
- hero is readable without giant dead space
- CTAs appear early
- navigation is obvious
- work cards are scannable
- case-study metadata does not dominate
- media does not overflow
- table of contents is usable

## No-JS checklist

- homepage content renders
- work index renders
- case studies render
- notes render
- navigation remains usable enough
- no critical copy hidden behind JS
- contact links work

## SEO checklist

- title per route
- description per route
- canonical URL
- sitemap includes public routes
- robots config correct
- Open Graph image per major route
- Twitter card data
- JSON-LD where relevant
- no accidental noindex
- old routes redirected if changed

## LLM-readable checklist

- `/llms.txt` exists
- `/llms-full.txt` exists
- `/about.md` exists
- `/work.md` exists
- important work pages have markdown mirrors
- important notes have markdown mirrors
- markdown includes canonical URL
- markdown includes last updated date
- private metrics excluded
- uncertain metrics marked or excluded
- HTML and markdown do not contradict each other

## Performance budget

Homepage target:

```txt
LCP: under 2.5s on reasonable mobile connection
CLS: under 0.1
INP: under 200ms
No autoplay video loaded above fold
Images responsive and compressed
```

Implementation requirements:

- below-fold media lazy-loaded
- video previews use `preload="none"`
- poster images present
- no massive JS bundle for static content
- avoid using Framer Motion for simple hover states

## Design-system consistency checklist

- colors come from tokens
- spacing mostly uses tokens
- focus states consistent
- cards use shared variants
- typography hierarchy consistent
- prose pages share styles
- media frames share styles
- status badges consistent

## Copy quality checklist

- no vague hype
- no fake AI language
- no weak `passionate developer` style
- no unsupported metrics
- no family copy
- clear audience per page
- clear CTA per page
- project cards explain why each project matters
- stopped projects framed professionally

## Content accuracy checklist

Verify before launch:

- exact Shopify period
- exact HEGIAS period
- exact WolkAbout period
- exact Nemestic/freelance periods
- ZF public-safe metrics
- Shopify public-safe details
- studenti.rs public metrics
- FontAlternatives traffic
- Avataurus traffic
- MentorCruise review count if used
- current contact links
- CV freshness

## Confidentiality checklist

- no ZF internal screenshots without approval
- no Shopify internal screenshots
- no private partner data
- no private customer names
- no TenderLift customer data
- no private TenderLift metrics unless approved
- no studenti.rs revenue unless approved
- no admin/payment screenshots with sensitive data

## Launch checklist

- final copy reviewed
- images sanitized
- metadata previewed
- OG images previewed
- sitemap checked
- markdown mirrors checked
- contact links checked
- CV link checked
- analytics checked
- deploy preview reviewed on mobile
- production deploy complete
