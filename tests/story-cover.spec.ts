import { expect, test, type Page } from "@playwright/test"

import { WORK_PAGE } from "@/content/pages/work"
import { SITE } from "@/content/site"

import { gotoReady, STORY_SLUGS } from "./helpers"

/**
 * The case study's first screen and its bar (owner, 16 Nov 2026: the
 * board's "A · Plate" and "N4"):
 *
 * - No site header on a story: the one header is the bar, "All work" at the
 *   left (a link to `/work`) and Ask at the right.
 * - The bar's label is "All work" on the cover, a link to `/work`. Once the
 *   cover's name has gone under the bar (owner, 16 Nov 2026: "the latter
 *   should link to top of the page"), the label is the project's name, the
 *   arrow points up, and the same link goes to `#top`, named "<name>, back
 *   to top": it scrolls to the top and moves focus to the cover's name.
 *   Without JavaScript it stays "All work" to `/work`.
 * - Past the cover the name comes with the product's tile (owner, 16 Nov
 *   2026: "morph logo + name in that header"), in the DOM from the server,
 *   so nothing in the row moves or grows. Where the browser has
 *   scroll-driven animations the two morph in step with the scroll over the
 *   last 56px before the threshold, ending exactly on it; the link's target
 *   and name stay on the threshold. With motion reduced, the stepped swap.
 *   On a narrow phone a long name ends in an ellipsis, short of Ask.
 * - The cover fills the first screen at 390x844 and 1440x900 on all nine
 *   stories, the numbers inside it and the first square coming up at its
 *   foot; at 360x640 nothing is cut off or overlapping (the cover grows).
 * - The bar's row is the site header's (`header.spec.ts` measures both);
 *   wider than 1100px its ends sit on the cover's edges.
 */

const back = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: "All work", exact: true })
const backLink = (page: Page) => page.getByRole("banner").locator(".cs-back")
const toTop = (title: string) =>
  WORK_PAGE.story.toTop.replaceAll("{name}", title)

/** The pixel rows the bar covers once it sticks. */
async function stuckHeight(page: Page) {
  return page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>("[data-cs-bar]")!
    return bar.offsetHeight + parseFloat(getComputedStyle(bar).top)
  })
}

async function scrollPastName(page: Page) {
  await page.evaluate(() => {
    const name = document.getElementById("cs-title")!
    const top = name.getBoundingClientRect().bottom + scrollY
    scrollTo({ top, behavior: "instant" })
  })
}

test.describe("the bar", () => {
  test("no site header on a story: the bar is the one header", async ({
    page,
  }) => {
    await gotoReady(page, "/work/shopify")
    // The bar takes the top block's row, not its name or its line.
    await expect(page.locator(".site-top__line")).toHaveCount(0)
    await expect(page.getByRole("banner")).toHaveCount(1)
    await expect(
      page.getByRole("banner").getByRole("link", { name: SITE.name })
    ).toHaveCount(0)
    await expect(back(page)).toHaveAttribute("href", "/work")
    await expect(
      page.getByRole("banner").getByRole("button", { name: /ask/i })
    ).toBeVisible()
    // The panel's old "All work" line is gone: the bar is the way back.
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "All work", exact: true })
    ).toHaveCount(0)
  })

  for (const slug of ["shopify", "fontalternatives", "zf-scalar"]) {
    test(`/work/${slug}: "All work" on the cover, the name after it`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoReady(page, `/work/${slug}`)
      const all = page.locator(".cs-back-all")
      const name = page.locator(".cs-back-name")
      const title = (await page.locator("#cs-title").textContent())!.trim()
      await expect(name.locator(".cs-back-title")).toHaveText(title)
      // The tile is there from the start, before the name.
      await expect(name.locator(`[data-tile="${slug}"]`)).toHaveCount(1)
      const rowH = () =>
        page
          .locator(".cs-bar-row")
          .evaluate((el) => el.getBoundingClientRect().height)
      const row = await rowH()
      const opacity = (l: typeof all) =>
        l.evaluate((el) => getComputedStyle(el).opacity)

      expect(await opacity(all)).toBe("1")
      expect(await opacity(name)).toBe("0")
      const width = await back(page).evaluate(
        (el) => (el as HTMLElement).offsetWidth
      )

      await scrollPastName(page)
      await expect(page.locator("[data-cs-bar]")).toHaveAttribute(
        "data-scrolled",
        ""
      )
      await expect.poll(() => opacity(name)).toBe("1")
      await expect.poll(() => opacity(all)).toBe("0")
      // The same link, the same size, now to the top, named for it, its
      // arrow turned up.
      await expect(backLink(page)).toHaveAttribute("href", "#top")
      await expect(backLink(page)).toHaveAccessibleName(toTop(title))
      expect(
        await backLink(page).evaluate((el) => (el as HTMLElement).offsetWidth)
      ).toBe(width)
      expect(await rowH(), "the row keeps its height").toBe(row)
      // The tile shows at 20px before the name, on the name's centre.
      const tile = await page.evaluate(() => {
        const t = document
          .querySelector(".cs-back-name [data-tile]")!
          .getBoundingClientRect()
        const n = document
          .querySelector(".cs-back-title")!
          .getBoundingClientRect()
        return {
          size: t.width,
          gap: n.left - t.right,
          mid: t.top + t.height / 2 - (n.top + n.height / 2),
        }
      })
      expect(tile.size).toBeCloseTo(20, 0)
      expect(tile.gap).toBeCloseTo(8, 0)
      expect(Math.abs(tile.mid)).toBeLessThanOrEqual(1)
      await expect
        .poll(() =>
          backLink(page)
            .locator(".site-top__arrow")
            .evaluate((el) => getComputedStyle(el).rotate)
        )
        .toBe("90deg")
      // Stuck at the top on the paper, the content passing under it.
      // (The ground crossfades over 160ms; the morph may already be done.)
      const bar = page.locator("[data-cs-bar]")
      expect(
        await bar.evaluate((el) => el.getBoundingClientRect().bottom)
      ).toBeCloseTo(await stuckHeight(page), 0)
      await expect
        .poll(() => bar.evaluate((el) => getComputedStyle(el).backgroundColor))
        .toBe("rgb(252, 252, 250)")

      // Back up: "All work" again, to /work.
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }))
      await expect(page.locator("[data-cs-bar]")).not.toHaveAttribute(
        "data-scrolled"
      )
      await expect.poll(() => opacity(all)).toBe("1")
      await expect(back(page)).toHaveAttribute("href", "/work")
    })
  }

  test("the tile and the name morph in step with the scroll, ending on the threshold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, "/work/studenti-rs")
    test.skip(
      !(await page.evaluate(
        () =>
          CSS.supports("animation-timeline: view()") &&
          CSS.supports("animation-range: 0% 100%") &&
          CSS.supports("timeline-scope: --a")
      )),
      "no scroll-driven animations in this browser: the stepped swap"
    )
    const { h, end } = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>("[data-cs-bar]")!
      const h = bar.offsetHeight + parseFloat(getComputedStyle(bar).top)
      const name = document.getElementById("cs-title")!
      return { h, end: name.getBoundingClientRect().bottom + scrollY - h }
    })
    expect(h).toBeGreaterThan(0)
    const at = async (y: number) => {
      await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), y)
      return page.evaluate(() => {
        const n = (sel: string, prop: "opacity" | "rotate") =>
          getComputedStyle(document.querySelector(sel)!)[prop]
        return {
          all: parseFloat(n(".cs-back-all", "opacity")),
          name: parseFloat(n(".cs-back-name", "opacity")),
          turn: parseFloat(n(".cs-back-arrow", "rotate")) || 0,
          scrolled: document
            .querySelector("[data-cs-bar]")!
            .hasAttribute("data-scrolled"),
          href: document.querySelector(".cs-back")!.getAttribute("href"),
        }
      })
    }

    // Halfway through the last 56px: both half shown, the arrow half
    // turned, the link still "All work".
    await expect
      .poll(async () => (await at(end - 28)).name, { timeout: 5_000 })
      .toBeCloseTo(0.5, 1)
    const mid = await at(end - 28)
    expect(mid.all).toBeCloseTo(0.5, 1)
    expect(mid.turn).toBeCloseTo(45, -1)
    expect(mid.scrolled).toBe(false)
    expect(mid.href).toBe("/work")

    // Just past the threshold: the morph done, the link to the top.
    await at(end + 2)
    await expect(backLink(page)).toHaveAttribute("href", "#top")
    const done = await at(end + 2)
    expect(done).toMatchObject({ all: 0, name: 1, turn: 90, scrolled: true })

    // Back up: it goes back down with the scroll.
    await at(end - 42)
    await expect(back(page)).toHaveAttribute("href", "/work")
    const back25 = await at(end - 42)
    expect(back25.name).toBeCloseTo(0.25, 1)
    expect(back25.scrolled).toBe(false)
  })

  test("with motion reduced, the tile and the name swap at the threshold", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, "/work/zf-scalar")
    const end = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>("[data-cs-bar]")!
      const h = bar.offsetHeight + parseFloat(getComputedStyle(bar).top)
      return (
        document.getElementById("cs-title")!.getBoundingClientRect().bottom +
        scrollY -
        h
      )
    })
    const opacity = (sel: string) =>
      page.locator(sel).evaluate((el) => getComputedStyle(el).opacity)
    await page.evaluate(
      (top) => scrollTo({ top, behavior: "instant" }),
      end - 28
    )
    await page.waitForTimeout(100)
    expect(await opacity(".cs-back-all")).toBe("1")
    expect(await opacity(".cs-back-name")).toBe("0")
    await page.evaluate(
      (top) => scrollTo({ top, behavior: "instant" }),
      end + 4
    )
    await expect(backLink(page)).toHaveAttribute("href", "#top")
    // (Reduced motion leaves a 1ms transition, globals.css.)
    await expect.poll(() => opacity(".cs-back-name")).toBe("1")
    await expect.poll(() => opacity(".cs-back-all")).toBe("0")
    // No scroll-driven morph in the bar.
    expect(
      await page.evaluate(() =>
        document
          .querySelector("[data-cs-bar]")!
          .getAnimations({ subtree: true })
          .filter((a) => a instanceof CSSAnimation)
          .map((a) => a.animationName)
      )
    ).toEqual([])
  })

  for (const width of [320, 360]) {
    test(`at ${width}: a long name ends in an ellipsis, short of Ask`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 })
      await gotoReady(page, "/work/fontalternatives")
      const row = await page
        .locator(".cs-bar-row")
        .evaluate((el) => el.getBoundingClientRect().height)
      await scrollPastName(page)
      await expect(backLink(page)).toHaveAttribute("href", "#top")
      const m = await page.evaluate(() => {
        const title = document.querySelector<HTMLElement>(".cs-back-title")!
        const t = title.getBoundingClientRect()
        const tile = document
          .querySelector(".cs-back-name [data-tile]")!
          .getBoundingClientRect()
        const ask = document
          .querySelector(".cs-bar .ask-btn")!
          .getBoundingClientRect()
        return {
          cut: title.scrollWidth > title.clientWidth,
          ellipsis: getComputedStyle(title).textOverflow,
          one: t.height < 40,
          right: t.right,
          tile: tile.width,
          askLeft: ask.left,
          row: document.querySelector(".cs-bar-row")!.getBoundingClientRect()
            .height,
        }
      })
      expect(m.cut).toBe(true)
      expect(m.ellipsis).toBe("ellipsis")
      expect(m.one, "one line").toBe(true)
      expect(m.tile, "the tile keeps its size").toBeCloseTo(20, 0)
      expect(m.right).toBeLessThan(m.askLeft)
      expect(m.row).toBe(row)
      // The accessible name is whole.
      await expect(backLink(page)).toHaveAccessibleName(
        toTop("FontAlternatives")
      )
    })
  }

  for (const reduced of [false, true]) {
    test(`once scrolled, the bar takes a ${reduced ? "keyboard, motion reduced," : "click"} to the top, focus on the name`, async ({
      page,
    }) => {
      await page.emulateMedia({
        reducedMotion: reduced ? "reduce" : "no-preference",
      })
      await page.setViewportSize({ width: 390, height: 844 })
      await gotoReady(page, "/work/tenderlift")
      await page.evaluate(() => scrollTo({ top: 2400, behavior: "instant" }))
      await expect(backLink(page)).toHaveAttribute("href", "#top")
      if (reduced) {
        await backLink(page).focus()
        await page.keyboard.press("Enter")
      } else {
        await backLink(page).click()
      }
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
      await expect(page.locator("#cs-title")).toBeFocused()
      // No navigation, no hash in the address.
      await expect(page).toHaveURL(/\/work\/tenderlift$/)
      await expect(back(page)).toHaveAttribute("href", "/work")
    })
  }

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false })

    test("the label stays All work", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto("/work/shopify")
      await scrollPastName(page)
      await page.waitForTimeout(200)
      await expect(page.locator("[data-cs-bar]")).not.toHaveAttribute(
        "data-scrolled"
      )
      expect(
        await page
          .locator(".cs-back-all")
          .evaluate((el) => getComputedStyle(el).opacity)
      ).toBe("1")
      await expect(back(page)).toHaveAttribute("href", "/work")
    })
  })

  for (const width of [360, 390, 768, 1440]) {
    test(`at ${width}: the arrow on the row's edge, the target in the gutter`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await gotoReady(page, "/work/tenderlift")
      const m = await page.evaluate(() => {
        const head = document
          .querySelector(".cs-back .ico-head")!
          .getBoundingClientRect()
        const ask = document
          .querySelector(".cs-bar .ask-btn")!
          .getBoundingClientRect()
        const row = document
          .querySelector(".cs-bar-row")!
          .getBoundingClientRect()
        const link = document.querySelector(".cs-back")!.getBoundingClientRect()
        const cover = document
          .querySelector(".cs-cover-in")!
          .getBoundingClientRect()
        // The head's point, less the mitre's reach past it (half the 1.5px
        // stroke over sin 45°): the arrow's visible tip.
        return {
          arrow: head.left - 0.75 * Math.SQRT2,
          rowLeft: row.left,
          rowRight: row.right,
          askRight: ask.right,
          link: link.left,
          linkH: link.height,
          coverLeft: cover.left,
          coverRight: cover.right,
        }
      })
      expect(
        Math.abs(m.arrow - m.rowLeft),
        JSON.stringify(m)
      ).toBeLessThanOrEqual(1)
      expect(Math.abs(m.askRight - m.rowRight)).toBeLessThanOrEqual(0.5)
      // Wider than 1100px the row is the story's wide frame: the cover's
      // edges.
      if (width > 1100) {
        expect(Math.abs(m.rowLeft - m.coverLeft)).toBeLessThanOrEqual(0.5)
        expect(Math.abs(m.rowRight - m.coverRight)).toBeLessThanOrEqual(0.5)
      }
      // The target reaches into the gutter, the arrow does not.
      expect(m.link).toBeLessThan(m.arrow)
      expect(m.linkH).toBeGreaterThanOrEqual(width > 720 ? 43 : 44)
    })
  }
})

test.describe("the cover", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    for (const slug of STORY_SLUGS) {
      test(`/work/${slug} at ${viewport.width}: the first screen, the numbers in it`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" })
        await page.setViewportSize(viewport)
        await gotoReady(page, `/work/${slug}`)
        const m = await coverBoxes(page)
        expect(m.cover.top, "from the very top").toBe(0)
        expect(m.cover.height, "the whole screen").toBeCloseTo(
          viewport.height,
          0
        )
        expect(m.nameOverflow, "the name fits").toBeLessThanOrEqual(0)
        if (m.numbers) {
          expect(
            m.numbers.bottom,
            "the numbers on the first screen"
          ).toBeLessThanOrEqual(viewport.height)
          expect(m.numbers.top, "under the words").toBeGreaterThanOrEqual(
            m.head.bottom
          )
        }
        // The first square comes up at the foot, clear of the numbers.
        expect(m.lead.top, "the first square shows").toBeLessThan(
          viewport.height
        )
        expect(m.lead.top).toBeGreaterThan(viewport.height - 160)
        if (viewport.width <= 1100)
          expect(m.lead.top, "under the numbers").toBeGreaterThanOrEqual(
            m.foot.bottom + 16
          )
        else
          expect(m.lead.left, "beside the numbers").toBeGreaterThanOrEqual(
            m.foot.right + 40
          )
      })
    }
  }

  for (const slug of STORY_SLUGS) {
    test(`/work/${slug} at 360x640: nothing cut off, nothing overlapping`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.setViewportSize({ width: 360, height: 640 })
      await gotoReady(page, `/work/${slug}`)
      const m = await coverBoxes(page)
      expect(m.cover.height).toBeGreaterThanOrEqual(640 - 0.5)
      expect(m.nameOverflow, "the name fits").toBeLessThanOrEqual(0)
      expect(m.head.top, "under the bar").toBeGreaterThanOrEqual(m.bar.bottom)
      expect(m.foot.top, "the foot under the words").toBeGreaterThanOrEqual(
        m.head.bottom
      )
      expect(m.foot.bottom, "inside the cover").toBeLessThanOrEqual(
        m.cover.bottom
      )
      expect(
        m.lead.top,
        "the first square under the foot"
      ).toBeGreaterThanOrEqual(m.foot.bottom + 16)
      expect(m.labelsOverlap, "number labels apart").toBe(false)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth
        ),
        "no sideways scroll"
      ).toBe(0)
    })
  }
})

async function coverBoxes(page: Page) {
  return page.evaluate(() => {
    const box = (sel: string) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        left: r.left,
        right: r.right,
        height: r.height,
      }
    }
    const name = document.querySelector<HTMLElement>("#cs-title")!
    const room = document.querySelector<HTMLElement>(".cs-cover-in")!
    const range = document.createRange()
    range.selectNodeContents(name)
    const text = range.getBoundingClientRect()
    const labels = [...document.querySelectorAll(".cs-number")].map((n) =>
      n.getBoundingClientRect()
    )
    const labelsOverlap = labels.some((a, i) =>
      labels.some((b, j) => j > i && a.right > b.left + 0.5)
    )
    return {
      cover: box(".cs-cover")!,
      bar: box("[data-cs-bar]")!,
      head: box(".cs-cover-head")!,
      foot: box(".cs-cover-foot")!,
      numbers: box(".cs-numbers"),
      lead: box(".cs-lead")!,
      nameOverflow: text.right - room.getBoundingClientRect().right,
      labelsOverlap,
    }
  })
}
