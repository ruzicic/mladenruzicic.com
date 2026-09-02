import { expect, test } from "@playwright/test"

import {
  getLcp,
  getResourceTimings,
  installLcpObserver,
  type ResourceTiming,
} from "./helpers"

/**
 * Performance budgets — docs/v3-redesign-plan.md §9:
 *   - JS on `/`: shell ≤ 120 KB gz; three/r3f chunk lazy, after LCP.
 *   - Fonts: ≤ 140 KB total / 3 preloads (checked here as ≤ 4 requested
 *     files, generously covering the non-preloaded 4th face — §5.5), no
 *     Google Fonts request.
 *
 * Soft assertions throughout: on the WIP base most of these will fail because
 * the hero/shell aren't built yet, but the numbers should still be visible in
 * the report.
 */

test("JS shell transfer, three.js-after-LCP, and font-file budgets on /", async ({
  page,
}) => {
  await installLcpObserver(page)

  const fontUrls: string[] = []
  page.on("response", (res) => {
    if (res.request().resourceType() === "font") fontUrls.push(res.url())
  })

  await page.goto("/")
  await page.waitForLoadState("networkidle").catch(() => {})
  // Give any lazily-imported chunk (three.js) and the LCP observer time to
  // settle before reading the performance timeline.
  await page.waitForTimeout(1_500)

  const resources = await getResourceTimings(page)
  const byType = resources.reduce<Record<string, number>>((acc, r) => {
    acc[r.initiatorType] = (acc[r.initiatorType] ?? 0) + 1
    return acc
  }, {})
  test.info().annotations.push({
    type: "budget:responses-by-type",
    description: JSON.stringify(byType),
  })

  const jsResources = resources.filter(
    (r) => r.name.endsWith(".js") || r.initiatorType === "script"
  )
  // Turbopack hashes chunk names, so the three.js scene chunk is identified
  // by timing rather than by name: it is the script the page requests after
  // LCP (lazy: fonts.ready + idle + preloader done).
  const lcpForSplit = await getLcp(page)
  const isLazy = (r: ResourceTiming) =>
    lcpForSplit !== null &&
    lcpForSplit !== undefined &&
    r.startTime > lcpForSplit.startTime + 50
  const threeResources = jsResources.filter(isLazy)
  const shellJs = jsResources.filter((r) => !isLazy(r))
  const shellJsBytes = shellJs.reduce((sum, r) => sum + r.transferSize, 0)

  test.info().annotations.push({
    type: "budget:js-shell",
    description: `${(shellJsBytes / 1024).toFixed(1)} KB gz across ${shellJs.length} script(s) (excludes the three.js chunk)`,
  })
  expect
    .soft(
      shellJsBytes,
      `shell JS transfer should be <= 120 KB gz on first load, measured ${(shellJsBytes / 1024).toFixed(1)} KB`
    )
    .toBeLessThanOrEqual(120 * 1024)

  const lcp = await getLcp(page)
  test.info().annotations.push({
    type: "budget:lcp",
    description: lcp
      ? `LCP candidate at ${lcp.startTime.toFixed(0)}ms`
      : "no largest-contentful-paint entry observed",
  })

  if (threeResources.length === 0) {
    test.info().annotations.push({
      type: "budget:three-chunk",
      description: "no three.js chunk requested — hero canvas not built yet",
    })
  } else if (lcp) {
    for (const resource of threeResources) {
      expect
        .soft(
          resource.startTime,
          `three.js chunk (${resource.name}) should start loading after LCP (${lcp.startTime.toFixed(0)}ms); it started at ${resource.startTime.toFixed(0)}ms`
        )
        .toBeGreaterThanOrEqual(lcp.startTime)
    }
  }

  test.info().annotations.push({
    type: "budget:fonts",
    description: `${fontUrls.length} font file(s): ${fontUrls.join(", ") || "(none)"}`,
  })
  expect
    .soft(
      fontUrls.length,
      `at most 4 font files should load, saw ${fontUrls.length}`
    )
    .toBeLessThanOrEqual(4)

  const googleFonts = fontUrls.filter((url) =>
    url.includes("fonts.googleapis.com")
  )
  expect
    .soft(googleFonts, "no font should be served from fonts.googleapis.com")
    .toEqual([])
})
