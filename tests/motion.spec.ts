import { expect, test, type Page } from "@playwright/test"

import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"

import {
  finishAnimations,
  FIXED_TIME,
  gotoReady,
  headlineSlot,
  runningAnimations,
  secondHand,
} from "./helpers"

/**
 * What moves, with motion allowed (Desktop Chrome). The mirror image, with
 * `prefers-reduced-motion: reduce`, is reduced-motion.spec.ts. Where a test
 * has to show that something does NOT happen, it runs on Playwright's fake
 * clock instead of waiting in real time.
 */

const { paceMs, pauseLabel, playLabel } = HOME.headline
/** The first swap comes 700ms after the pace (headline-store.ts). */
const FIRST_SWAP_MS = paceMs + 700

test.describe("headline", () => {
  /** The button's glyph: "pause" while the cycle is set to run. */
  async function glyph(btn: import("@playwright/test").Locator) {
    return (await btn.locator("svg.ico").getAttribute("data-on")) === null
      ? "play"
      : "pause"
  }

  test("the button shows only the visitor's setting; holds never change it", async ({
    page,
  }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    await page.mouse.move(2, 2)
    const btn = page.locator(".lw-pause")
    const slot = headlineSlot(page)
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAccessibleName(pauseLabel)

    // Hovering the headline to read it holds the cycle: the text stays, and
    // the button still says the cycle is set to run.
    await page.locator(".lw-h").hover()
    const read = await slot.innerText()
    await page.clock.runFor(paceMs * 3)
    await expect(slot).toHaveText(read)
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAttribute("data-state", "running")
    await expect(btn).toHaveAccessibleName(pauseLabel)

    // Leaving releases the hold: it advances again.
    await page.mouse.move(2, 2)
    await page.clock.runFor(paceMs + 500)
    await expect(slot).not.toHaveText(read)

    // Focusing a product name in the story holds it too, the button is
    // unchanged.
    await page.locator(".lp-story .lk-chip").first().focus()
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAccessibleName(pauseLabel)
  })

  test("a press flips the button at once, exactly once, and play resumes under the pointer", async ({
    page,
  }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    await page.mouse.move(2, 2)
    const btn = page.locator(".lw-pause")
    const slot = headlineSlot(page)
    // Straight onto the button from outside: pointing at it is not a hold.
    const box = (await btn.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.click(x, y)
    expect(await glyph(btn)).toBe("play")
    await expect(btn).toHaveAccessibleName(playLabel)
    await expect(btn).toHaveAttribute("data-state", "paused")
    const paused = await slot.innerText()
    await page.clock.runFor(paceMs * 3)
    await expect(slot).toHaveText(paused)

    // Play with the pointer still on the button: it resumes from the phrase
    // on show with a full interval ahead, no instant jump.
    await page.mouse.click(x, y)
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAccessibleName(pauseLabel)
    await page.clock.runFor(paceMs - 300)
    await expect(slot).toHaveText(paused)
    await page.clock.runFor(600)
    await expect(slot).not.toHaveText(paused)

    // Two quick presses: flipped twice, back to running.
    await page.mouse.dblclick(x, y)
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAccessibleName(pauseLabel)
  })

  test("the keyboard: Space and Enter flip it; focus on it is not a hold", async ({
    page,
  }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    await page.mouse.move(2, 2)
    const btn = page.locator(".lw-pause")
    const slot = headlineSlot(page)
    await btn.focus()
    await page.keyboard.press("Space")
    expect(await glyph(btn)).toBe("play")
    await expect(btn).toHaveAccessibleName(playLabel)
    await page.keyboard.press("Enter")
    expect(await glyph(btn)).toBe("pause")
    // Focus stays on the button and the cycle runs.
    const before = await slot.innerText()
    await page.clock.runFor(paceMs + 500)
    await expect(slot).not.toHaveText(before)
  })

  test("the Ask panel holds the cycle but not the button", async ({ page }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    await page.mouse.move(2, 2)
    const btn = page.locator(".lw-pause")
    await page.locator("header .ask-btn").first().click()
    await page.clock.runFor(1000)
    expect(await glyph(btn)).toBe("pause")
    await expect(btn).toHaveAccessibleName(pauseLabel)
    await page.keyboard.press("Escape")
    await page.clock.runFor(500)
    expect(await glyph(btn)).toBe("pause")
  })

  test("changes phrase within its pace", async ({ page }) => {
    await gotoReady(page, "/")
    const slot = headlineSlot(page)
    const first = await slot.innerText()
    expect(first).toContain(HOME.headline.phrases[0].phrase)
    await expect
      .poll(() => slot.innerText(), { timeout: FIRST_SWAP_MS + 2_000 })
      .not.toBe(first)
  })

  test("the pause button stops it, and play starts it again", async ({
    page,
  }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    const pause = page.getByRole("button", { name: pauseLabel })
    // The keyboard, so no pointer rests in the headline (which also holds it).
    await pause.focus()
    await page.keyboard.press("Enter")
    const play = page.getByRole("button", { name: playLabel })
    await expect(play).toBeVisible()

    const slot = headlineSlot(page)
    const held = await slot.innerText()
    await page.clock.runFor(paceMs * 4)
    await expect(slot).toHaveText(held)

    await play.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: pauseLabel })).toBeVisible()
    await page.clock.runFor(FIRST_SWAP_MS + 500)
    await expect(slot).not.toHaveText(held)
  })
})

test.describe("testimonial pile", () => {
  const said = MENTORING.said

  test("advances on its own, and pause stops it", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const pile = page.getByRole("region", { name: said.title })
    await pile.scrollIntoViewIfNeeded()
    await page.mouse.move(1, 1)
    const counter = pile.getByRole("button", {
      name: /^\d+ \/ \d+, testimonial/,
    })
    await expect(counter).toHaveText(/^1 \//)

    // The pile's timer is its progress bar's CSS animation: it runs, and its
    // end advances the pile.
    await expect.poll(() => runningAnimations(pile)).toBeGreaterThan(0)
    await finishAnimations(pile)
    await expect(counter).toHaveText(/^2 \//)

    await pile.getByRole("button", { name: said.pauseLabel }).click()
    await expect(
      pile.getByRole("button", { name: said.playLabel })
    ).toBeVisible()
    await page.mouse.move(1, 1)
    expect(await runningAnimations(pile)).toBe(0)
    await finishAnimations(pile)
    await expect(counter).toHaveText(/^2 \//)
  })
})

test.describe("station clock", () => {
  test("the second hand moves", async ({ page }) => {
    await page.clock.install({ time: FIXED_TIME })
    await gotoReady(page, "/")
    const hand = secondHand(page)
    await hand.scrollIntoViewIfNeeded()
    const before = await hand.evaluate((g) => (g as SVGElement).style.transform)
    await page.clock.runFor(3_000)
    await expect
      .poll(() => hand.evaluate((g) => (g as SVGElement).style.transform))
      .not.toBe(before)
  })
})

test.describe("paper sheet", () => {
  /** The sheet's rendered width over the viewport's, and its scale. */
  async function sheetAt(page: Page, top: number) {
    return page.evaluate(async (y) => {
      scrollTo({ top: y, behavior: "instant" })
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      )
      const sheet = document.querySelector("[data-page-sheet]")!
      return sheet.getBoundingClientRect().width / innerWidth
    }, top)
  }

  for (const path of ["/", "/work/tenderlift"]) {
    test(`${path}: narrows as the footer arrives, without scrolling sideways`, async ({
      page,
    }) => {
      await gotoReady(page, path)
      const { end, footer } = await page.evaluate(() => ({
        end: document.documentElement.scrollHeight - innerHeight,
        footer:
          document.querySelector<HTMLElement>("[data-site-footer]")!
            .offsetHeight,
      }))
      // Before the footer: full width.
      expect(await sheetAt(page, end - footer - 200)).toBeCloseTo(1, 3)
      // Halfway in: on its way.
      const half = await sheetAt(page, end - footer / 2)
      expect(half).toBeLessThan(0.97)
      expect(half).toBeGreaterThan(0.9)
      // At the end: the full narrowing (86px a side at 1440).
      expect(await sheetAt(page, end)).toBeCloseTo(0.88, 2)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth
        )
      ).toBe(0)
    })
  }
})
