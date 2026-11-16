import { expect, test } from "@playwright/test"

import { HOME } from "@/content/pages/home"

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
 * - Cumulative layout shift stays under 0.05 through load and settling.
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
