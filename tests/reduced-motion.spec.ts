import { expect, test } from "@playwright/test"

import { trackRequestsMatching } from "./helpers"

/**
 * Runs only in the `reduced-motion` project (Chromium, `reducedMotion:
 * 'reduce'`) — see playwright.config.ts. docs/v3-redesign-plan.md §5.1/§5.4:
 * under reduced motion there is no preloader, no three.js download, a static
 * hero poster instead of the canvas, and nothing left animating.
 */

test("/ skips the preloader, three.js and all running animations under reduced motion", async ({
  page,
}) => {
  const threeRequests = trackRequestsMatching(page, "three")

  let preloaderSeen = false

  await page.goto("/")

  // Poll briefly for the preloader ever attaching, rather than trusting a
  // single snapshot — reduced motion should mean it's never inserted at all.
  const preloader = page.locator('[data-testid="preloader"]')
  for (let i = 0; i < 10; i++) {
    if ((await preloader.count()) > 0) {
      preloaderSeen = true
      break
    }
    await page.waitForTimeout(150)
  }
  expect(preloaderSeen, "[data-testid=preloader] is never attached").toBe(false)

  await expect(
    page.locator('[data-testid="hero-still"]'),
    "[data-testid=hero-still] is present"
  ).toHaveCount(1)
  await expect(
    page.locator('[data-testid="hero-canvas"]'),
    "[data-testid=hero-canvas] is absent"
  ).toHaveCount(0)

  // Give any lazy hero-canvas import a chance to fire before judging network.
  await page.waitForTimeout(1000)
  expect(
    threeRequests,
    `no request URL should include "three" under reduced motion, saw: ${threeRequests.join(", ")}`
  ).toEqual([])

  await page.waitForTimeout(2000)
  const runningAnimations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length
  )
  expect(
    runningAnimations,
    "no animation is running 2s after load under reduced motion"
  ).toBe(0)
})
