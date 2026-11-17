import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test"
import matter from "gray-matter"

import { ASK } from "@/content/ask"
import { HOME } from "@/content/pages/home"
import { PRODUCTS } from "@/content/products"
import { TESTIMONIALS } from "@/content/testimonials"

/**
 * Shared helpers for the 2027 e2e harness. Copy and data come from
 * `content/**` (the site's source of truth), so a copy change does not need a
 * test change. Only `@playwright/test` and `@axe-core/playwright` are used.
 */

/* -------------------------------------------------------------------------- */
/* The site map                                                               */
/* -------------------------------------------------------------------------- */

/** The nine case studies with a page of their own (PLAN.md §1, plus Panciona, HEGIAS and WolkAbout). */
export const STORY_SLUGS = [
  "tenderlift",
  "studenti-rs",
  "fontalternatives",
  "zarez",
  "panciona",
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
] as const

/**
 * The pages without the site's chrome: `/cv` is only the CV (owner, 17 Nov
 * 2026), with its own top row (Close CV, Download PDF), no Ask, no name in
 * the header and no site footer. Specs about that chrome skip it.
 */
export const BARE_PAGES: readonly string[] = ["/cv"]

/** Every real HTML page, in sitemap order. */
export const PAGES = [
  "/",
  "/work",
  "/mentoring",
  "/about",
  "/cv",
  "/press",
  ...STORY_SLUGS.map((s) => `/work/${s}`),
] as const

/* -------------------------------------------------------------------------- */
/* Story columns, from content                                                */
/* -------------------------------------------------------------------------- */

export interface StoryColumnItem {
  kind: "image" | "clip" | "diagram"
  src?: string
  poster?: string
}

/**
 * The squares of a story, read from its front matter
 * (`content/work/<slug>.mdx`, `column`), so a change of pictures needs no
 * test change.
 */
export function storyColumn(slug: string): StoryColumnItem[] {
  const raw = readFileSync(
    join(process.cwd(), "content", "work", `${slug}.mdx`),
    "utf8"
  )
  return (matter(raw).data.column ?? []) as StoryColumnItem[]
}

export interface StoryLink {
  title: string
  href: string
  icon?: string
}

/** The links in a story's panel (`panel.links.items`), from its front matter. */
export function storyLinks(slug: string): StoryLink[] {
  const raw = readFileSync(
    join(process.cwd(), "content", "work", `${slug}.mdx`),
    "utf8"
  )
  return (matter(raw).data.panel?.links?.items ?? []) as StoryLink[]
}

/** A bracketed, upper-case stand-in such as `[YEAR]` or `[SITE NAME]`. */
export const PLACEHOLDER_RE = /\[[A-Z][A-Z0-9 ·:.,'’/_…-]{2,}\](?!\()/

/** The landing's list ("Stuff I've put real time into"), shared with `/work`. */
export const LIST = HOME.list

/** Rows in the complete list (17 at the time of writing). */
export const LIST_ROWS = LIST.groups.reduce((n, g) => n + g.rows.length, 0)

/** Rows the landing shows before "Show all". */
export const LIST_VISIBLE = LIST.groups.reduce(
  (n, g) => n + Math.min(g.visible, g.rows.length),
  0
)

/**
 * A project's links on `/` as content defines them (owner, 13 Nov 2026):
 * "Case study" from the product's `story`, "Website" from its `url`, with
 * the accessible names from `HOME.actions`. `name` is the name the surface
 * shows ("ZF" for the EVO Touch card).
 */
export function projectLinks(ref: string, name: string) {
  const product = PRODUCTS.find((p) => p.slug === ref)
  const a = HOME.actions
  const fill = (t: string, domain = "") =>
    t.replaceAll("{name}", name).replaceAll("{domain}", domain)
  const domain = product?.url
    ? new URL(product.url).hostname.replace(/^www\./, "")
    : ""
  return {
    caseStudy: product?.story
      ? {
          href: `/work/${product.story}`,
          name: fill(a.caseStudyName),
          rowName: fill(a.rowCaseStudyName),
        }
      : undefined,
    website: product?.url
      ? {
          href: product.url,
          name: fill(a.websiteName, domain),
          rowName: fill(a.rowWebsiteName, domain),
          domain,
        }
      : undefined,
  }
}

/** Escapes `text` for use inside a RegExp. */
export function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * The "Recent work" scroller's accessible name: one label for pointer
 * devices, another on touch screens.
 */
export const STRIP_REGION = new RegExp(
  `^(${escapeRe(HOME.recentWork.regionLabel)}|${escapeRe(
    HOME.recentWork.regionLabelTouch
  )})$`
)

/** "Show all 17" / "Show fewer": the same button, either label. */
export const LIST_TOGGLE = new RegExp(
  `^(${escapeRe(LIST.showAllLabel)}|${escapeRe(LIST.showFewerLabel)})$`
)

/** The headline's pause / play button, either label. */
export const HEADLINE_TOGGLE = new RegExp(
  `^(${escapeRe(HOME.headline.pauseLabel)}|${escapeRe(
    HOME.headline.playLabel
  )})$`
)

/** Every testimonial quote, the one place an em dash is allowed. */
export const TESTIMONIAL_QUOTES = TESTIMONIALS.map((t) => t.quote)

/* -------------------------------------------------------------------------- */
/* Page-settled waits                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The Ask button is the island every page hydrates: it is a link to
 * `#contact` in the server HTML and becomes a button once React runs. Its
 * swap is the cheapest reliable "this page is interactive" signal.
 */
export async function waitForHydration(page: Page): Promise<void> {
  // A page with its own top row (`/cv`) has no Ask: its close control is
  // the client island, hydrated once React has attached its props.
  if (await page.locator("header#top[data-ends]").count()) {
    await page.waitForFunction(() => {
      const el = document.querySelector("header#top .site-top__close")
      return !!el && Object.keys(el).some((k) => k.startsWith("__reactProps"))
    })
    return
  }
  await expect(
    page.getByRole("banner").getByRole("button", { name: ASK.ariaOpen })
  ).toBeVisible()
}

/** Navigate and wait until the page is interactive and its fonts are in. */
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitForHydration(page)
  await page
    .evaluate(() => document.fonts?.ready?.then(() => undefined))
    .catch(() => {})
}

/* -------------------------------------------------------------------------- */
/* Moving parts                                                               */
/* -------------------------------------------------------------------------- */

/** The last synthetic timestamp sent, so successive drags never go back. */
let lastDragTs = 0

/**
 * A mouse drag of `dx` from (`x`, `y`) with fixed timing, for the rails
 * (`useRail`): `steps` moves `stepMs` apart, then the release `hold` ms
 * after the last move, sent with explicit timestamps through CDP
 * (`Input.dispatchMouseEvent`), which Chromium hands to the page as the
 * events' `timeStamp`. A rail tells a flick from a slow drag by those
 * timestamps. Playwright's own `mouse.move` steps carry wall-clock time, and
 * on a busy machine (a full parallel run) a "quick" 300px drag arrived at
 * 0.2 px/ms or was released 100+ ms after its last move (measured 16 Nov
 * 2026), which a rail rightly treats as a slow drag. Chromium only.
 */
export async function timedDrag(
  page: Page,
  x: number,
  y: number,
  dx: number,
  {
    steps = 12,
    stepMs = 16,
    hold = 0,
  }: { steps?: number; stepMs?: number; hold?: number } = {}
): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  const t0 = Math.max(Date.now() / 1000, lastDragTs + 0.05)
  const at = (ms: number) => (lastDragTs = t0 + ms / 1000)
  const send = (
    type: "mousePressed" | "mouseMoved" | "mouseReleased",
    px: number,
    ms: number
  ) =>
    cdp.send("Input.dispatchMouseEvent", {
      type,
      x: px,
      y,
      button: "left",
      buttons: type === "mouseReleased" ? 0 : 1,
      clickCount: type === "mouseMoved" ? 0 : 1,
      timestamp: at(ms),
    })
  await send("mouseMoved", x, 0)
  await send("mousePressed", x, 0)
  for (let i = 1; i <= steps; i++)
    await send("mouseMoved", x + (dx * i) / steps, i * stepMs)
  await send("mouseReleased", x + dx, steps * stepMs + hold)
  await cdp.detach()
}

/**
 * A finger's swipe of (`dx`, `dy`) from (`x`, `y`) at `speed` px/s: a
 * touchstart, moves a frame (`stepMs`) apart, then the lift. By default the
 * finger rests `hold` ms before it lifts, so nothing flings, which is what
 * `Input.synthesizeScrollGesture` did (its `preventFling` defaults to true);
 * with `fling` it lifts on the last move, at `speed`. Sent through CDP
 * (`Input.dispatchTouchEvent`) with explicit timestamps, which Chromium's
 * gesture detector reads for the release velocity, so the swipe is the same
 * on a busy machine.
 *
 * Not `Input.synthesizeScrollGesture`: on Linux (headless shell and full
 * Chromium 158 alike) that gesture sends a touchstart and a touchend but no
 * touchmove, so nothing scrolls, not even a plain overflow box on a blank
 * page; the same probe scrolls on macOS (measured 16 Nov 2026, the first CI
 * run). Chromium only.
 */
export async function touchSwipe(
  page: Page,
  x: number,
  y: number,
  dx: number,
  dy: number,
  speed: number,
  {
    stepMs = 16,
    hold = 100,
    fling = false,
  }: { stepMs?: number; hold?: number; fling?: boolean } = {}
): Promise<void> {
  const cdp = await page.context().newCDPSession(page)
  const duration = (Math.hypot(dx, dy) / speed) * 1000
  const steps = Math.max(3, Math.ceil(duration / stepMs))
  const t0 = Math.max(Date.now() / 1000, lastDragTs + 0.05)
  const at = (ms: number) => (lastDragTs = t0 + ms / 1000)
  const point = (i: number) => [
    { x: x + (dx * i) / steps, y: y + (dy * i) / steps },
  ]
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(0),
    timestamp: at(0),
  })
  for (let i = 1; i <= steps; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(i),
      timestamp: at((duration * i) / steps),
    })
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
    timestamp: at(duration + (fling ? 0 : hold)),
  })
  await cdp.detach()
}

/**
 * The headline's swapping line: the `aria-hidden` last child of the `<h1>`
 * (the `<h1>` itself carries the full sentence for assistive tech). Its text
 * changes whenever the phrase on show changes.
 */
export function headlineSlot(page: Page): Locator {
  return page.locator("#headline h1 > [aria-hidden='true']").last()
}

/** The footer station clock's second hand (the clock's last hand group). */
export function secondHand(page: Page): Locator {
  return page
    .getByRole("contentinfo")
    .getByRole("img", { name: /^Time in / })
    .locator(":scope > g")
    .last()
}

/**
 * The finite, time-based CSS keyframe animations running inside `root`
 * (transitions are left out: they are the cards settling, not a timer).
 */
export async function runningAnimations(root: Locator): Promise<number> {
  return root.evaluate(
    (el) =>
      el
        .getAnimations({ subtree: true })
        .filter(
          (a) =>
            a instanceof CSSAnimation &&
            a.playState === "running" &&
            a.timeline === document.timeline &&
            a.effect?.getComputedTiming().iterations !== Infinity
        ).length
  )
}

/** Jumps every finite, time-based keyframe animation in `root` to its end. */
export async function finishAnimations(root: Locator): Promise<void> {
  await root.evaluate((el) => {
    for (const a of el.getAnimations({ subtree: true }))
      if (
        a instanceof CSSAnimation &&
        a.timeline === document.timeline &&
        a.effect?.getComputedTiming().iterations !== Infinity
      )
        a.finish()
  })
}

/** A fixed wall-clock time a few seconds into a minute, for fake clocks. */
export const FIXED_TIME = new Date("2026-11-11T10:00:05+01:00")

/* -------------------------------------------------------------------------- */
/* Console errors                                                             */
/* -------------------------------------------------------------------------- */

export interface ConsoleErrorCollector {
  /** Mutated in place as errors arrive. */
  errors: string[]
}

/** Collects `console.error` and uncaught page errors. Attach before `goto`. */
export function collectConsoleErrors(page: Page): ConsoleErrorCollector {
  const collector: ConsoleErrorCollector = { errors: [] }
  page.on("console", (msg) => {
    if (msg.type() === "error") collector.errors.push(msg.text())
  })
  page.on("pageerror", (err) => collector.errors.push(err.message))
  return collector
}

/* -------------------------------------------------------------------------- */
/* Sitemap and machine outputs                                                */
/* -------------------------------------------------------------------------- */

/** Every `<loc>` in `/sitemap.xml`, as pathnames. */
export async function readSitemapPaths(
  request: APIRequestContext
): Promise<string[]> {
  const res = await request.get("/sitemap.xml")
  if (!res.ok()) throw new Error(`GET /sitemap.xml returned ${res.status()}`)
  const body = await res.text()
  return [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1].trim()).pathname
  )
}

/** The text of every `application/ld+json` block on the current page. */
export async function readJsonLdBlocks(page: Page): Promise<string[]> {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) => els.map((e) => e.textContent ?? ""))
}

/** Flattens JSON-LD (arrays, `@graph`) into its nodes. */
export function jsonLdNodes(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(jsonLdNodes)
  if (value && typeof value === "object") {
    const node = value as Record<string, unknown>
    const graph = node["@graph"]
    return graph ? [node, ...jsonLdNodes(graph)] : [node]
  }
  return []
}

/** True when a node's `@type` is `type` (or includes it). */
export function hasType(node: Record<string, unknown>, type: string): boolean {
  const t = node["@type"]
  return Array.isArray(t) ? t.includes(type) : t === type
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/** True when the document scrolls sideways. */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1
  )
}

/* -------------------------------------------------------------------------- */
/* Performance observers (budgets.spec.ts)                                    */
/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    __e2eCls?: number
    __e2eLcp?: {
      startTime: number
      size: number
      url: string
      tag: string
      inHeading: boolean
      inMain: boolean
      /** Bottom edge of the element, in CSS px from the top of the page. */
      bottom: number
      text: string
    } | null
  }
}

/** Accumulates layout shifts not caused by input. Call before `goto`. */
export async function installClsObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__e2eCls = 0
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          hadRecentInput: boolean
          value: number
        }[]) {
          if (!entry.hadRecentInput)
            window.__e2eCls = (window.__e2eCls ?? 0) + entry.value
        }
      }).observe({ type: "layout-shift", buffered: true })
    } catch {
      // Not supported in this engine; leave it at 0.
    }
  })
}

export async function getCls(page: Page): Promise<number> {
  return page.evaluate(() => window.__e2eCls ?? 0)
}

/** Records the latest LCP candidate and what element it is. */
export async function installLcpObserver(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__e2eLcp = null
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as unknown as {
          startTime: number
          size: number
          url: string
          element: Element | null
        }[]
        const last = entries[entries.length - 1]
        if (!last) return
        window.__e2eLcp = {
          startTime: last.startTime,
          size: last.size,
          url: last.url,
          tag: last.element?.tagName ?? "",
          inHeading: !!last.element?.closest("h1"),
          inMain: !!last.element?.closest("main"),
          bottom: last.element
            ? last.element.getBoundingClientRect().bottom + window.scrollY
            : 0,
          text: (last.element?.textContent ?? "").trim().slice(0, 80),
        }
      }).observe({ type: "largest-contentful-paint", buffered: true })
    } catch {
      // Not supported in this engine.
    }
  })
}

export async function getLcp(page: Page) {
  return page.evaluate(() => window.__e2eLcp ?? null)
}

export interface ResourceTiming {
  name: string
  startTime: number
  /** Compressed bytes over the wire; 0 for cached or opaque responses. */
  transferSize: number
  initiatorType: string
}

/** All resource timing entries recorded so far. */
export async function getResourceTimings(
  page: Page
): Promise<ResourceTiming[]> {
  return page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => {
      const r = entry as PerformanceResourceTiming
      return {
        name: r.name,
        startTime: r.startTime,
        transferSize: r.transferSize,
        initiatorType: r.initiatorType,
      }
    })
  )
}
