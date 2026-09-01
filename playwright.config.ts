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
 * `pnpm dev -p 3104` itself. In CI there is no dev server running, so it always
 * builds and starts the production server fresh.
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
    command: process.env.CI
      ? "pnpm build && pnpm start -p 3104"
      : "pnpm dev -p 3104",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
  },
})
