# E2E harness

Playwright suite for the v3 redesign, driven by the content model in
`lib/content/index.ts` and `docs/v3-content-contract.md`. See
`docs/v3-redesign-plan.md` §8 (gates) and §9 (budgets) for what these checks
are trying to enforce.

## Layout

| File | Covers |
|---|---|
| `routes.spec.ts` | Every `/sitemap.xml` URL: 200, one `<h1>`, `<title>`, meta description, canonical, zero console errors. `/mentorship` → 308 → `/mentoring`, `/cv` → `/cv.pdf`, `/work/does-not-exist` → 404. |
| `a11y.spec.ts` | axe on the core routes — no `serious`/`critical` violations. |
| `no-js.spec.ts` | `javaScriptEnabled: false` — hero, work rows, timeline, mentoring bubbles, and a case study still render. |
| `reduced-motion.spec.ts` | `reduced-motion` project only — no preloader, no three.js request, hero still (not canvas), zero running animations. |
| `motion.spec.ts` | Desktop Chrome only — preloader lifecycle (once per session via `sessionStorage`), hero canvas mount, CLS budget. |
| `keyboard.spec.ts` | Tab order (skip link → nav → sound toggle), visible focus, timeline band Enter/Escape/ArrowRight, "worked alongside" popover. |
| `transitions.spec.ts` | Desktop Chrome only — work row → case study navigation, back navigation, timeline-band state across Cache Components route retention. |
| `mobile.spec.ts` | Mobile Safari only — no horizontal overflow, mobile pill and its sheet. |
| `machine.spec.ts` | `/llms.txt`, `/llms-full.txt`, `/*.md` mirrors, `Accept: text/markdown` negotiation, `Person` JSON-LD. |
| `budgets.spec.ts` | JS/font transfer size, three.js chunk timing relative to LCP. |
| `helpers.ts` | Console-error collector, sitemap reader, CLS/LCP `PerformanceObserver` injection, resource-timing and request-tracking helpers. Shared by the specs above. |

## Running locally

Two ways to get a server on port **3104** (fixed, so it never collides with
the other wave-2 agents' dev servers on 3101–3103):

**Option A — let Playwright manage it (simplest):**

```sh
pnpm exec playwright install chromium webkit   # once
pnpm test:e2e
```

With no server already listening on 3104, `playwright.config.ts` starts
`pnpm dev -p 3104` itself and waits for it to come up.

**Option B — run your own dev server (faster repeat runs):**

```sh
pnpm dev -p 3104          # terminal 1, leave running
pnpm test:e2e             # terminal 2 — reuses the server above
```

Useful variants:

```sh
pnpm test:e2e:ui                          # Playwright's UI mode
pnpm exec playwright test routes.spec.ts  # one file
pnpm exec playwright test --project="Desktop Chrome"
pnpm exec playwright test --project="reduced-motion"
pnpm exec playwright test --project="Mobile Safari"
pnpm exec playwright show-report          # open the HTML report after a run
```

Traces are kept for failed tests (`trace: 'retain-on-failure'`); open one with
`pnpm exec playwright show-trace test-results/<test>/trace.zip`.

## Running in CI

`.github/workflows/e2e.yml` runs on every pull request: installs dependencies,
installs the Chromium + WebKit browsers (`playwright install --with-deps`),
runs `pnpm build && pnpm start -p 3104` as the `webServer` (no dev server, no
reuse), executes the full suite, and uploads the HTML report as an artifact
when the run fails.

## Expected state against a WIP base

This harness targets the **finished** site. Run against an unfinished base
(e.g. the wave-1 foundation snapshot before the hero, shell, and work-system
agents land) and a large fraction of it is *expected* to fail — that's the
harness doing its job, not a bug. Failures fall into two buckets:

1. **Missing feature, not a harness bug.** A test-id from the brief
   (`hero`, `hero-canvas`, `hero-still`, `preloader`, `work-rows`, `timeline`,
   `timeline-band`, `mobile-pill`) isn't in the DOM yet, or a page is still a
   labeled "SKELETON" placeholder. These clear up as the other agents' work
   merges in — no change needed here.
2. **Harness bug.** The selector, assertion, or config is wrong even against
   the intended final markup. These are bugs in this suite and should be
   fixed here.

When triaging a red run, check first whether the missing piece is one of the
test ids above or a "SKELETON" comment in the relevant `app/**/page.tsx` —
if so, it's (1); if the test's own logic looks off against
`docs/v3-content-contract.md` or `docs/v3-redesign-plan.md`, it's (2).
