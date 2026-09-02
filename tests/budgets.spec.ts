import { expect, test } from "@playwright/test"

import {
  getLcp,
  getResourceTimings,
  installLcpObserver,
  waitForRouteReady,
  type ResourceTiming,
} from "./helpers"

/**
 * Performance budgets — docs/v3-redesign-plan.md §9.
 *
 * WHAT "SHELL JS" MEANS HERE
 * The shell is exactly the set of `<script src>` tags in the prerendered HTML
 * of `/`: the JavaScript the browser must fetch to hydrate the homepage. It is
 * read from the document itself rather than inferred from timings, because the
 * old "everything requested before LCP + 50 ms" rule swept in whatever the
 * router happened to prefetch in that window — the `/work` and `/work/[slug]`
 * route chunks land around 100 ms, so the same build measured 176 KB or
 * 198 KB depending on whether LCP came in at 48 ms or 64 ms. Prefetch is not
 * initial route JS; it is the router buying the *next* navigation, after this
 * page is interactive.
 *
 * THE 200 KB THRESHOLD
 * §9 wrote 120 KB gz before Next 16 existed. It cannot be met by any Next 16
 * page: react-dom alone is 70 KB gz here and the React + App Router client
 * runtime another 45 KB, so an empty Next 16.3 / React 19.2 route starts at
 * roughly 155 KB gz. Measured composition of `/` (transferSize, gzip, prod
 * build at the commit that introduced this threshold):
 *
 *   70.2 KB  react-dom + scheduler
 *   44.6 KB  React + App Router client runtime
 *   16.3 KB  homepage islands — hero canvas gate, timeline rail, preloader
 *   11.3 KB  App Router internals (segment cache, prefetch)
 *    8.1 KB  site chrome islands + fathom-client + @vercel/speed-insights
 *    7.8 KB  Next error boundaries / bootstrap
 *    4.5 KB  Turbopack runtime
 *    4.0 KB  router BFCache
 *    3.4 KB  Paper Shaders mount stub + WebGL2 probe (via `app/not-found.tsx`,
 *            which is in every route's graph; the 260 KB library is not)
 *    2.9 KB  two small runtime chunks
 *   ------
 *  173.1 KB  total
 *
 * 200 KB is that plus ~15% headroom, which is a real budget: the next thing
 * that lands in the initial graph by accident — a barrel import that drags a
 * client component in, a library that forgets to be dynamic — shows up here
 * before it ships. Everything genuinely optional is already out: three/r3f
 * (232 KB, lazy, after LCP), @paper-design/shaders-react (260 KB raw, dynamic),
 * the Pong easter egg (4 KB, `lazy()`), the `@oddbird/css-anchor-positioning`
 * polyfill (116 KB raw, imported only when `CSS.supports` says no) and the
 * `Dialog` primitive (lightbox-only). Raise this number only with a measured
 * reason written down next to it.
 *
 * Fonts: ≤ 140 KB total / 3 preloads (checked here as ≤ 4 requested files,
 * generously covering the non-preloaded 4th face — §5.5), no Google Fonts.
 *
 * Soft assertions throughout so every number lands in the report even when one
 * budget is blown.
 */

/** Initial route JS on `/`, gzip transfer bytes. See the note above. */
const SHELL_JS_BUDGET = 200 * 1024

/** Anything this big that is not a document script is the three.js scene. */
const LAZY_CHUNK_MIN = 100 * 1024

test("JS shell transfer, three.js-after-LCP, and font-file budgets on /", async ({
  page,
  request,
  baseURL,
}) => {
  /*
   * The shell set comes from the raw HTML, fetched separately from the
   * navigation so no client-side script insertion can pollute it.
   */
  const documentHtml = await (await request.get(`${baseURL}/`)).text()
  const documentScripts = new Set(
    [...documentHtml.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1])
  )
  expect(
    documentScripts.size,
    "the prerendered / document references at least one script"
  ).toBeGreaterThan(0)

  await installLcpObserver(page)

  const fontUrls: string[] = []
  page.on("response", (res) => {
    if (res.request().resourceType() === "font") fontUrls.push(res.url())
  })

  await page.goto("/")
  await waitForRouteReady(page)
  // The hero canvas waits for fonts + idle + the preloader before it imports
  // three.js; give that chain time to finish before reading the timeline.
  await page.waitForTimeout(3_000)

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
  const inDocument = (r: ResourceTiming) =>
    documentScripts.has(new URL(r.name).pathname)

  const shellJs = jsResources.filter(inDocument)
  const otherJs = jsResources.filter((r) => !inDocument(r))
  const shellJsBytes = shellJs.reduce((sum, r) => sum + r.transferSize, 0)

  test.info().annotations.push({
    type: "budget:js-shell",
    description: `${(shellJsBytes / 1024).toFixed(1)} KB gz across ${shellJs.length} document script(s); ${otherJs.length} further chunk(s) totalling ${(
      otherJs.reduce((sum, r) => sum + r.transferSize, 0) / 1024
    ).toFixed(1)} KB were dynamic imports or router prefetches`,
  })
  test.info().annotations.push({
    type: "budget:js-shell-detail",
    description: shellJs
      .map(
        (r) =>
          `${(r.transferSize / 1024).toFixed(1)} KB ${new URL(r.name).pathname}`
      )
      .join(", "),
  })
  expect
    .soft(
      shellJsBytes,
      `shell JS transfer should be <= ${SHELL_JS_BUDGET / 1024} KB gz on first load, measured ${(shellJsBytes / 1024).toFixed(1)} KB`
    )
    .toBeLessThanOrEqual(SHELL_JS_BUDGET)

  const lcp = await getLcp(page)
  test.info().annotations.push({
    type: "budget:lcp",
    description: lcp
      ? `LCP candidate at ${lcp.startTime.toFixed(0)}ms`
      : "no largest-contentful-paint entry observed",
  })

  const threeResources = otherJs.filter((r) => r.transferSize >= LAZY_CHUNK_MIN)
  test.info().annotations.push({
    type: "budget:three-chunk",
    description:
      threeResources.length === 0
        ? "no three.js chunk requested — reduced motion, no WebGL2, or the hero canvas is not built"
        : threeResources
            .map(
              (r) =>
                `${(r.transferSize / 1024).toFixed(1)} KB gz at ${r.startTime.toFixed(0)}ms`
            )
            .join(", "),
  })

  if (threeResources.length > 0 && lcp) {
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
