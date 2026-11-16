import { expect, test, type Locator, type Page } from "@playwright/test"

import { WORK_PAGE } from "@/content/pages/work"

import { gotoReady, STORY_SLUGS, storyColumn } from "./helpers"

/**
 * The story clips' loading rules (`app/components/story/StoryVideo.tsx`,
 * `useLazyClip`), on every story that has a clip, from content:
 *
 * - Each clip is muted, inline, `preload="none"`, with its poster still in
 *   the square before anything loads, and a size of its own.
 * - A clip that is not half in view has no `<source>` and costs no request
 *   (owner, 16 Nov 2026: "videos on case study should start playing when
 *   they get in viewport, no need before that"): the first square peeking
 *   at the cover's foot waits too, so a story's first load asks for no
 *   video. Half in view it gets its sources (WebM first) and plays.
 * - Out of view it pauses; the page's motion pause stops it; a reader's
 *   pause sticks.
 *
 * The reduced-motion half (no autoplay, Play on request) is in
 * `reduced-motion.spec.ts`.
 */

const { pause, play } = WORK_PAGE.story

const WITH_CLIPS = STORY_SLUGS.filter((slug) =>
  storyColumn(slug).some((item) => item.kind === "clip")
)

function clipRequests(page: Page): string[] {
  const seen: string[] = []
  page.on("request", (r) => {
    if (/\.(webm|mp4)(\?|$)/.test(r.url())) seen.push(r.url())
  })
  return seen
}

/** The square in the middle of the window, as a reader scrolls to it. */
const centre = (el: Locator) =>
  el.evaluate((n) => n.scrollIntoView({ block: "center", behavior: "instant" }))

const isPaused = (page: Page, i: number) =>
  page
    .locator("[data-clip] video")
    .nth(i)
    .evaluate((v: HTMLVideoElement) => v.paused)

test("every story with a clip is covered", () => {
  expect(WITH_CLIPS.length).toBeGreaterThan(3)
})

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`at ${viewport.width}: a story's first load asks for no video`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const requests = clipRequests(page)
    // TenderLift's first square is a clip, peeking at the cover's foot.
    await gotoReady(page, "/work/tenderlift")
    const lead = page.locator(".cs-lead [data-clip]")
    await expect(lead).toHaveCount(1)
    expect(
      await lead.evaluate((el) => el.getBoundingClientRect().top < innerHeight)
    ).toBe(true)
    await page.waitForTimeout(800)
    await expect(lead.locator("video source")).toHaveCount(0)
    expect(requests).toEqual([])
    expect(await isPaused(page, 0)).toBe(true)

    // Scrolled into view: it loads and plays.
    await centre(lead)
    await expect.poll(() => requests.length).toBeGreaterThan(0)
    await expect.poll(() => isPaused(page, 0)).toBe(false)
  })
}

for (const slug of WITH_CLIPS) {
  const clips = storyColumn(slug).filter((item) => item.kind === "clip")

  test(`/work/${slug}: clips load near the viewport, play, and pause`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const requests = clipRequests(page)
    await gotoReady(page, `/work/${slug}`)
    const figures = page.locator("[data-clip]")
    await expect(figures).toHaveCount(clips.length)

    for (const [i, clip] of clips.entries()) {
      const figure = figures.nth(i)
      const video = figure.locator("video")
      await expect(video).toHaveJSProperty("muted", true)
      await expect(video).toHaveAttribute("playsinline", "")
      await expect(video).toHaveAttribute("preload", "none")
      await expect(video).toHaveAttribute("width", /^\d+$/)
      await expect(figure.locator("img")).toHaveCount(1)

      const name = clip
        .src!.split("/")
        .pop()!
        .replace(/\.mp4$/, "")
      const away = await figure.evaluate(
        (el) => el.getBoundingClientRect().top > innerHeight - 200
      )
      if (away) {
        // Not in view: nothing attached, nothing asked for.
        await expect(video.locator("source")).toHaveCount(0)
        expect(requests.some((u) => u.includes(name))).toBe(false)
      }

      await centre(figure)
      await expect(video.locator("source")).toHaveCount(2)
      await expect(video.locator("source").first()).toHaveAttribute(
        "type",
        "video/webm"
      )
      await expect.poll(() => requests.some((u) => u.includes(name))).toBe(true)
      await expect.poll(() => isPaused(page, i)).toBe(false)
      await expect(figure.getByRole("button", { name: pause })).toBeVisible()
    }
  })
}

test("off screen it pauses; the motion pause and a reader's pause stop it", async ({
  page,
}) => {
  const slug = WITH_CLIPS[0]
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoReady(page, `/work/${slug}`)
  const first = page.locator("[data-clip]").first()
  await centre(first)
  await expect.poll(() => isPaused(page, 0)).toBe(false)
  const at = await page.evaluate(() => scrollY)

  // Scrolled away: paused. Back: playing again.
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    })
  )
  await expect.poll(() => isPaused(page, 0)).toBe(true)
  // Back by position: at the page's end the sheet is scaled down (the
  // footer's recede), which would throw off scrollIntoView's geometry.
  await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), at)
  await expect.poll(() => isPaused(page, 0)).toBe(false)

  // The page's motion pause (`html[data-motion="paused"]`).
  await page.evaluate(
    () => (document.documentElement.dataset.motion = "paused")
  )
  await expect.poll(() => isPaused(page, 0)).toBe(true)
  await page.evaluate(() => delete document.documentElement.dataset.motion)
  await expect.poll(() => isPaused(page, 0)).toBe(false)

  // The reader's pause wins over the viewport from then on.
  await first.getByRole("button", { name: pause }).click()
  await expect(first.getByRole("button", { name: play })).toBeVisible()
  await page.evaluate(() =>
    scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    })
  )
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }))
  await page.waitForTimeout(500)
  expect(await isPaused(page, 0)).toBe(true)
})

test("the poster holds the square before the clip exists: no shift", async ({
  page,
}) => {
  const slug = WITH_CLIPS[0]
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoReady(page, `/work/${slug}`)
  const last = page.locator("[data-clip]").last()
  const frame = last.locator(".cs-sq-frame")
  const before = await frame.boundingBox()
  await centre(last)
  await expect(last.locator("video source")).toHaveCount(2)
  const after = await frame.boundingBox()
  expect(before!.width).toBeCloseTo(before!.height, 0)
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(1)
})
