import { expect, test } from "@playwright/test"

import { HOME } from "@/content/pages/home"

import { launchFullChromium } from "./full-chromium"
import {
  getCls,
  getLcp,
  getResourceTimings,
  installClsObserver,
  installLcpObserver,
  waitForHydration,
} from "./helpers"

/**
 * Performance budgets for `/` (PLAN.md §2 "Performance"). Only meaningful
 * against a production build (`next dev` ships unminified chunks, the HMR
 * client and the devtools), so these run only with `CI` set or with
 * `PLAYWRIGHT_PROD=1` against a `pnpm build && pnpm start` server.
 *
 * - The largest contentful paint is text above the fold: the headline or
 *   the story under it, never an image. (On the 2026-11-11 build it is the
 *   story's first paragraph, which paints at the same time as the headline
 *   and covers more area at 1440x900.)
 * - Cumulative layout shift stays under 0.05 through load and settling;
 *   through the font swap on a throttled phone, see below.
 * - JavaScript on `/`: at most {@link JS_BUDGET_KB} KB over the wire
 *   (compressed), everything requested up to the end of load. Measured
 *   against the production build of 2026-11-11 at 181 KB (twelve files up to
 *   load: React DOM, the Next runtime and the page's islands; the Ask panel
 *   is a separate chunk fetched only on intent), plus about 15 percent.
 *   Raise it only with a reason in the commit message.
 */

const PROD = !!process.env.CI || process.env.PLAYWRIGHT_PROD === "1"
const JS_BUDGET_KB = 208
const CLS_BUDGET = 0.05

test.skip(!PROD, "budgets need a production build: set CI or PLAYWRIGHT_PROD=1")

test.describe("/ budgets", () => {
  test("the largest contentful paint is text above the fold", async ({
    page,
  }) => {
    await installLcpObserver(page)
    await page.goto("/")
    await waitForHydration(page)
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    // LCP stops updating at the first input; read it before any.
    await expect.poll(() => getLcp(page)).not.toBeNull()
    const lcp = (await getLcp(page))!
    expect(lcp.url, `LCP is not an image (${lcp.url})`).toBe("")
    expect(lcp.tag, "LCP is a text element").not.toMatch(/^(IMG|VIDEO|svg)$/i)
    expect(lcp.inMain, "LCP is page content").toBe(true)
    expect(
      lcp.bottom,
      `LCP "${lcp.text}" sits above the fold`
    ).toBeLessThanOrEqual(page.viewportSize()!.height * 1.5)
    if (!lcp.inHeading) {
      // Otherwise it is the story right under the headline.
      const story = HOME.paragraphs[0]
        .map((seg) => seg.text)
        .join("")
        .slice(0, 20)
      expect(lcp.text.startsWith(story), `LCP: "${lcp.text}"`).toBe(true)
    }
  })

  test(`cumulative layout shift stays under ${CLS_BUDGET}`, async ({
    page,
  }) => {
    await installClsObserver(page)
    await page.goto("/")
    await waitForHydration(page)
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    await page.waitForLoadState("load")
    // Two frames after load, so late shifts (fonts, images) are counted.
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r()))
        )
    )
    expect(await getCls(page)).toBeLessThan(CLS_BUDGET)
  })

  test(`JavaScript on / stays under ${JS_BUDGET_KB} KB compressed`, async ({
    page,
  }) => {
    await page.goto("/")
    await page.waitForLoadState("load")
    const loadEnd = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming
      return nav.loadEventEnd
    })
    const scripts = (await getResourceTimings(page)).filter(
      (r) =>
        r.startTime <= loadEnd &&
        (r.initiatorType === "script" || /\.m?js(\?|$)/.test(r.name))
    )
    const bytes = scripts.reduce((n, r) => n + r.transferSize, 0)
    const kb = bytes / 1024
    console.log(
      `JS on /: ${kb.toFixed(1)} KB over ${scripts.length} files (budget ${JS_BUDGET_KB} KB)`
    )
    expect(scripts.length).toBeGreaterThan(0)
    expect(kb).toBeLessThan(JS_BUDGET_KB)
    // The Ask panel is its own chunk, fetched on intent, never at load.
    expect(
      scripts.some((r) => /AskDialog/i.test(r.name)),
      "the Ask panel chunk is not loaded up front"
    ).toBe(false)
  })
})

/**
 * The font swap on a slow phone (2026-11-16). There the web fonts arrive
 * after the first paint, so the text is set first in the metric fallbacks
 * (`app/globals.css`, "Metric fallbacks"; `app/fonts.ts`) and then swapped.
 * With next/font's own fallbacks an opening paragraph wrapped to one more
 * line before the swap and lost it after, and everything under it moved
 * (lab, 412 wide, slow 4G, CPU 4x: `/mentoring` 0.223, `/` 0.103, `/about`
 * at 1350 wide 0.069). The test above cannot see that: unthrottled, the
 * fonts are in before the first paint.
 *
 * So every `.woff2` is held back {@link FONT_DELAY_MS} ms, which makes the
 * fallback paint first on any machine (asserted), on top of the lab's
 * network and CPU throttling (Chromium, through CDP). The assertion is a
 * CLS ceiling, not line positions: a Linux runner sets the fallback in
 * Liberation Sans and Liberation Serif (Arial's and Times New Roman's
 * widths, the same faces). Measured with the measured fallbacks: at most
 * 0.001 on all four on macOS.
 *
 * It runs in the full Chromium build, not in the headless shell the other
 * tests use (`launchFullChromium`, `tests/full-chromium.ts`, has why): in
 * the shell on Linux `/` and `/mentoring` at 412 wide rewrapped and failed
 * (0.105, 0.226); in full Chromium all four pass on Linux too.
 */
const SWAP_CLS_BUDGET = 0.03
const FONT_DELAY_MS = 1500
const SWAP_CASES = [
  { path: "/", width: 412 },
  { path: "/mentoring", width: 412 },
  { path: "/about", width: 412 },
  { path: "/about", width: 1350 },
] as const

test.describe("the font swap moves nothing (throttled)", () => {
  for (const { path, width } of SWAP_CASES) {
    test(`${path} at ${width} wide: CLS through the swap under ${SWAP_CLS_BUDGET}`, async ({
      playwright,
      browserName,
      baseURL,
    }) => {
      test.skip(browserName !== "chromium", "throttling goes through CDP")
      test.setTimeout(120_000)
      const phone = width < 1000
      // Full Chromium, not the headless shell: see above.
      const browser = await launchFullChromium(playwright.chromium)
      const context = await browser.newContext({
        baseURL,
        viewport: { width, height: phone ? 823 : 900 },
        deviceScaleFactor: phone ? 1.75 : 1,
        isMobile: phone,
        hasTouch: phone,
      })
      try {
        const page = await context.newPage()
        const cdp = await context.newCDPSession(page)
        await cdp.send("Network.enable")
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 562.5,
          downloadThroughput: (1.4744 * 1024 * 1024 * 0.9) / 8,
          uploadThroughput: (675 * 1024 * 0.9) / 8,
        })
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
        await page.route(/\.woff2(\?|$)/, async (route) => {
          await new Promise((r) => setTimeout(r, FONT_DELAY_MS))
          await route.continue()
        })
        await installClsObserver(page)
        await page.goto(path, { waitUntil: "load", timeout: 90_000 })
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
        await page.evaluate(
          () =>
            new Promise<void>((r) =>
              requestAnimationFrame(() =>
                requestAnimationFrame(() => setTimeout(r, 500))
              )
            )
        )
        const order = await page.evaluate(() => {
          const fcp = performance.getEntriesByName("first-contentful-paint")[0]
          const fonts = (
            performance.getEntriesByType(
              "resource"
            ) as PerformanceResourceTiming[]
          ).filter((r) => /\.woff2(\?|$)/.test(r.name))
          return {
            fcp: fcp?.startTime ?? Infinity,
            firstFont: Math.min(...fonts.map((r) => r.responseEnd)),
          }
        })
        expect(
          order.fcp,
          "the fallback paints before any web font arrives"
        ).toBeLessThan(order.firstFont)
        const cls = await getCls(page)
        console.log(`font swap on ${path} at ${width}: CLS ${cls.toFixed(4)}`)
        expect(cls).toBeLessThan(SWAP_CLS_BUDGET)
      } finally {
        await browser.close()
      }
    })
  }
})

/**
 * A case study (`/work/studenti-rs`: two clips, seven diagrams, the most
 * client code of the nine): no layout shift as the squares, the posters and
 * the panel's progress line come in, and its JavaScript up to load within
 * {@link STORY_JS_BUDGET_KB} KB compressed (196.5 KB measured on 2026-11-12, plus
 * about 15 percent).
 */
const STORY = "/work/studenti-rs"
const STORY_JS_BUDGET_KB = 226

test.describe(`${STORY} budgets`, () => {
  test(`cumulative layout shift stays under ${CLS_BUDGET}`, async ({
    page,
  }) => {
    await installClsObserver(page)
    await page.goto(STORY)
    await waitForHydration(page)
    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    await page.waitForLoadState("load")
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r()))
        )
    )
    expect(await getCls(page)).toBeLessThan(CLS_BUDGET)
  })

  test(`JavaScript stays under ${STORY_JS_BUDGET_KB} KB compressed`, async ({
    page,
  }) => {
    await page.goto(STORY)
    await page.waitForLoadState("load")
    const loadEnd = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming
      return nav.loadEventEnd
    })
    const scripts = (await getResourceTimings(page)).filter(
      (r) =>
        r.startTime <= loadEnd &&
        (r.initiatorType === "script" || /\.m?js(\?|$)/.test(r.name))
    )
    const kb = scripts.reduce((n, r) => n + r.transferSize, 0) / 1024
    console.log(
      `JS on ${STORY}: ${kb.toFixed(1)} KB over ${scripts.length} files (budget ${STORY_JS_BUDGET_KB} KB)`
    )
    expect(kb).toBeLessThan(STORY_JS_BUDGET_KB)
  })
})
