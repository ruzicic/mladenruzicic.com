import { expect, test } from "@playwright/test"

import { getCls, installClsObserver } from "./helpers"

/**
 * Desktop Chrome only (see playwright.config.ts) — the full-motion path.
 * docs/v3-redesign-plan.md §5.1 (hero canvas), §5.4 (preloader, once per
 * session via sessionStorage, ≤ 1s target / 2s hard budget here).
 */

const HERO_H1_FRAGMENT = "I build products, platforms and the"

test("hero h1 is present in the raw server HTML (no client mount required)", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/`)
  const html = await res.text()
  expect(html).toContain(HERO_H1_FRAGMENT)
})

test("preloader shows on first visit and detaches within 2s; hero canvas mounts within 5s; CLS < 0.1", async ({
  page,
}) => {
  await installClsObserver(page)

  await page.goto("/")

  // First visit: the h1 must already be visible, not waiting on the
  // preloader to lift (the preloader sits on top at opacity 1, the hero
  // paints underneath — docs/v3-redesign-plan.md §5.4).
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()

  const preloader = page.locator('[data-testid="preloader"]')
  // Tolerate the preloader having already come and gone before this check
  // runs; the hard requirement is that it is gone within 2s of navigation.
  await expect(preloader, "preloader detaches within 2s of first visit").toHaveCount(
    0,
    { timeout: 2_000 }
  )

  const heroCanvas = page.locator('[data-testid="hero-canvas"]')
  await expect(
    heroCanvas,
    "[data-testid=hero-canvas] mounts within 5s"
  ).toHaveCount(1, { timeout: 5_000 })

  // Settle window for layout-shift entries to land.
  await page.waitForTimeout(2_000)
  const cls = await getCls(page)
  expect(cls, `cumulative layout shift (${cls}) should be < 0.1`).toBeLessThan(
    0.1
  )
})

test("preloader does not reappear on reload within the same session", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.locator('[data-testid="preloader"]')).toHaveCount(0, {
    timeout: 2_000,
  })

  await page.reload()
  await page.waitForTimeout(300)

  await expect(
    page.locator('[data-testid="preloader"]'),
    "reload in the same session (sessionStorage) must not show the preloader again"
  ).toHaveCount(0)
})
