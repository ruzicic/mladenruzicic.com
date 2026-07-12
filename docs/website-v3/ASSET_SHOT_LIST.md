# Asset shot list

## Goal

Use screenshots and previews as proof. Do not use them as decoration.

## Asset structure

```txt
public/work/[slug]/
  poster.avif
  preview.webm
  preview.mp4
  screenshots/
    01.avif
    02.avif
    03.avif
    04.avif
    05.avif
  captions.json
```

Source files can live outside `public`:

```txt
assets/source/work/[slug]/
```

## Naming convention

```txt
[slug]-[viewport]-[sequence]-[description].[ext]
```

Examples:

```txt
tenderlift-desktop-01-today.avif
tenderlift-desktop-02-tender-detail.avif
tenderlift-mobile-01-alerts.avif
studenti-rs-desktop-01-home.avif
```

## Viewports

Capture priority sizes:

```txt
desktop: 1440x1000
tablet: 834x1112
mobile: 390x844
```

Every featured project should have:

- one desktop hero screenshot
- one mobile screenshot
- one detail or workflow screenshot

## TenderLift

Status: active flagship

Capture:

1. Today ranked tenders
2. Tender detail summary
3. Fit score and eligibility explanation
4. Company profile or matching criteria
5. Alerts or digest
6. Bid preparation or document review if public-safe
7. Buyer or competitor intelligence if public-safe
8. Slack, WhatsApp or Telegram assistant if sanitized

Avoid:

- private customer data
- sensitive tender strategy
- internal ingestion details
- user emails
- customer names unless public and approved

## studenti.rs

Status: active maintained

Capture:

1. Homepage or search
2. Institution page
3. Document listing
4. Post detail
5. PRO subscription surface if public
6. Mobile reading experience
7. Admin/AI ops only if fully sanitized and worth explaining

Avoid:

- private user info
- payment details
- admin-only sensitive data

## FontAlternatives

Status: active maintained

Capture:

1. Homepage/search
2. Font alternative result page
3. Side-by-side preview
4. Missing font search flow if visible
5. Blog article about demand flywheel
6. Mobile layout

## FontSwap

Status: active maintained

Capture:

1. Chrome Web Store listing
2. Extension usage on a sample page
3. Font replacement interaction
4. FontAlternatives connection

## Avataurus

Status: active experiment

Capture:

1. Main creation flow
2. Generated avatar examples
3. studenti.rs integration if public-safe
4. Mobile usage if available

## Boxium

Status: paused

Capture:

1. Landing page
2. Product concept surface
3. Document archive workflow if built
4. Compliance framing

Avoid overclaiming current activity.

## MontePop

Status: active experiment

Capture:

1. Game selection
2. Offline-first state if visible
3. Language selector
4. Game interaction
5. MVP progress if public-safe

## Amada

Status: standard / live small project

Capture:

1. Homepage
2. Property detail
3. Booking/contact flow
4. Mobile page

## Panciona

Status: stopped

Capture:

1. Landing page
2. product dashboard or prototype if available
3. only if it adds learning value

Framing should be about distribution and founder-market fit.

## Hi Fam

Status: stopped

Capture:

1. landing page or brand screenshot if available
2. content examples only if rights are clear
3. LOI proof should not expose private names

## FlexMatch

Status: stopped

Capture:

1. landing page or prototype
2. staffing flow
3. no private LOI/customer names

## Nunium

Status: stopped

Capture:

1. MVP screenshot
2. demo surface
3. no private customer data

## ZF SCALAR

Status: company, current, limited confidentiality

Use only public-safe visuals:

1. public ZF SCALAR marketing/product page
2. public EVO Touch page or public app visuals
3. abstracted design-system diagram created for the site
4. no internal screenshots unless explicitly approved

Avoid:

- internal UI
- roadmap
- private metrics
- internal Jira/Confluence
- confidential component library screenshots

## Shopify

Status: company, completed, limited confidentiality

Use only public-safe visuals:

1. Shop Minis public page
2. Shop.app public visuals
3. public app-store screenshots
4. public Shopify checkout marketing/docs if appropriate

Avoid:

- internal tools
- private partner data
- private builds
- unreleased features

## HEGIAS

Status: company, completed, limited confidentiality

Capture:

1. public website/product screenshots
2. public 3D/AR/VR visuals
3. archive if product changed
4. abstract system diagram if screenshots are not safe

## WolkAbout

Status: company, completed

Capture:

1. archive website
2. SDK/npm package page
3. public IoT visuals
4. abstract live-data/performance diagram if better

## Preview behaviour

Desktop fine pointer:

- show poster initially
- load video on intent
- play muted loop on hover
- pause and reset on leave
- provide visible link or button

Keyboard:

- focus styles visible
- preview controls accessible
- Enter activates primary link

Touch:

- no autoplay
- poster visible
- explicit Preview button
- dialog or popover with stills/video

Reduced motion:

- no autoplay
- use still image gallery

## Video rules

- do not use GIFs
- prefer WebM plus MP4 fallback
- mute by default
- `playsInline`
- `preload="none"` for card previews
- poster always present

## Alt text rules

Bad:

```txt
TenderLift screenshot
```

Good:

```txt
TenderLift Today page showing ranked Swiss public tenders with fit scores and summary cards.
```

## Captions

Each media item should say:

- what this shows
- why it matters
- whether it is real, demo or sanitized

## Acceptance criteria

- every high-priority project has at least one poster
- every active flagship has a mobile screenshot
- no private data appears
- no hover-only content
- reduced motion works
- videos do not block initial page load
