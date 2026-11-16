import { defineConfig, devices } from "@playwright/test"

/**
 * E2E harness for the 2027 site (docs/v4-build/PLAN.md). What each spec
 * covers, and how to run it, is in `tests/README.md`.
 *
 * Three ways to point it at a server:
 *
 * - `PLAYWRIGHT_BASE_URL=http://localhost:3200 pnpm test:e2e` runs against a
 *   server that is already up (the shared dev server while the site is being
 *   built). No `webServer` is started.
 * - `pnpm test:e2e` with nothing set starts `pnpm dev -p 3104` (or reuses
 *   whatever already listens on 3104).
 * - `CI=1 pnpm test:e2e` is the production path: it starts `pnpm start -p
 *   3104` and never reuses a server, so build first (`pnpm build`), which is
 *   what `.github/workflows/e2e.yml` does.
 *
 * A dev server compiles each route on its first hit, so outside CI the
 * timeouts are generous and `tests/global-setup.ts` requests every route once
 * before the first test.
 */

const PORT = 3104
const external = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "")
const baseURL = external || `http://localhost:${PORT}`
const ci = !!process.env.CI

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: ci ? 2 : undefined,
  reporter: ci ? [["html", { open: "never" }], ["github"], ["list"]] : "list",
  timeout: ci ? 30_000 : 60_000,
  expect: { timeout: ci ? 5_000 : 10_000 },

  use: {
    baseURL,
    navigationTimeout: ci ? 15_000 : 45_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
      testIgnore: [/mobile\.spec\.ts$/, /reduced-motion\.spec\.ts$/],
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 14"],
        viewport: { width: 390, height: 844 },
      },
      testMatch: [/mobile\.spec\.ts$/],
    },
    {
      /*
       * Desktop WebKit over the specs where the engine changes the result:
       * route changes with view transitions, and the Ask dialog (top layer,
       * `closedby`, focus return). Keyboard Tab order is Chromium only: see
       * "The WebKit caveat" in tests/README.md.
       */
      name: "Desktop Safari",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 900 },
      },
      testMatch: [/transitions\.spec\.ts$/, /ask\.spec\.ts$/],
    },
    {
      name: "reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        contextOptions: { reducedMotion: "reduce" },
      },
      testMatch: [/reduced-motion\.spec\.ts$/],
    },
  ],

  webServer: external
    ? undefined
    : {
        /*
         * CI builds in its own workflow step (.github/workflows/e2e.yml) and
         * starts the prerendered output here, so this only waits for
         * `next start`. Building inside `webServer` made a cold build race
         * this timeout and report a compile error as "Timed out waiting for
         * the web server". Run `pnpm build` yourself before `CI=1 pnpm
         * test:e2e` locally.
         */
        command: ci ? `pnpm start -p ${PORT}` : `pnpm dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !ci,
        timeout: 600_000,
        stdout: "pipe",
      },
})
