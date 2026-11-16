import { expect, test, type Page } from "@playwright/test"

import { HOME } from "@/content/pages/home"

import { gotoReady } from "./helpers"

/**
 * The homepage dent drawn on a real GPU. Opt-in, because CI has no GPU:
 *
 *   DENT_GPU=1 PLAYWRIGHT_BASE_URL=http://localhost:3313 pnpm exec playwright test tests/dent-gpu.spec.ts
 *
 * Chromium needs `--enable-unsafe-webgpu` for WebGPU in automation (set
 * below); on macOS it then runs on Metal, headless included.
 */

const ON = process.env.DENT_GPU === "1"

test.use({
  viewport: { width: 1440, height: 900 },
  launchOptions: {
    args: [
      "--enable-unsafe-webgpu",
      ...(process.platform === "darwin" ? ["--use-angle=metal"] : []),
    ],
  },
})
test.skip(!ON || !HOME.dent, "set DENT_GPU=1 on a machine with a GPU")

/** Waits until the effect is ready: loaded, a mouse moved, device built. */
async function ready(page: Page) {
  const loaded = page.waitForResponse(
    async (res) =>
      /\.js(\?|$)/.test(res.url()) && (await res.text()).includes("dent-step"),
    { timeout: 15000 }
  )
  await gotoReady(page, "/")
  await page.waitForLoadState("load")
  await page.mouse.move(150, 420)
  await page.mouse.move(170, 440)
  await loaded
  // The device and its pipelines are built right after the import.
  await page.waitForTimeout(1500)
}

/**
 * The centre of the pixels that differ from the bare paper inside `box`,
 * page coordinates (the screenshot is of the viewport).
 */
async function dentCentre(
  page: Page,
  box: { x: number; y: number; width: number; height: number }
) {
  const png = (await page.screenshot({ clip: box })).toString("base64")
  return page.evaluate(
    async ({ data, box }) => {
      const img = new Image()
      img.src = `data:image/png;base64,${data}`
      await img.decode()
      const ctx = Object.assign(document.createElement("canvas"), {
        width: img.width,
        height: img.height,
      }).getContext("2d")!
      ctx.drawImage(img, 0, 0)
      const d = ctx.getImageData(0, 0, img.width, img.height).data
      const paper = [d[0], d[1], d[2]]
      let sx = 0
      let sy = 0
      let n = 0
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4
          const diff =
            Math.abs(d[i] - paper[0]) +
            Math.abs(d[i + 1] - paper[1]) +
            Math.abs(d[i + 2] - paper[2])
          if (diff > 12) {
            sx += x
            sy += y
            n++
          }
        }
      if (!n) return null
      const k = img.width / box.width
      return {
        x: box.x + sx / n / k + window.scrollX,
        y: box.y + sy / n / k + window.scrollY,
        n,
      }
    },
    { data: png, box }
  )
}

test("a held press dents the paper, and the dent stays put on the page as it scrolls", async ({
  page,
}) => {
  await ready(page)
  // Empty paper left of the text column, level with the story.
  const story = page.locator(".lp-para").first()
  const anchor = (await story.boundingBox())!
  const press = { x: anchor.x - 160, y: anchor.y + 20 }
  await page.mouse.move(press.x, press.y)
  await page.mouse.down()
  await page.waitForTimeout(500)
  await expect(page.locator(".dent-canvas")).toHaveCount(1)
  await page.mouse.up()
  await page.mouse.move(4, 4)
  // Let the springy part come back, so only the slow set is left: the
  // dent then holds its shape for the few frames the check takes.
  await page.waitForTimeout(2000)
  const box = { x: press.x - 70, y: press.y - 70, width: 140, height: 140 }
  const before = await dentCentre(page, box)
  expect(before, "the press shows on the canvas").not.toBeNull()
  const textBefore = await story.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + scrollX, y: r.top + scrollY }
  })

  // Scroll: the dent is part of the page and goes with it.
  await page.evaluate(() => window.scrollBy(0, 120))
  await page.waitForTimeout(100)
  const moved = { ...box, y: box.y - 120 }
  const after = await dentCentre(page, moved)
  expect(after).not.toBeNull()
  const textAfter = await story.evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + scrollX, y: r.top + scrollY }
  })
  // In page coordinates the dent and the text have not moved apart.
  const drift = {
    x: after!.x - textAfter.x - (before!.x - textBefore.x),
    y: after!.y - textAfter.y - (before!.y - textBefore.y),
  }
  expect(Math.abs(drift.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(drift.y)).toBeLessThanOrEqual(1)
})

test("a press that dents starts no text selection; a double click still selects a word", async ({
  page,
}) => {
  await ready(page)
  const para = page.locator(".lp-para").nth(1)
  const box = (await para.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 260, box.y + 30, { steps: 12 })
  await page.mouse.up()
  expect(await page.evaluate(() => getSelection()?.toString() ?? "")).toBe("")
  // A word in the middle of the first line.
  await page.mouse.dblclick(box.x + 120, box.y + 12)
  expect(
    (await page.evaluate(() => getSelection()?.toString() ?? "")).trim().length
  ).toBeGreaterThan(0)
})

test("no press dents on a link, a button or a strip card", async ({ page }) => {
  await ready(page)
  const card = page.locator("[data-card]").first()
  await card.scrollIntoViewIfNeeded()
  const c = (await card.boundingBox())!
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.mouse.up()
  await expect(page.locator(".dent-layer")).toHaveCount(0)
})

// The strip is dragged by hand (owner, 15 Nov 2026): a press or a drag that
// starts on it, on a card or in the gap between two, never dents the paper.
test("a press or a drag that starts on the strip never dents", async ({
  page,
}) => {
  await ready(page)
  const strip = page.locator("[data-strip]")
  await strip.scrollIntoViewIfNeeded()
  const [a, b] = await page
    .locator("[data-strip] > [data-card]")
    .evaluateAll((els) =>
      els.slice(0, 2).map((el) => el.getBoundingClientRect().toJSON())
    )
  // In the gap between the first two cards, then across a card.
  const gapX = (a.right + b.left) / 2
  const y = a.top + a.height / 2
  for (const [x, dx] of [
    [gapX, 0],
    [gapX, -200],
    [a.left + a.width / 2, -200],
  ]) {
    await page.mouse.move(x, y)
    await page.mouse.down()
    if (dx) await page.mouse.move(x + dx, y, { steps: 8 })
    await page.waitForTimeout(200)
    await page.mouse.up()
    await page.waitForTimeout(400)
  }
  await expect(page.locator(".dent-layer")).toHaveCount(0)
})

test("turning on reduced motion takes the effect down at once", async ({
  page,
}) => {
  await ready(page)
  await page.mouse.move(160, 500)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.mouse.up()
  await expect(page.locator(".dent-layer")).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect(page.locator(".dent-layer")).toHaveCount(0)
  // And a press does nothing now.
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.mouse.up()
  await expect(page.locator(".dent-layer")).toHaveCount(0)
})
