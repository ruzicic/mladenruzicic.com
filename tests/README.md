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
| `motion.spec.ts` | Desktop Chrome + Desktop Safari — preloader lifecycle (once per session via `sessionStorage`), hero canvas mount, CLS budget. |
| `keyboard.spec.ts` | Tab order (skip link → nav → sound toggle) and visible focus, both Chromium-only; `keyboardControls` covers the same controls on every engine by focusing them directly; timeline band Enter/Escape/ArrowRight; the "worked alongside" people block inside an expanded band (open the band, open a person's card, Escape closes the card and then the band). |
| `transitions.spec.ts` | Desktop Chrome + Desktop Safari — work row → case study navigation, back navigation, timeline-band state across Cache Components route retention. |
| `mobile.spec.ts` | Mobile Safari only — no horizontal overflow, mobile pill and its sheet. |
| `machine.spec.ts` | `/llms.txt`, `/llms-full.txt`, `/*.md` mirrors, `Accept: text/markdown` negotiation, `Person` JSON-LD. |
| `budgets.spec.ts` | Initial route JS on `/` (the document's own `<script src>` set) against 200 KB gz, font-file count, three.js chunk timing relative to LCP. |
| `helpers.ts` | Console-error collector, sitemap reader, CLS/LCP `PerformanceObserver` injection, resource-timing and request-tracking helpers, and the `waitForPreloaderGone` / `waitForRouteReady` settle waits. Shared by the specs above. |

## Projects

| Project | Engine | Specs |
|---|---|---|
| `Desktop Chrome` | Chromium 1440×900 | everything except `mobile.spec.ts` and `reduced-motion.spec.ts` |
| `Mobile Safari` | WebKit, iPhone 14 390×844 | `mobile.spec.ts` |
| `Desktop Safari` | WebKit 1440×900 | `transitions`, `keyboard`, `a11y`, `motion` |
| `reduced-motion` | Chromium with `reducedMotion: "reduce"` | `reduced-motion.spec.ts` |

### The one WebKit caveat

macOS ships with "Press Tab to highlight each item" off, and Playwright's
WebKit inherits it: pressing Tab on `/` cycles `DIV -> BODY -> DIV` and never
focuses a link. That is the platform's setting, not something the site
controls, so the two Tab-order tests in `keyboard.spec.ts` are gated on
`browserName !== "webkit"`. The `keyboardControls` test covers the same six
header controls on every engine by focusing each one directly and asserting the
`2px solid #F5DF4D` ring — which is exactly what a Safari user with full
keyboard access enabled sees.

## Running locally

The port is fixed at **3104** so it never collides with the other agents' dev
servers on 3101–3103.

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

**Option C — the production path, exactly what CI runs:**

```sh
pnpm build
CI=1 pnpm test:e2e
```

`CI=1` switches `webServer` to `pnpm start -p 3104` and turns off
`reuseExistingServer`, so build first or the server has nothing to serve. It
also turns on one retry and the GitHub + HTML reporters. This is the only mode
in which `budgets.spec.ts` numbers mean anything — a dev build's chunks are
unminified.

Useful variants:

```sh
pnpm test:e2e:ui                          # Playwright's UI mode
pnpm exec playwright test routes.spec.ts  # one file
pnpm exec playwright test --project="Desktop Chrome"
pnpm exec playwright test --project="Desktop Safari"
pnpm exec playwright test --project="reduced-motion"
pnpm exec playwright test --project="Mobile Safari"
pnpm exec playwright show-report          # open the HTML report after a run
```

Traces are kept for failed tests (`trace: 'retain-on-failure'`); open one with
`pnpm exec playwright show-trace test-results/<test>/trace.zip`.

## Running in CI

`.github/workflows/e2e.yml` runs on every pull request and on push to `main`.
It restores `.next/cache`, installs dependencies, installs the Chromium +
WebKit browsers (`playwright install --with-deps`), runs **`pnpm build` as its
own step**, then runs the suite with `CI=true` so `webServer` only has to start
`pnpm start -p 3104`. The HTML report is uploaded as an artifact when the run
fails.

Building in a separate step matters: a cold Next 16 build on a 2-core runner
can outlast any sensible `webServer.timeout`, and when it does, a plain compile
error is reported as "Timed out waiting for the web server".

## Reading a red run

The suite is green: **45 passed, 4 skipped, 0 flaky** in ~37 s across all four
projects. Treat any failure as real. Those four skips are the only expected
ones; if you see a fifth, find out why before shipping.

| Skip | Where | Why |
|---|---|---|
| `"worked alongside" popover` | `Desktop Chrome`, `Desktop Safari` | Runs today: `content/people.ts` has entries and two bands list them. It still self-skips if every `Company.people` empties out, since then no band renders a `[data-band-people]` block at all. |
| `Tab reaches the skip link…` | `Desktop Safari` | The WebKit caveat above. `keyboardControls` covers the same six controls there. |
| `focused elements keep a visible focus indicator` | `Desktop Safari` | Same. |

Tests that self-skip on a missing `data-testid` (`timeline-band`,
`mobile-pill`, …) are a deliberate escape hatch from when the redesign was
being built in parallel. Every one of those ids exists today, so a skip that is
not in the table above means something regressed out of the DOM — not that a
feature is "not built yet".
