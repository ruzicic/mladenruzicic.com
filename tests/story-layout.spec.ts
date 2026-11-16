import { expect, test, type Page } from "@playwright/test"

import { gotoReady, STORY_SLUGS, storyColumn } from "./helpers"

/**
 * The case-study layout (CaseStudy.dc.html, CaseStudy-Mobile.dc.html), on
 * all nine stories:
 *
 * - At 1440: under the cover, two columns, the panel on the left and the
 *   squares on the right (the first square coming up over the cover's
 *   foot), side by side.
 * - At 390: one column, the first square, the panel's content, then the
 *   other squares, each the width of the page's column.
 * - Every square is a square, and all of a story's squares are the same size.
 * - The panel stays in view under the bar while the column scrolls past,
 *   and never runs into the next-story link or the footer.
 * - Nothing in square brackets is ever on the page (the owner's open
 *   questions are in docs/v4-build/PLACEHOLDERS.md, not on the site).
 */

async function boxes(page: Page) {
  return page.evaluate(() => {
    const r = (el: Element | null) => {
      const b = el!.getBoundingClientRect()
      return { x: b.x, y: b.y, w: b.width, h: b.height, bottom: b.bottom }
    }
    return {
      panel: r(document.querySelector(".cs-panel")),
      lead: r(document.querySelector(".cs-lead")),
      column: r(document.querySelector(".cs-column")),
      squares: [...document.querySelectorAll(".cs-sq-frame")].map((f) => {
        const b = f.getBoundingClientRect()
        return { w: b.width, h: b.height }
      }),
    }
  })
}

for (const slug of STORY_SLUGS) {
  const path = `/work/${slug}`
  const count = storyColumn(slug).length

  test.describe(path, () => {
    test("at 1440: the panel beside a column of equal squares", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await gotoReady(page, path)
      const { panel, lead, column, squares } = await boxes(page)

      // The boards' 400px times the type scale (16 Nov 2026).
      expect(panel.w, "panel width").toBeCloseTo(468, 0)
      expect(lead.x, "column right of the panel").toBeGreaterThanOrEqual(
        panel.x + panel.w + 90
      )
      expect(column.x, "one column").toBeCloseTo(lead.x, 0)
      expect(column.y, "the other squares under the first").toBeCloseTo(
        lead.bottom + 40,
        0
      )
      // The panel starts under the cover, beside the first square.
      expect(panel.y, "under the cover").toBeGreaterThanOrEqual(900)
      expect(panel.y, "beside the first square").toBeLessThan(lead.bottom)
      expect(lead.w, "column width").toBeCloseTo(752, 0)

      expect(squares).toHaveLength(count)
      for (const [i, sq] of squares.entries()) {
        expect(sq.w, `square ${i + 1} width`).toBeCloseTo(752, 0)
        expect(sq.h, `square ${i + 1} is square`).toBeCloseTo(sq.w, 0)
      }
    })

    test("at 390: one column, the first square, the panel, the squares", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoReady(page, path)
      const { panel, lead, column, squares } = await boxes(page)

      expect(
        panel.y,
        "the panel under the first square"
      ).toBeGreaterThanOrEqual(lead.bottom)
      expect(column.y, "squares below the panel").toBeGreaterThanOrEqual(
        panel.bottom
      )
      expect(lead.x).toBeCloseTo(panel.x, 0)
      expect(column.x).toBeCloseTo(panel.x, 0)
      expect(lead.w, "the page's column").toBeCloseTo(390 - 48, 0)
      expect(column.w, "the page's column").toBeCloseTo(390 - 48, 0)
      for (const [i, sq] of squares.entries()) {
        expect(sq.w, `square ${i + 1} width`).toBeCloseTo(column.w, 0)
        expect(sq.h, `square ${i + 1} is square`).toBeCloseTo(sq.w, 0)
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth
        ),
        "no sideways scroll"
      ).toBe(0)
    })

    test("the panel stays in view and never meets the next story", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.setViewportSize({ width: 1440, height: 900 })
      await gotoReady(page, path)

      const read = () =>
        page.evaluate(() => {
          const p = document.querySelector(".cs-panel")!.getBoundingClientRect()
          const next = document
            .querySelector(".cs-next")!
            .getBoundingClientRect()
          const foot = document
            .querySelector("[data-site-footer]")!
            .getBoundingClientRect()
          return {
            top: p.top,
            bottom: p.bottom,
            height: p.height,
            next: next.top,
            foot: foot.top,
          }
        })

      const { column } = await boxes(page)
      // Halfway down the column (when it is longer than the window).
      const mid = Math.max(0, column.y + column.h / 2 - 450)
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), mid)
      await page.waitForTimeout(100)
      const during = await read()
      if (column.h > during.height + 200) {
        // Pinned: 24px under the bar (72px once it sticks), or for a panel
        // taller than the window, its foot 24px above the bottom.
        const expected = Math.min(72 + 24, 900 - during.height - 24)
        expect(during.top, "pinned").toBeCloseTo(expected, 0)
      }
      expect(during.bottom, "its foot is in view").toBeLessThanOrEqual(900)

      // At the end of the page: above the next story and the footer.
      await page.evaluate(() =>
        scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        })
      )
      await page.waitForTimeout(100)
      const end = await read()
      expect(end.bottom, "above the next story").toBeLessThanOrEqual(
        end.next + 0.5
      )
      expect(end.bottom, "above the footer").toBeLessThanOrEqual(end.foot)
    })

    test("no bracket placeholder on the page", async ({ page }) => {
      await gotoReady(page, path)
      const text = await page.evaluate(() => {
        const labels = [
          ...document.querySelectorAll("[aria-label], [alt], [title]"),
        ].flatMap((el) =>
          ["aria-label", "alt", "title"].map((a) => el.getAttribute(a) ?? "")
        )
        return [document.title, document.body.innerText, ...labels].join("\n")
      })
      expect(text.match(/\[[A-Z][^\]\n]*\]?/g) ?? []).toEqual([])
    })
  })
}

// Owner, 13 Nov 2026: "on case study pages, for links: add more top
// spacing". The Links block sits 24px under the paragraphs or the roles
// (the panel's 16px gap plus 8px), three times the 8px it had.
for (const slug of ["tenderlift", "shopify", "zf-scalar"]) {
  for (const width of [1440, 390]) {
    test(`/work/${slug} at ${width}: the links stand 24px clear of the text above`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await gotoReady(page, `/work/${slug}`)
      const gap = await page.evaluate(() => {
        const block = document.querySelector('.cs-block[data-block="links"]')
        const above = block?.previousElementSibling
        if (!block || !above) return null
        return (
          block.getBoundingClientRect().top -
          above.getBoundingClientRect().bottom
        )
      })
      expect(gap).not.toBeNull()
      expect(Math.round(gap!)).toBe(24)
    })
  }
}
