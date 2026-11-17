import { expect, test, type Page } from "@playwright/test"

import { gotoReady } from "./helpers"

/**
 * One header (owner, 12 Nov; and 16 Nov 2026: "header position height is
 * not the same across homepage+case study page"): every page's header, the
 * top block and a case study's bar alike, puts its left end and the Ask
 * button at the same place, at the same height, at every width. The left
 * end's first line (the name, or "All work") is centred on Ask. On every
 * page but `/` it is a way back whose arrow's tip sits on the column's edge,
 * where the name starts on `/` (the owner's correction of the story bar,
 * 16 Nov 2026, applied to every header); its target reaches into the
 * gutter. One exception, wider than 1100px, where a story has its wide
 * frame: the bar keeps the header's height and top, but its arrow's tip and
 * Ask's edge sit on the cover's edges.
 *
 * Reduced motion keeps the paper sheet from receding as the footer comes
 * into view (short pages like the 404 show the footer at once), so the boxes
 * are layout, not a frame of that animation.
 */

const PAGES = [
  "/",
  "/work",
  "/mentoring",
  "/about",
  "/press",
  "/this-page-does-not-exist",
  "/work/tenderlift",
  "/work/shopify",
]

/** The header's boxes: the left end, its first line of text, the arrow, Ask. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header#top")!
    const id = header.querySelector("[data-top-id]")!.getBoundingClientRect()
    const name = header.querySelector(".site-top__name")!
    const walker = document.createTreeWalker(name, NodeFilter.SHOW_TEXT)
    let node: Node | null
    let text: DOMRect | null = null
    while ((node = walker.nextNode()))
      if (node.textContent?.trim()) {
        const range = document.createRange()
        range.selectNodeContents(node)
        text = range.getBoundingClientRect()
        break
      }
    const head = header.querySelector(".site-top__arrow .ico-head")
    const ask = header.querySelector(".ask-btn")!.getBoundingClientRect()
    const link = name.getBoundingClientRect()
    const cover = document
      .querySelector(".cs-cover-in")
      ?.getBoundingClientRect()
    const r = (n: number) => Math.round(n * 2) / 2
    return {
      cover: cover ? [cover.left, cover.right] : null,
      askRight: ask.right,
      id: [r(id.x), r(id.y + scrollY)],
      ask: [r(ask.x), r(ask.y + scrollY), r(ask.width), r(ask.height)],
      textX: text!.x,
      textMid: text!.y + text!.height / 2,
      askMid: ask.y + ask.height / 2,
      // The head's point, less the mitre's reach past it (half the 1.5px
      // stroke over sin 45°): the arrow's visible tip.
      tip: head ? head.getBoundingClientRect().left - 0.75 * Math.SQRT2 : null,
      linkLeft: link.left,
      linkH: link.height,
    }
  })
}

for (const width of [360, 390, 768, 1440]) {
  test(`at ${width}: every header's ends at one place, story bars too`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width, height: 900 })
    const boxes: Record<string, Awaited<ReturnType<typeof measure>>> = {}
    for (const path of PAGES) {
      await gotoReady(page, path)
      boxes[path] = await measure(page)
    }
    const home = boxes["/"]
    // The column's edge: where the name starts on `/`.
    const edge = home.textX
    expect(home.ask[1], "Ask's top").toBe(width > 720 ? 64 : 32)
    const wide = width > 1100
    for (const path of PAGES) {
      const m = boxes[path]
      const say = (what: string) => `${path} at ${width}: ${what}`
      if (wide && m.cover) {
        // The story's wide frame: the same top and size, the cover's edges.
        expect(m.ask.slice(1), say("Ask's top and size")).toEqual(
          home.ask.slice(1)
        )
        expect(m.id[1], say("left end's top")).toBe(home.id[1])
        expect(
          Math.abs(m.tip! - m.cover[0]),
          say("the arrow's tip on the cover's left edge")
        ).toBeLessThanOrEqual(1)
        expect(
          Math.abs(m.askRight - m.cover[1]),
          say("Ask's edge on the cover's right edge")
        ).toBeLessThanOrEqual(1)
        expect(
          Math.abs(m.textMid - m.askMid),
          say("the first line centred on Ask")
        ).toBeLessThanOrEqual(1)
        continue
      }
      expect(m.ask, say("Ask box")).toEqual(home.ask)
      expect(m.id, say("left end's box")).toEqual(home.id)
      expect(
        Math.abs(m.textMid - m.askMid),
        say("the first line centred on Ask")
      ).toBeLessThanOrEqual(1)
      if (path === "/") {
        expect(m.tip, say("no arrow")).toBeNull()
        continue
      }
      expect(
        Math.abs(m.tip! - edge),
        say("the arrow's tip on the edge")
      ).toBeLessThanOrEqual(1)
      expect(m.textX, say("the words after the arrow")).toBeGreaterThan(
        edge + 12
      )
      // The target reaches into the gutter, the arrow does not.
      expect(m.linkLeft, say("the target in the gutter")).toBeLessThan(
        m.tip! - 12
      )
      expect(m.linkH, say("the target's height")).toBeGreaterThanOrEqual(
        width > 720 ? 43 : 44
      )
    }
    // Every way back draws its arrow at the same place (the stories apart,
    // wider than 1100px). `/cv` has no way back of this kind: its top row
    // is Close CV and Download PDF (`tests/cv.spec.ts`).
    const tips = PAGES.slice(1)
      .filter((p) => !(wide && boxes[p].cover))
      .map((p) => Math.round(boxes[p].tip! * 2) / 2)
    expect(new Set(tips).size, JSON.stringify(tips)).toBe(1)
  })
}

/**
 * Phones (owner, 16 Nov 2026: three rows beside the button "isnt the
 * prettiest header for mobile"): two rows at most, down to 360. The name on
 * one line, centred on the compact Ask button (at least 44px tall) in the
 * first row; the line under it on the whole width of the second, never
 * beside the button. On an inner page the back link's target is the whole
 * gutter and the name, and the arrow sits on the gutter, as far in as Ask.
 */
for (const width of [390, 360]) {
  test(`the phone header is two rows at ${width}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width, height: 844 })
    for (const path of ["/", "/about", "/work", "/mentoring", "/press"]) {
      await gotoReady(page, path)
      const m = await page.evaluate(() => {
        /** Distinct line tops of an element's text. */
        const lines = (el: Element) => {
          const tops = new Set<number>()
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          let node: Node | null
          while ((node = walker.nextNode())) {
            if (!node.textContent?.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const r of range.getClientRects()) tops.add(Math.round(r.top))
          }
          return tops.size
        }
        const box = (sel: string) =>
          document.querySelector(sel)!.getBoundingClientRect()
        const name = document.querySelector(".site-top__name")!
        const ask = box(".site-top__ask .ask-btn")
        const line = box(".site-top__line")
        const link = name.getBoundingClientRect()
        const head = document.querySelector(".site-top__arrow .ico-head")
        return {
          nameLines: lines(name),
          lineLines: lines(document.querySelector(".site-top__line")!),
          askH: ask.height,
          askRight: Math.round(ask.right),
          lineTop: line.top,
          askBottom: ask.bottom,
          tip: head
            ? Math.round(head.getBoundingClientRect().left - 0.75 * Math.SQRT2)
            : null,
          linkLeft: Math.round(link.left),
          linkH: link.height,
          top: box(".site-top").height,
        }
      })
      expect(m.nameLines, `${path}: the name on one line`).toBe(1)
      expect(m.lineLines, `${path}: the line on one line`).toBe(1)
      expect(m.askH, `${path}: Ask is a 44px target`).toBeGreaterThanOrEqual(44)
      expect(m.askRight, `${path}: Ask at the right gutter`).toBe(width - 24)
      expect(
        m.lineTop,
        `${path}: the line is under the button, not beside it`
      ).toBeGreaterThanOrEqual(m.askBottom)
      expect(m.top, `${path}: two rows`).toBeLessThanOrEqual(m.askH + 34)
      if (path !== "/") {
        expect(
          m.tip,
          `${path}: the arrow on the gutter, as far in as Ask`
        ).toBe(24)
        expect(m.linkLeft, `${path}: the back target from the edge`).toBe(0)
        expect(
          m.linkH,
          `${path}: the back target is 44px tall`
        ).toBeGreaterThanOrEqual(44)
      }
    }
  })
}
