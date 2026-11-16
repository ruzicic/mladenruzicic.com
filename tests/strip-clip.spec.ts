import { expect, test, type Page } from "@playwright/test"

import type { CardClip, WorkCard } from "@/lib/content/schema"
import { HOME } from "@/content/pages/home"

import { gotoReady, HEADLINE_TOGGLE } from "./helpers"

/**
 * The product clips on the landing's "Recent work" cards
 * (`app/components/landing/CardClip.tsx`, rules shared with the story clips
 * through `useLazyClip`), for every card that has one, read from content.
 *
 * - The poster, with the clip's proportions, is in the HTML and holds the
 *   frame before any video byte is requested.
 * - The clip is requested only once its card is near the viewport AND in
 *   focus; only the card in focus plays, and it starts over on coming back.
 * - The page's pause control (the headline's) stops it.
 * - Under reduced motion, and without JavaScript, the poster is all there is.
 * - One take per viewport: phones get the narrow take only, desktop the
 *   wide one only.
 *
 * Several cards carry clips, so every request check counts only the files
 * of the card under test.
 */

const cards = HOME.recentWork.cards
const { nextLabel, prevLabel } = HOME.recentWork
const CLIP_CARDS = cards.flatMap((c, index) =>
  c.kind === "work" && c.media?.clip
    ? [{ index, entry: c as WorkCard, clip: c.media.clip as CardClip }]
    : []
)
if (CLIP_CARDS.length === 0) throw new Error("no strip card has a clip")

/** Which card the strip has in focus (the `data-on` flag StripRail writes). */
const focused = (page: Page) =>
  page
    .locator("[data-strip] > [data-card]")
    .evaluateAll((els) => els.findIndex((e) => e.hasAttribute("data-on")))

/** Steps the strip with its arrow buttons until card `i` is in focus. */
async function focusCard(page: Page, i: number) {
  for (let guard = 0; guard < cards.length; guard++) {
    const n = await focused(page)
    if (n === i) break
    await page
      .getByRole("button", { name: n < i ? nextLabel : prevLabel })
      .click()
    await expect.poll(() => focused(page)).not.toBe(n)
  }
  await expect.poll(() => focused(page)).toBe(i)
}

/** Puts card `i` in focus by scrolling the strip itself (no page scroll). */
async function scrollStripTo(page: Page, i: number) {
  await page.locator("[data-strip]").evaluate((s, i) => {
    const [a, b] = Array.from(s.children) as HTMLElement[]
    s.scrollTo({ left: i * (b.offsetLeft - a.offsetLeft), behavior: "instant" })
  }, i)
  await expect.poll(() => focused(page)).toBe(i)
}

for (const { index, entry, clip } of CLIP_CARDS) {
  const files = [clip, ...(clip.narrow ? [clip.narrow] : [])].flatMap((t) => [
    t.webm,
    t.mp4,
  ])

  /** This card's video requests (either take). */
  function clipRequests(page: Page): string[] {
    const seen: string[] = []
    page.on("request", (r) => {
      const url = decodeURIComponent(r.url())
      if (files.some((f) => url.includes(f))) seen.push(url)
    })
    return seen
  }

  const card = (page: Page) =>
    page.locator("[data-strip] > [data-card]").nth(index)
  const video = (page: Page) => card(page).locator("video")
  const paused = (page: Page) =>
    video(page).evaluate((v: HTMLVideoElement) => v.paused)
  const time = (page: Page) =>
    video(page).evaluate((v: HTMLVideoElement) => v.currentTime)
  /** A card beside this one. */
  const beside = index === 0 ? 1 : index - 1

  test.describe(`${entry.title}'s clip`, () => {
    test("the poster holds the frame before any video byte", async ({
      page,
    }) => {
      const requests = clipRequests(page)
      // A short viewport keeps the strip off screen (and out of the clips'
      // 200px look-ahead) while the page loads.
      await page.setViewportSize({ width: 1280, height: 520 })
      await gotoReady(page, "/")

      const poster = card(page).getByRole("img", { name: clip.alt })
      await expect(poster).toHaveCount(1)
      await expect(poster).toHaveAttribute("width", String(clip.width))
      await expect(poster).toHaveAttribute("height", String(clip.height))
      const box = await poster.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width / box!.height).toBeCloseTo(clip.width / clip.height, 1)

      // Muted, inline, no controls, nothing attached.
      await expect(video(page)).toHaveJSProperty("muted", true)
      await expect(video(page)).toHaveAttribute("playsinline", "")
      await expect(video(page)).toHaveAttribute("preload", "none")
      await expect(video(page)).not.toHaveAttribute("controls")
      await expect(video(page).locator("source")).toHaveCount(0)
      expect(requests).toEqual([])
    })

    test("the clip loads only near the viewport and in focus, and only the card in focus plays", async ({
      page,
    }) => {
      const requests = clipRequests(page)
      // Short, so the first card is not near the viewport at load.
      await page.setViewportSize({ width: 1280, height: 520 })
      await gotoReady(page, "/")

      // On screen, beside the card in focus: still nothing.
      // Beside it first (scrolling the strip while it is still off screen, so
      // this card is never near the viewport and in focus at once), then on
      // screen.
      await scrollStripTo(page, beside)
      await page.locator("[data-strip]").scrollIntoViewIfNeeded()
      await expect(card(page)).not.toHaveAttribute("data-on", "")
      await expect(card(page)).toBeInViewport({ ratio: 0.25 })
      await page.waitForTimeout(800)
      expect(requests).toEqual([])
      await expect(video(page).locator("source")).toHaveCount(0)

      // In focus: the webm first, then it plays. (Back to the project's
      // viewport, where the headline's pause button and the card share it; taller since the stance line was added.)
      await page.setViewportSize({ width: 1440, height: 1000 })
      await focusCard(page, index)
      await expect(video(page).locator("source")).toHaveCount(2)
      await expect(video(page).locator("source").first()).toHaveAttribute(
        "type",
        "video/webm"
      )
      await expect.poll(() => requests.length).toBeGreaterThan(0)
      await expect.poll(() => paused(page)).toBe(false)
      await expect
        .poll(() => time(page), { timeout: 10_000 })
        .toBeGreaterThan(2)

      // The page's pause control stops it, and Play lets it run again.
      const headline = page.getByRole("button", { name: HEADLINE_TOGGLE })
      await headline.click()
      await expect.poll(() => paused(page)).toBe(true)
      await headline.click()
      await expect.poll(() => paused(page)).toBe(false)
      await expect
        .poll(() => time(page), { timeout: 10_000 })
        .toBeGreaterThan(2)
      const before = await time(page)

      // Out of focus: paused, and the video steps aside for the poster.
      await focusCard(page, index + 1 < cards.length ? index + 1 : index - 1)
      await expect.poll(() => paused(page)).toBe(true)
      await expect(video(page)).toHaveCSS("opacity", "0")
      await expect(
        card(page).getByRole("img", { name: clip.alt })
      ).toBeVisible()

      // Back in focus: from the beginning.
      await focusCard(page, index)
      await expect.poll(() => paused(page)).toBe(false)
      expect(await time(page)).toBeLessThan(before)
    })

    test("under reduced motion the poster stays and no video is requested", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      const requests = clipRequests(page)
      await gotoReady(page, "/")
      await page.locator("[data-strip]").scrollIntoViewIfNeeded()
      await focusCard(page, index)
      await expect(card(page)).toHaveAttribute("data-on", "")
      await page.waitForTimeout(1000)

      expect(requests).toEqual([])
      await expect(video(page).locator("source")).toHaveCount(0)
      await expect(
        card(page).getByRole("img", { name: clip.alt })
      ).toBeVisible()
    })

    test.describe("without JavaScript", () => {
      test.use({ javaScriptEnabled: false })

      test("the poster shows, and no video is attached", async ({ page }) => {
        const requests = clipRequests(page)
        await page.goto("/")
        const poster = card(page).getByRole("img", { name: clip.alt })
        await poster.scrollIntoViewIfNeeded()
        await expect(poster).toBeVisible()
        await expect
          .poll(() =>
            poster.evaluate(
              (img: HTMLImageElement) => img.complete && img.naturalWidth
            )
          )
          .toBeGreaterThan(0)
        await expect(video(page).locator("source")).toHaveCount(0)
        expect(requests).toEqual([])
      })
    })

    /* One take per viewport ------------------------------------------------------ */

    const narrow = clip.narrow
    const wideFiles = [clip.webm, clip.mp4, clip.poster]
    const narrowFiles = narrow ? [narrow.webm, narrow.mp4, narrow.poster] : []

    /** Requests for either take's files, posters through next/image included. */
    function takeRequests(page: Page) {
      const seen = { wide: [] as string[], narrow: [] as string[] }
      page.on("request", (r) => {
        const url = decodeURIComponent(r.url())
        if (wideFiles.some((f) => url.includes(f))) seen.wide.push(url)
        if (narrowFiles.some((f) => url.includes(f))) seen.narrow.push(url)
      })
      return seen
    }

    const isVideo = (u: string) => /\.(webm|mp4)(\?|$)/.test(u)

    test.describe(`${entry.title}: one take per viewport`, () => {
      test.skip(!narrow, "the clip card has no narrow take")

      test.describe("at 390 wide", () => {
        test.use({ viewport: { width: 390, height: 844 } })

        test("only the narrow poster and video are requested", async ({
          page,
        }) => {
          const seen = takeRequests(page)
          await gotoReady(page, "/")
          await page.locator("[data-strip]").scrollIntoViewIfNeeded()
          // No arrows on phones: scroll the strip the way a swipe would.
          await scrollStripTo(page, index)

          await expect
            .poll(() => seen.narrow.some((u) => !isVideo(u)), "narrow poster")
            .toBe(true)
          await expect
            .poll(() => seen.narrow.some(isVideo), "narrow video")
            .toBe(true)
          await expect.poll(() => paused(page)).toBe(false)
          await page.waitForTimeout(500)
          expect(seen.wide).toEqual([])

          // The window is square and as wide as the card allows. Whole, it
          // sits above the title; with `fit: "bleed"` its frame runs past
          // the card's foot, under the caption band.
          const frame = await card(page)
            .getByRole("img", { name: clip.alt })
            .boundingBox()
          expect(frame!.width / frame!.height).toBeCloseTo(
            narrow!.width / narrow!.height,
            1
          )
          const box = (await card(page).boundingBox())!
          expect(frame!.width).toBeGreaterThan(box.width - 40)
          if (clip.fit === "bleed") {
            const win = (await card(page)
              .locator(".lc-clip-frame")
              .boundingBox())!
            expect(win.y + win.height).toBeGreaterThan(box.y + box.height)
          } else {
            const title = await card(page)
              .getByText(entry.title, { exact: true })
              .boundingBox()
            expect(frame!.y + frame!.height).toBeLessThanOrEqual(title!.y)
          }
        })
      })

      test("at 1440 wide only the wide poster and video are requested", async ({
        page,
      }) => {
        const seen = takeRequests(page)
        await gotoReady(page, "/")
        await page.locator("[data-strip]").scrollIntoViewIfNeeded()
        await focusCard(page, index)

        await expect
          .poll(() => seen.wide.some((u) => !isVideo(u)), "wide poster")
          .toBe(true)
        await expect
          .poll(() => seen.wide.some(isVideo), "wide video")
          .toBe(true)
        await expect.poll(() => paused(page)).toBe(false)
        await page.waitForTimeout(500)
        expect(seen.narrow).toEqual([])
      })
    })
  })
}
