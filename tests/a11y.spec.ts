import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"

import { gotoReady, LIST, LIST_ROWS, LIST_TOGGLE, PAGES } from "./helpers"

/**
 * axe on every page, at desktop and at phone size, plus the states that put
 * new UI on screen: the Ask panel open and the list expanded, and the strip's
 * cards out of focus. WCAG 2.0 / 2.1 / 2.2, levels A and AA. No rule is
 * disabled; any violation of any impact fails.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"]

type Rgb = [number, number, number]

function parseHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The one color-contrast case axe cannot judge. The Ask button's label is
 * drawn with `mix-blend-mode: difference` (the board's inverting label over
 * the cell fill), and axe reads the label's own colour (#ebebe9) instead of
 * the colour that reaches the screen, |label - background|. For nodes whose
 * computed `mix-blend-mode` is `difference`, this recomputes the painted
 * colour from the colours axe reports and keeps the violation only if the
 * real contrast is still under the threshold axe asked for. The rule stays
 * on for everything else, and for these nodes too.
 */
async function blendedContrastPasses(
  page: Page,
  node: {
    target: unknown[]
    any: { data?: unknown }[]
  }
): Promise<boolean> {
  const selector = node.target.at(-1)
  if (typeof selector !== "string") return false
  const blend = await page
    .locator(selector)
    .first()
    .evaluate((el) => getComputedStyle(el).mixBlendMode)
    .catch(() => "")
  if (blend !== "difference") return false
  const data = node.any[0]?.data as
    | { fgColor?: string; bgColor?: string; expectedContrastRatio?: string }
    | undefined
  const fg = parseHex(data?.fgColor ?? "")
  const bg = parseHex(data?.bgColor ?? "")
  if (!fg || !bg) return false
  const painted: Rgb = [
    Math.abs(fg[0] - bg[0]),
    Math.abs(fg[1] - bg[1]),
    Math.abs(fg[2] - bg[2]),
  ]
  const needed = parseFloat(data?.expectedContrastRatio ?? "4.5") || 4.5
  return contrast(painted, bg) >= needed
}

async function audit(
  page: Page,
  label: string,
  { exclude = [] as string[] } = {}
) {
  let builder = new AxeBuilder({ page }).withTags(TAGS)
  for (const sel of exclude) builder = builder.exclude(sel)
  const results = await builder.analyze()
  for (const v of results.violations) {
    if (v.id !== "color-contrast") continue
    const kept = []
    for (const n of v.nodes)
      if (!(await blendedContrastPasses(page, n))) kept.push(n)
    v.nodes = kept
  }
  results.violations = results.violations.filter((v) => v.nodes.length > 0)
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n` +
      v.nodes
        .slice(0, 5)
        .map((n) => `    ${n.target.join(" ")}: ${n.failureSummary ?? ""}`)
        .join("\n")
  )
  expect(summary, `axe violations on ${label}`).toEqual([])
}

/** Waits for the finite, time-based animations inside `root` to end. */
async function settle(root: Locator) {
  await root.evaluate((el) =>
    Promise.all(
      el
        .getAnimations({ subtree: true })
        .filter(
          (a) =>
            a.timeline === document.timeline &&
            a.effect?.getComputedTiming().iterations !== Infinity
        )
        .map((a) => a.finished.catch(() => undefined))
    )
  )
}

/** Parks the pointer off the content, so no hover state is audited. */
async function parkPointer(page: Page) {
  await page.mouse.move(1, 1)
}

const SIZES = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, touch: false },
  { name: "phone", viewport: { width: 390, height: 844 }, touch: true },
] as const

for (const size of SIZES) {
  test.describe(`${size.name} ${size.viewport.width}x${size.viewport.height}`, () => {
    test.use({ viewport: size.viewport, hasTouch: size.touch })

    for (const path of PAGES) {
      test(`${path}`, async ({ page }) => {
        await gotoReady(page, path)
        await parkPointer(page)
        await audit(page, `${path} at ${size.name} size`)
      })
    }

    test("/ with the Ask panel open", async ({ page }) => {
      await gotoReady(page, "/")
      await page
        .getByRole("banner")
        .getByRole("button", { name: ASK.ariaOpen })
        .click()
      const dialog = page.getByRole("dialog", { name: ASK.title })
      await expect(dialog).toBeVisible()
      await expect(page.locator("html")).toHaveAttribute("data-ask-open", "")
      await expect(dialog.getByRole("textbox")).toBeVisible()
      await settle(dialog)
      await parkPointer(page)
      await audit(page, `/ with Ask open (${size.name})`)
    })

    test("/ with the list expanded", async ({ page }) => {
      await gotoReady(page, "/")
      const list = page.getByRole("region", { name: LIST.title })
      const toggle = list.getByRole("button", { name: LIST_TOGGLE })
      await toggle.focus()
      await page.keyboard.press("Enter")
      await expect(toggle).toHaveAttribute("aria-expanded", "true")
      await expect(list.getByRole("listitem")).toHaveCount(LIST_ROWS)
      await settle(list)
      await parkPointer(page)
      await audit(page, `/ with the list expanded (${size.name})`)
    })
  })
}

/**
 * The strip's cards out of focus. The board faded a sat-back card as a
 * whole (50%, 55% on phones), which took its pills, title and caption to
 * 1.2 to 2.2:1. Now a card washes towards paper like a faded print (owner,
 * 12 Nov): the media loses colour and contrast and a paper veil rises over
 * the media and the plate, but the veil sits under the scrim and the words,
 * so the pills, the title and the caption, and the scrim and blur behind
 * them, are drawn at full strength at every value of `--lc-f`. The end card
 * is the exception: its veil lies over its words too, so it is measured from
 * pixels below rather than held to this structure.
 *
 * axe cannot composite text over the scrim and the screenshots (it reports
 * those nodes as "incomplete", not as passes), so the second test holds the
 * structure that makes the contrast hold, and the third measures every
 * title out of focus from the pixels on screen.
 */
const TEXT_LAYERS = [".lc-pill", ".lc-title", ".lc-cap", ".lc-shade"]

/**
 * The highest relative luminance in a PNG, decoded in the page: the
 * lightest pixel behind white text is its worst case.
 */
async function maxLuminance(page: Page, png: Buffer): Promise<number> {
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement("canvas")
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    const ctx = c.getContext("2d")!
    ctx.drawImage(img, 0, 0)
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    const lin = (v: number) => {
      const s = v / 255
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    let max = 0
    for (let i = 0; i < d.length; i += 4)
      max = Math.max(
        max,
        0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2])
      )
    return max
  }, png.toString("base64"))
}

for (const size of SIZES) {
  test.describe(`strip cards out of focus, ${size.name}`, () => {
    test.use({ viewport: size.viewport, hasTouch: size.touch })

    test("axe finds no contrast failure at rest or mid-strip", async ({
      page,
    }) => {
      await gotoReady(page, "/")
      await parkPointer(page)
      const strip = page.locator("[data-strip]")
      await strip.scrollIntoViewIfNeeded()
      // A screenshot card, a poster card, the clip card, a light shop card
      // and the end card, each in focus with the rest washed.
      const count = await strip.locator(":scope > [data-card]").count()
      for (const card of [0, 1, 2, 5, count - 1]) {
        await strip.evaluate((el, i) => {
          const c = el.children[i] as HTMLElement
          const first = el.children[0] as HTMLElement
          el.scrollTo({
            left: c.offsetLeft - first.offsetLeft,
            behavior: "instant",
          })
        }, card)
        await expect(strip.locator(":scope > [data-on]")).toHaveCount(1)
        await expect
          .poll(() =>
            strip.evaluate(
              (el) => el.querySelectorAll(":scope > :not([data-on])").length
            )
          )
          .toBeGreaterThan(0)
        await page.waitForTimeout(400) // the 240ms --lc-f transition
        const results = await new AxeBuilder({ page })
          .include("[data-strip]")
          .withRules(["color-contrast"])
          .analyze()
        expect(
          results.violations.flatMap((v) => v.nodes.map((n) => n.target)),
          `contrast with card ${card + 1} in focus`
        ).toEqual([])
      }
    })

    test("words and their scrim do not fade with --lc-f", async ({ page }) => {
      await gotoReady(page, "/")
      const layers = await page.evaluate((sels) => {
        const strip = document.querySelector("[data-strip]")!
        // The opacity a layer is painted with: its own and every ancestor's
        // up to and including the card.
        const painted = (el: Element, card: Element) => {
          let o = 1
          for (let e: Element | null = el; e; e = e.parentElement) {
            o *= parseFloat(getComputedStyle(e).opacity)
            if (e === card) break
          }
          return o
        }
        const out: { card: number; sel: string; f: number; o: number }[] = []
        Array.from(strip.children).forEach((card, i) => {
          const c = card as HTMLElement
          for (const f of [1, 0.5, 0]) {
            c.style.setProperty("--lc-f", String(f), "important")
            for (const sel of sels)
              for (const el of c.querySelectorAll(sel))
                out.push({ card: i, sel, f, o: painted(el, c) })
          }
          c.style.removeProperty("--lc-f")
        })
        return out
      }, TEXT_LAYERS)
      expect(layers.length).toBeGreaterThan(0)
      for (const l of layers.filter((l) => l.f !== 1)) {
        const full = layers.find(
          (m) => m.card === l.card && m.sel === l.sel && m.f === 1
        )!
        expect(l.o, `card ${l.card + 1} ${l.sel} at --lc-f ${l.f}`).toBe(full.o)
      }
      // The card itself never fades.
      const cards = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("[data-strip] > *"),
          (c) => getComputedStyle(c).opacity
        )
      )
      expect(new Set(cards)).toEqual(new Set(["1"]))
    })

    test("every title keeps 4.5:1 out of focus, measured from pixels", async ({
      page,
    }) => {
      await gotoReady(page, "/")
      await parkPointer(page)
      const strip = page.locator("[data-strip]")
      await strip.scrollIntoViewIfNeeded()
      // Every card held fully out of focus, with nothing moving.
      await page.addStyleTag({
        content:
          ".lc{--lc-f:0!important;animation:none!important;transition:none!important}.lc-shot{animation:none!important}",
      })
      const count = await strip.locator(":scope > [data-card]").count()
      for (let i = 0; i < count; i++) {
        await strip.evaluate((el, i) => {
          const c = el.children[i] as HTMLElement
          const first = el.children[0] as HTMLElement
          el.scrollTo({
            left: c.offsetLeft - first.offsetLeft,
            behavior: "instant",
          })
        }, i)
        const card = strip.locator(":scope > [data-card]").nth(i)
        const title = card.locator(".lc-title, .lc-end-line").first()
        await expect(title).toBeInViewport()
        const box = (await title.boundingBox())!
        // The lightest pixel of the glyphs, and of what is behind them.
        const text = await maxLuminance(
          page,
          await page.screenshot({ clip: box })
        )
        await title.evaluate((e) =>
          [e, ...e.querySelectorAll<HTMLElement>("*")].forEach((x) =>
            x.style.setProperty("color", "transparent", "important")
          )
        )
        const behind = await maxLuminance(
          page,
          await page.screenshot({ clip: box })
        )
        const ratio = (text + 0.05) / (behind + 0.05)
        expect(
          ratio,
          `card ${i + 1} title: ${ratio.toFixed(2)}:1 out of focus`
        ).toBeGreaterThanOrEqual(4.5)
      }
    })
  })
}
