import { expect, test, type Page } from "@playwright/test"

import { HOME } from "@/content/pages/home"

import { gotoReady } from "./helpers"

/**
 * The homepage dent (`HOME.dent`, `app/components/landing/dent/`). Its code
 * (vgpu, the shaders, the layer and its CSS) is requested only on `/`, on a
 * desktop with a mouse wider than 1024px without reduced motion, after
 * `load` and a first mouse move, and only when the browser has a WebGPU
 * adapter. These run in every browser, GPU or not; the drawing itself is
 * checked by `dent-gpu.spec.ts`, which needs a GPU and is opt-in.
 */

test.skip(!HOME.dent, "the dent is switched off in content")

/** Marks that exist only in the effect's own chunks (a shader label, its CSS). */
const MARKS = ["dent-step", ".dent-layer"]

/** Watches every script and stylesheet the page fetches for the effect's code. */
function watchEffect(page: Page) {
  const hits: string[] = []
  page.on("response", async (res) => {
    const url = res.url()
    if (!/\.(js|css)(\?|$)/.test(url)) return
    try {
      const body = await res.text()
      if (MARKS.some((m) => body.includes(m))) hits.push(url)
    } catch {
      // A response that went away with the page.
    }
  })
  return hits
}

async function settle(page: Page) {
  await page.waitForLoadState("load")
  await page.waitForTimeout(400)
}

async function moveAndPress(page: Page) {
  await page.mouse.move(150, 420)
  await page.mouse.move(170, 440)
  await page.waitForTimeout(2500)
  await page.mouse.down()
  await page.waitForTimeout(200)
  await page.mouse.up()
  await page.waitForTimeout(300)
}

test.describe("where the dent is off", () => {
  const cases: {
    name: string
    path: string
    width: number
    reduced?: boolean
  }[] = [
    { name: "/ with reduced motion", path: "/", width: 1440, reduced: true },
    { name: "/ at 1024", path: "/", width: 1024 },
    { name: "/ at 390", path: "/", width: 390 },
    { name: "/work", path: "/work", width: 1440 },
    { name: "/work/tenderlift", path: "/work/tenderlift", width: 1440 },
  ]
  for (const c of cases) {
    test(`${c.name}: no layer and none of its code, even after a press`, async ({
      page,
    }) => {
      if (c.reduced) await page.emulateMedia({ reducedMotion: "reduce" })
      await page.setViewportSize({ width: c.width, height: 900 })
      const hits = watchEffect(page)
      const errors: string[] = []
      page.on("pageerror", (e) => errors.push(e.message))
      await gotoReady(page, c.path)
      await settle(page)
      await moveAndPress(page)
      await expect(page.locator(".dent-layer, .dent-canvas")).toHaveCount(0)
      expect(hits).toEqual([])
      expect(errors).toEqual([])
    })
  }
})

test.describe("/ at 1440 with a mouse", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("nothing is fetched before the first mouse move; after it, only with a GPU", async ({
    page,
  }) => {
    const hits = watchEffect(page)
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    await gotoReady(page, "/")
    await settle(page)
    await page.waitForTimeout(2500)
    // Loaded and idle, and no mouse has moved: nothing.
    expect(hits).toEqual([])
    await expect(page.locator(".dent-layer")).toHaveCount(0)

    const adapter = await page.evaluate(async () => {
      const gpu = (
        navigator as Navigator & {
          gpu?: { requestAdapter(): Promise<object | null> }
        }
      ).gpu
      return Boolean(gpu && (await gpu.requestAdapter()))
    })
    await page.mouse.move(150, 420)
    await page.mouse.move(170, 440)
    if (adapter) {
      await expect.poll(() => hits.length, { timeout: 8000 }).toBeGreaterThan(0)
    } else {
      // No adapter (a browser without a GPU): the effect is not fetched.
      await page.waitForTimeout(2500)
      expect(hits).toEqual([])
    }
    // No layer until the first press, with or without a GPU.
    await expect(page.locator(".dent-layer")).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test("the effect stays out of the page's content", async ({ page }) => {
    await gotoReady(page, "/")
    await settle(page)
    await moveAndPress(page)
    // Nothing of the effect is inside the page's content.
    await expect(page.locator("main .dent-layer, main canvas")).toHaveCount(0)
    // Whatever the press did, the layer is decorative, empty and out of the way.
    const layer = page.locator(".dent-layer")
    if (await layer.count()) {
      await expect(layer).toHaveAttribute("aria-hidden", "true")
      await expect(layer).toHaveCSS("pointer-events", "none")
      await expect(layer).toHaveCSS("position", "absolute")
      expect(await layer.textContent()).toBe("")
    }
  })
})
