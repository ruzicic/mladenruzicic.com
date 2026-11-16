import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

import { DIAGRAMS } from "@/content/diagrams"

import { gotoReady } from "./helpers"

/**
 * The case-study diagrams (app/components/diagram, docs/v4-build/DIAGRAMS.md).
 *
 * Where they are checked depends on the server:
 *
 * - Against `next dev` (the default, or `PLAYWRIGHT_BASE_URL` pointing at a
 *   dev server): on the specimen sheet `/dev/diagrams`, which shows every
 *   diagram in a 752px, a 358px and a 342px square (the column on a 390px
 *   phone).
 * - Against a production build (`CI` or `PLAYWRIGHT_PROD=1`): the specimen
 *   is the site's 404 there, so the same checks run on the story pages, on
 *   whichever diagrams the stories place, at desktop (752) and at a 390px
 *   phone (the column square). A diagram no story places yet is reported in
 *   the test's annotations, not failed.
 */

const PROD = !!process.env.CI || !!process.env.PLAYWRIGHT_PROD
const IDS = [...DIAGRAMS.keys()]
const STORY_PAGES = ["/work/studenti-rs", "/work/hegias", "/work/tenderlift"]
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"]

/** The specimen has no site frame, so it waits for its fonts, not for the header. */
async function openSpecimen(page: Page) {
  await page.goto("/dev/diagrams")
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}

/** Every diagram on the specimen, in the square of the given size. */
async function collect(
  page: Page,
  width: 752 | 358 | 342
): Promise<{ id: string; root: Locator }[]> {
  await openSpecimen(page)
  return IDS.map((id) => ({
    id,
    root: page.locator(
      `[data-specimen="${id}"] [data-size="${width}"] [data-dg]`
    ),
  }))
}

/** Measures one rendered diagram: what leaves the square, clipped node text, the smallest type. */
async function measure(root: Locator) {
  return root.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const problems: string[] = []
    let minFont = Infinity
    const hidden = (n: Element) => {
      const cs = getComputedStyle(n)
      return (
        cs.display === "none" ||
        cs.visibility === "hidden" ||
        cs.opacity === "0" ||
        cs.clipPath === "inset(50%)" ||
        !!n.closest(".dg-sr") ||
        (!!n.closest("svg") && n.tagName.toLowerCase() !== "svg")
      )
    }
    for (const n of el.querySelectorAll("*")) {
      if (hidden(n)) continue
      const b = n.getBoundingClientRect()
      if (!b.width && !b.height) continue
      const name = `${n.tagName.toLowerCase()}.${n.getAttribute("class") ?? ""}`
      if (
        b.left < r.left - 0.5 ||
        b.top < r.top - 0.5 ||
        b.right > r.right + 0.5 ||
        b.bottom > r.bottom + 0.5
      ) {
        problems.push(`outside the square: ${name}`)
      }
      const text = [...n.childNodes].some(
        (c) => c.nodeType === 3 && c.textContent?.trim()
      )
      if (text) {
        minFont = Math.min(minFont, parseFloat(getComputedStyle(n).fontSize))
        if (
          getComputedStyle(n).overflow !== "visible" &&
          n.scrollWidth > n.clientWidth + 1
        ) {
          problems.push(`clipped text: ${n.textContent?.slice(0, 40)}`)
        }
      }
    }
    // Flowchart boxes: the words stay inside their box or exit.
    for (const node of el.querySelectorAll(".fc-n, .fc-x")) {
      if (hidden(node)) continue
      const nb = node.getBoundingClientRect()
      for (const t of node.querySelectorAll(".fc-tt, .fc-q")) {
        const tb = t.getBoundingClientRect()
        if (
          tb.top < nb.top ||
          tb.bottom > nb.bottom ||
          tb.left < nb.left ||
          tb.right > nb.right
        ) {
          problems.push(`text outside its box: ${t.textContent}`)
        }
      }
      if (
        node.classList.contains("fc-x") &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        problems.push(`exit label too tall: ${node.textContent}`)
      }
    }
    return {
      problems,
      minFont,
      w: Math.round(r.width),
      h: Math.round(r.height),
    }
  })
}

test.describe("diagrams", () => {
  test.skip(
    PROD,
    "the specimen exists only under next dev; see the production block below"
  )

  test("every diagram renders at both sizes, with its text alternative", async ({
    page,
  }) => {
    for (const width of [752, 358, 342] as const) {
      for (const { id, root } of await collect(page, width)) {
        await expect(root, id).toHaveCount(1)
        await expect(root).toHaveAttribute("role", "group")
        const d = DIAGRAMS.get(id)!
        await expect(root).toHaveAttribute("aria-label", d.title)
        // The full-sentence alternative leads the group, visually hidden.
        await expect(root.locator(".dg-in > .dg-sr").first()).toHaveText(d.alt)
        expect(d.alt.length, `${id} alt`).toBeGreaterThan(60)
        expect(d.alt.trim().endsWith("."), `${id} alt ends a sentence`).toBe(
          true
        )
        expect(d.caption.length, `${id} caption`).toBeGreaterThan(10)
      }
    }
  })

  for (const width of [752, 358, 342] as const) {
    test(`every diagram stays inside its ${width}px square`, async ({
      page,
    }) => {
      for (const { id, root } of await collect(page, width)) {
        const m = await measure(root)
        expect(m.w, id).toBe(width)
        expect(m.h, `${id} is square`).toBe(width)
        expect(m.problems, id).toEqual([])
        if (width < 752)
          expect(
            m.minFont,
            `${id}: smallest type at ${width}`
          ).toBeGreaterThanOrEqual(11)
      }
    })
  }

  test("no open question in brackets is ever rendered", async ({ page }) => {
    for (const { id, root } of await collect(page, 752)) {
      const text = await root.evaluate((el) => el.textContent ?? "")
      expect(text, id).not.toMatch(/\[[A-Z]/)
      expect(text, id).not.toContain("—")
    }
  })

  test("TenderLift and HEGIAS keep to what may be said", async ({ page }) => {
    for (const { id, root } of await collect(page, 752)) {
      const text = await root.evaluate((el) => el.textContent ?? "")
      if (id.startsWith("tenderlift/")) {
        expect(text, id).not.toMatch(/\b(official|verified|complete|every)\b/i)
        expect(text, id).not.toMatch(/%|\bweights?\b|\bfactors?\b/i)
      }
      // AWS may be named since 15 Nov 2026; Blender and Python still not.
      if (id.startsWith("hegias/"))
        expect(text, id).not.toMatch(/Python|Blender/)
      // The search figures (his own estimate, 15 Nov 2026), stated plainly:
      // no label since his note of the same day.
      if (id === "studenti-rs/search") {
        expect(text, id).toContain("1 in 10")
        expect(text, id).toContain("7 in 10")
        expect(text, id).not.toMatch(/my own estimate/i)
        expect(text, id).not.toMatch(/9 in 10/)
      }
    }
  })

  test("the walk runs on screen, and stops when paused or under reduced motion", async ({
    page,
  }) => {
    await openSpecimen(page)
    const root = page.locator(
      '[data-specimen="studenti-rs/submission"] [data-size="752"] [data-dg]'
    )
    await root.scrollIntoViewIfNeeded()
    await expect(root).toHaveAttribute("data-walk", "on")
    const running = () =>
      root.evaluate(
        (el) =>
          [...el.querySelectorAll(".fc-sf, .fc-lit, .fc-dlit")].flatMap((n) =>
            n.getAnimations()
          ).length
      )
    await expect.poll(running).toBeGreaterThan(0)

    // The page's pause control.
    await page.evaluate(
      () => (document.documentElement.dataset.motion = "paused")
    )
    await expect.poll(running).toBe(0)
    await page.evaluate(() => delete document.documentElement.dataset.motion)
    await expect.poll(running).toBeGreaterThan(0)

    // Reduced motion.
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect.poll(running).toBe(0)
    await page.emulateMedia({ reducedMotion: "no-preference" })

    // Off screen, nothing runs.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(root).not.toHaveAttribute("data-walk", "on")
    await expect.poll(running).toBe(0)
  })

  test("without JavaScript the diagrams are complete and still", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false })
    const page = await ctx.newPage()
    await page.goto("/dev/diagrams")
    const roots = page.locator("[data-dg]")
    await expect(roots).toHaveCount(IDS.length * 3)
    const anims = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a instanceof CSSAnimation &&
              (a.effect as KeyframeEffect | null)?.target?.closest("[data-dg]")
          ).length
    )
    expect(anims).toBe(0)
    await ctx.close()
  })

  test("axe passes on the specimen", async ({ page }) => {
    await openSpecimen(page)
    const results = await new AxeBuilder({ page })
      .include("[data-dg]")
      .withTags(TAGS)
      .analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual(
      []
    )
  })
})

test.describe("diagrams in production", () => {
  test.skip(!PROD, "production build only")

  test("the specimen is the site's 404 and is kept from crawlers", async ({
    request,
  }) => {
    const res = await request.get("/dev/diagrams")
    expect(res.status()).toBe(404)
    const robots = await (await request.get("/robots.txt")).text()
    expect(robots).toMatch(/Disallow: \/dev\//)
    const sitemap = await (await request.get("/sitemap.xml")).text()
    expect(sitemap).not.toContain("/dev/")
  })

  for (const [label, viewport, width] of [
    ["desktop", { width: 1440, height: 900 }, 752],
    ["phone", { width: 390, height: 844 }, 358],
  ] as const) {
    test(`diagrams on the stories fit their squares (${label})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      const seen = new Set<string>()
      for (const path of STORY_PAGES) {
        await gotoReady(page, path)
        for (const root of await page.locator("[data-dg]").all()) {
          const id = (await root.getAttribute("data-dg"))!
          seen.add(id)
          const d = DIAGRAMS.get(id)
          expect(d, `${path}: unknown diagram ${id}`).toBeTruthy()
          await root.scrollIntoViewIfNeeded()
          const m = await measure(root)
          expect(m.w, `${id} is square`).toBe(m.h)
          expect(m.problems, `${path} ${id}`).toEqual([])
          if (width === 358)
            expect(
              m.minFont,
              `${id}: smallest type on a phone`
            ).toBeGreaterThanOrEqual(11)
          const text = await root.evaluate((el) => el.textContent ?? "")
          expect(text, id).not.toMatch(/\[[A-Z]/)
          await expect(root.locator(".dg-in > .dg-sr").first()).toHaveText(
            d!.alt
          )
        }
      }
      const missing = IDS.filter((id) => !seen.has(id))
      if (missing.length) {
        test.info().annotations.push({
          type: "not placed on a story yet",
          description: missing.join(", "),
        })
      }
    })
  }

  test("axe passes on the diagrams the stories place", async ({ page }) => {
    for (const path of STORY_PAGES) {
      await gotoReady(page, path)
      if ((await page.locator("[data-dg]").count()) === 0) continue
      const results = await new AxeBuilder({ page })
        .include("[data-dg]")
        .withTags(TAGS)
        .analyze()
      expect(
        results.violations.map((v) => `${path} ${v.id}: ${v.nodes.length}`)
      ).toEqual([])
    }
  })
})
