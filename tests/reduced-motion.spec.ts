import { expect, test } from "@playwright/test"

import { HOME } from "@/content/pages/home"
import { MENTORING } from "@/content/pages/mentoring"
import { WORK_PAGE } from "@/content/pages/work"

import {
  finishAnimations,
  FIXED_TIME,
  gotoReady,
  headlineSlot,
  runningAnimations,
  secondHand,
} from "./helpers"

/**
 * `prefers-reduced-motion: reduce` (the `reduced-motion` project): the
 * headline holds its first phrase, the testimonial pile does not advance on
 * its own, and the station clock's second hand holds. Each runs on
 * Playwright's fake clock, so "nothing happened for ten seconds" takes no
 * real time.
 */

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: FIXED_TIME })
})

test("the project really asks for reduced motion", async ({ page }) => {
  await page.goto("/")
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  ).toBe(true)
})

test("the headline does not cycle, and offers Play", async ({ page }) => {
  await gotoReady(page, "/")
  await expect(
    page.getByRole("button", { name: HOME.headline.playLabel })
  ).toBeVisible()
  const slot = headlineSlot(page)
  await expect(slot).toHaveText(HOME.headline.phrases[0].phrase)
  await page.clock.runFor(HOME.headline.paceMs * 5)
  await expect(slot).toHaveText(HOME.headline.phrases[0].phrase)
})

test("the testimonial pile does not advance on its own", async ({ page }) => {
  const said = MENTORING.said
  await gotoReady(page, "/mentoring")
  const pile = page.getByRole("region", { name: said.title })
  await pile.scrollIntoViewIfNeeded()
  await page.mouse.move(1, 1)
  const counter = pile.getByRole("button", { name: /^\d+ \/ \d+, testimonial/ })
  await expect(counter).toHaveText(/^1 \//)

  // No timer runs, and there is no play control to start one.
  expect(await runningAnimations(pile)).toBe(0)
  await expect(pile.getByRole("button", { name: said.playLabel })).toHaveCount(
    0
  )
  await finishAnimations(pile)
  await page.clock.runFor(20_000)
  await expect(counter).toHaveText(/^1 \//)

  // The reader can still step through by hand.
  await counter.click()
  await expect(counter).toHaveText(/^2 \//)

  // A tap on the pile too: a cross-fade, no flight, and nothing left over.
  const box = await pile.locator('figure[data-pos="0"]').boundingBox()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 3)
  await expect(counter).toHaveText(/^3 \//)
  await expect(pile.locator("figure[data-fly]")).toHaveCount(0)
  // A drag does not follow the pointer.
  const top = pile.locator('figure[data-pos="0"]')
  await page.mouse.move(box!.x + 200, box!.y + 100)
  await page.mouse.down()
  await page.mouse.move(box!.x + 240, box!.y + 100, { steps: 4 })
  expect(await top.evaluate((el) => el.style.transform)).toBe("")
  await page.mouse.up()
  await expect(counter).toHaveText(/^3 \//)
})

test("the station clock's second hand holds", async ({ page }) => {
  await gotoReady(page, "/")
  const hand = secondHand(page)
  await hand.scrollIntoViewIfNeeded()
  const read = () => hand.evaluate((g) => (g as SVGElement).style.transform)
  const before = await read()
  await page.clock.runFor(5_000)
  expect(await read()).toBe(before)
})

test("nothing on / runs a time-based animation after load", async ({
  page,
}) => {
  await gotoReady(page, "/")
  await page.clock.runFor(2_000)
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter(
        (a) =>
          a.playState === "running" &&
          a.timeline === document.timeline &&
          // Not the 1ms transitions the global reduced-motion rule leaves on
          // every element (app/globals.css): they end on the next frame and
          // nobody sees them; a test that reads right after a state change
          // can catch one before that frame.
          Number(a.effect?.getTiming().duration ?? 0) > 1
      )
      .map((a) => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null
        const name =
          "animationName" in a
            ? (a as CSSAnimation).animationName
            : "transitionProperty" in a
              ? (a as CSSTransition).transitionProperty
              : "script"
        const cls = t?.getAttribute("class")?.split(" ")[0]
        return `${name} on ${t?.tagName ?? "?"}${cls ? `.${cls}` : ""}`
      })
  )
  expect(running).toEqual([])
})

test("the paper sheet stays full width at the end of the page", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const ratio = await page.evaluate(async () => {
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    })
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r))
    )
    const sheet = document.querySelector("[data-page-sheet]")!
    return sheet.getBoundingClientRect().width / innerWidth
  })
  expect(ratio).toBe(1)
})

test("story clips do not start, cost nothing, and play on request", async ({
  page,
}) => {
  const requests: string[] = []
  page.on("request", (r) => {
    if (/\.(webm|mp4)(\?|$)/.test(r.url())) requests.push(r.url())
  })
  await gotoReady(page, "/work/studenti-rs")
  const clips = page.locator("[data-clip]")
  await expect(clips).toHaveCount(2)
  for (const clip of await clips.all()) {
    await clip.scrollIntoViewIfNeeded()
    await expect(clip.locator("img")).toBeVisible()
    await expect(
      clip.getByRole("button", { name: WORK_PAGE.story.play })
    ).toBeVisible()
    expect(
      await clip.locator("video").evaluate((v: HTMLVideoElement) => v.paused)
    ).toBe(true)
  }
  expect(requests).toEqual([])

  // Play is honoured: the reader asked for the motion.
  const first = clips.first()
  await first.scrollIntoViewIfNeeded()
  await first.getByRole("button", { name: WORK_PAGE.story.play }).click()
  await expect(
    first.getByRole("button", { name: WORK_PAGE.story.pause })
  ).toBeVisible()
  expect(requests.length).toBeGreaterThan(0)
})
