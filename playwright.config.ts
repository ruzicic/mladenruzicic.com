import { defineConfig, devices } from "@playwright/test"

/**
 * E2E harness for the v3 redesign — docs/v3-redesign-plan.md §8 (gates) and §9
 * (budgets), docs/v3-workflow.md.
 *
 * Dev server port is fixed at 3104 for this worktree so it never collides with
 * the other wave-2 agents' dev servers (3101–3103).
 *
 * Locally: run `pnpm dev -p 3104` in one terminal and `pnpm test:e2e` in
 * another — Playwright reuses that server. With no server running it starts
 * `pnpm dev -p 3104` itself. `CI=1 pnpm test:e2e` runs the production path
 * instead: it starts `pnpm start -p 3104` and never reuses a running server,
 * so build first (`pnpm build`), which is what e2e.yml does.
 */

const PORT = 3104
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL,
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
       * Desktop WebKit over the specs where an engine difference would
       * actually change the result: view transitions, focus, axe and the
       * preloader/canvas timing. `motion.spec.ts` is anchored so it does not
       * also pull in `reduced-motion.spec.ts`, which has its own project.
       */
      name: "Desktop Safari",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1440, height: 900 },
      },
      testMatch: [
        /transitions\.spec\.ts$/,
        /keyboard\.spec\.ts$/,
        /a11y\.spec\.ts$/,
        /(^|[\\/])motion\.spec\.ts$/,
      ],
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

  webServer: {
    /*
     * CI builds in its own workflow step (.github/workflows/e2e.yml) and
     * starts the prerendered output here, so this only has to wait for
     * `next start` — under a second. Building inside `webServer` made a cold
     * Next 16 build on a 2-core runner race this timeout, and reported a
     * compile error as "Timed out waiting for the web server". Run
     * `pnpm build` yourself before `CI=1 pnpm test:e2e` locally.
     */
    command: process.env.CI ? "pnpm start -p 3104" : "pnpm dev -p 3104",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    /* Belt and braces: a cold `pnpm dev` first compile is the slow path now. */
    timeout: 600_000,
    stdout: "pipe",
  },
})
