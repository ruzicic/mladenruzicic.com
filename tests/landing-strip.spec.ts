import { expect, test, type Locator, type Page } from "@playwright/test"

import { workCardSchema } from "@/lib/content/schema-pages"
import { HOME } from "@/content/pages/home"

import { gotoReady, projectLinks, timedDrag, touchSwipe } from "./helpers"

/**
 * "Recent work" by hand (owner, 15 Nov 2026: "click on unfocused items
 * scrolls to them; drag to move/swipe on mobile"), `StripRail.tsx` and the
 * strip's rules in `app/styles/landing.css`:
 *
 * - A click or tap on a card that is not in focus brings it into focus and
 *   does nothing else: not even its "Website" opens on that first click.
 * - On the card in focus, a click or tap off its pills, or Enter on the
 *   strip, goes where its first pill goes (owner, 16 Nov 2026: "make cards
 *   link to case study if it exists; then to website if it exists"),
 *   through that pill: the case study in this tab with the page
 *   transition, else the website in a new tab. The pills stay the card's
 *   only links.
 * - A mouse press that moves under 6px is a click. Past that it drags the
 *   strip 1:1, and the release settles on a card (the nearest; a flick, one
 *   further) without a click, a text selection or a native drag.
 * - On a phone, touch is native: a swipe moves exactly one card, a vertical
 *   swipe that starts on the strip scrolls the page.
 * - The vertical wheel over the strip still scrolls the page.
 */

const cards = HOME.recentWork.cards
const TOTAL = cards.length

const strip = (page: Page) => page.locator("[data-strip]")
const card = (page: Page, i: number) =>
  page.locator("[data-strip] > [data-card]").nth(i)
const counter = (page: Page) => page.locator("#recent-work .lp-count")
const left = (page: Page) => strip(page).evaluate((el) => el.scrollLeft)
const step = (page: Page) =>
  strip(page).evaluate((el) => {
    const [a, b] = Array.from(el.children) as HTMLElement[]
    return b.offsetLeft - a.offsetLeft
  })
/** Card `i` is in focus: counter, flag, and the strip at rest on it. */
async function expectFocus(page: Page, i: number) {
  await expect(counter(page)).toHaveText(`${i + 1} / ${TOTAL}`)
  await expect(card(page, i)).toHaveAttribute("data-on", "")
  const s = await step(page)
  const max = await strip(page).evaluate(
    (el) => el.scrollWidth - el.clientWidth
  )
  await expect.poll(() => left(page)).toBeCloseTo(Math.min(max, i * s), -0.5)
}

async function open(page: Page) {
  await gotoReady(page, "/")
  await strip(page).scrollIntoViewIfNeeded()
  await expectFocus(page, 0)
}

/** Every click that gets past the strip (bubble phase, on the document). */
async function countClicks(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __clicks: number }
    w.__clicks = 0
    document.addEventListener("click", () => w.__clicks++)
  })
  return () =>
    page.evaluate(() => (window as unknown as { __clicks: number }).__clicks)
}

/**
 * A plain mouse click at a point of `el` (fractions of its box), with no
 * scrolling into view first: Playwright's own `click()` would scroll the
 * strip itself and hide what the click did.
 */
async function clickAt(page: Page, el: Locator, fx = 0.5, fy = 0.5) {
  const b = (await el.boundingBox())!
  const x = Math.min(b.x + b.width * fx, page.viewportSize()!.width - 4)
  await page.mouse.click(Math.max(4, x), b.y + b.height * fy)
}

/**
 * A mouse drag by `dx` from the middle of `from`, in `steps` moves 16 ms
 * apart, released `hold` ms after the last: a fixed gesture on any machine
 * (`timedDrag` in helpers.ts).
 */
async function drag(
  page: Page,
  from: Locator,
  dx: number,
  { steps = 12, hold = 0 }: { steps?: number; hold?: number } = {}
) {
  const b = (await from.boundingBox())!
  await timedDrag(page, b.x + b.width / 2, b.y + b.height / 2, dx, {
    steps,
    hold,
  })
}

test.describe("click to focus", () => {
  test("a click on the second, then the third card brings each into focus", async ({
    page,
  }) => {
    await open(page)
    const clicks = await countClicks(page)
    await clickAt(page, card(page, 1), 0.3, 0.6)
    await expectFocus(page, 1)
    await clickAt(page, card(page, 2), 0.3, 0.6)
    await expectFocus(page, 2)
    // Back to one on the left.
    await clickAt(page, card(page, 1), 0.7, 0.6)
    await expectFocus(page, 1)
    // Those clicks only focused; none went on past the strip.
    expect(await clicks()).toBe(0)
    await expect(page).toHaveURL(/\/$/)
  })

  test("a card two places away comes straight into focus", async ({ page }) => {
    // Wide enough to see the third card from the first.
    await page.setViewportSize({ width: 2560, height: 1200 })
    await open(page)
    const b = (await card(page, 2).boundingBox())!
    expect(b.x).toBeLessThan(2560 - 100)
    await page.mouse.click(b.x + 60, b.y + b.height / 2)
    await expectFocus(page, 2)
  })

  test("the first click on an unfocused card's Website only focuses the card", async ({
    page,
    context,
  }) => {
    await context.route(/^https:\/\/(?!localhost)/, (r) =>
      r.fulfill({ status: 200, body: "ok" })
    )
    await open(page)
    const i = await page
      .locator("[data-strip] > [data-card]")
      .evaluateAll((els) =>
        els.findIndex(
          (e, j) =>
            j > 0 &&
            [...e.querySelectorAll("a")].some((a) => a.target === "_blank")
        )
      )
    expect(i, "a card past the first with a Website").toBeGreaterThan(0)
    // Walk to the card before it, so the Website is on screen.
    for (let j = 1; j < i; j++) {
      await clickAt(page, card(page, j), 0.3, 0.6)
      await expectFocus(page, j)
    }
    const web = card(page, i).locator('a[target="_blank"]')
    let popups = 0
    context.on("page", () => popups++)
    await clickAt(page, web)
    await expectFocus(page, i)
    await page.waitForTimeout(500)
    expect(popups, "no new tab on the first click").toBe(0)
    await expect(page).toHaveURL(/\/$/)
    // In focus now, it works.
    const popup = context.waitForEvent("page")
    await clickAt(page, web)
    await (await popup).close()
  })

  test("the end card: the first click focuses it, the next one goes to /work", async ({
    page,
  }) => {
    await open(page)
    const end = page.locator("[data-strip] > .lc-end")
    await strip(page).evaluate((el) => {
      const [a, b] = Array.from(el.children) as HTMLElement[]
      el.scrollTo({
        left: (el.children.length - 2) * (b.offsetLeft - a.offsetLeft),
      })
    })
    await expectFocus(page, TOTAL - 2)
    await clickAt(page, end, 0.3, 0.5)
    await expectFocus(page, TOTAL - 1)
    await expect(page).toHaveURL(/\/$/)
    await clickAt(page, end, 0.5, 0.5)
    await expect(page).toHaveURL(/\/work$/)
  })
})

/** Each work card's links, from the product, by its place in the strip. */
const LINKS = cards.map((c) =>
  c.kind === "work" ? projectLinks(c.ref, c.title) : undefined
)
const firstWith = (want: (l: (typeof LINKS)[number]) => boolean) =>
  LINKS.findIndex((l, i) => i > 0 && cards[i].kind === "work" && want(l))

/** Brings card `i` into focus by its arrows' route: the strip's keys. */
async function focusCard(page: Page, i: number) {
  await strip(page).focus()
  for (let j = 0; j < i; j++) await page.keyboard.press("ArrowRight")
  await expectFocus(page, i)
}

test.describe("the card in focus goes where its first pill goes", () => {
  test("a click on the card's picture goes to its case study, in this tab, with the transition", async ({
    page,
  }) => {
    const tl = LINKS[0]
    expect(tl?.caseStudy, "the first card has a case study").toBeTruthy()
    await open(page)
    // A full page load would lose this; a client navigation keeps it.
    await page.evaluate(
      () => ((window as unknown as { __kept: number }).__kept = 1)
    )
    await clickAt(page, card(page, 0), 0.5, 0.55)
    await expect(page).toHaveURL(new RegExp(`${tl!.caseStudy!.href}$`))
    expect(
      await page.evaluate(
        () => (window as unknown as { __kept?: number }).__kept
      )
    ).toBe(1)
  })

  test("a card with a website and no case study opens the website in a new tab", async ({
    page,
    context,
  }) => {
    const i = firstWith((l) => !!l && !l.caseStudy && !!l.website)
    test.skip(i < 0, "no card with only a website")
    await context.route(/^https:\/\/(?!localhost)/, (r) =>
      r.fulfill({ status: 200, body: "ok" })
    )
    await open(page)
    await focusCard(page, i)
    const popup = context.waitForEvent("page")
    await clickAt(page, card(page, i), 0.5, 0.55)
    const tab = await popup
    await expect(tab).toHaveURL(LINKS[i]!.website!.href.replace(/\/?$/, "/"))
    await tab.close()
    await expect(page).toHaveURL(/\/$/)
  })

  test("a card with neither link goes nowhere", async ({ page }) => {
    const i = firstWith((l) => !!l && !l.caseStudy && !l.website)
    test.skip(i < 0, "every card has a link today")
    await open(page)
    await focusCard(page, i)
    await clickAt(page, card(page, i), 0.5, 0.55)
    await page.waitForTimeout(400)
    await expect(page).toHaveURL(/\/$/)
  })

  test("the pills stay the card's only links: one marked primary, named, nothing nested", async ({
    page,
  }) => {
    await open(page)
    for (const [i, l] of LINKS.entries()) {
      if (!l) continue
      const c = card(page, i)
      expect(await c.evaluate((el) => el.tagName)).toBe("DIV")
      await expect(c).not.toHaveAttribute("role", /.+/)
      await expect(c).not.toHaveAttribute("tabindex", /.+/)
      await expect(c.locator("a a, a button, button a")).toHaveCount(0)
      const primary = c.locator("a[data-rail-primary]")
      const want = l.caseStudy ?? l.website
      await expect(primary).toHaveCount(want ? 1 : 0)
      if (want) {
        await expect(primary).toHaveAttribute("href", want.href)
        await expect(primary).toHaveAccessibleName(want.name)
      }
    }
  })

  test("Enter on the strip follows the card in focus; a pill in keyboard focus shows its ring", async ({
    page,
  }) => {
    await open(page)
    await strip(page).focus()
    await page.keyboard.press("ArrowRight")
    await expectFocus(page, 1)
    // Tab reaches the pill, which wears the focus ring.
    await page.keyboard.press("ArrowLeft")
    await expectFocus(page, 0)
    await page.keyboard.press("Tab")
    const pill = card(page, 0).locator("a[data-rail-primary]")
    await expect(pill).toBeFocused()
    await expect(pill).toHaveCSS("outline-style", "solid")
    await strip(page).focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(new RegExp(`${LINKS[0]!.caseStudy!.href}$`))
  })

  test("a drag that starts on the card's picture never navigates", async ({
    page,
  }) => {
    await open(page)
    const clicks = await countClicks(page)
    await drag(page, card(page, 0), -300)
    await expectFocus(page, 1)
    await drag(page, card(page, 1), 300)
    await expectFocus(page, 0)
    await page.waitForTimeout(300)
    expect(await clicks()).toBe(0)
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe("mouse drag", () => {
  test("a quick 300px drag moves one card and clicks nothing", async ({
    page,
  }) => {
    await open(page)
    const clicks = await countClicks(page)
    // Pressed on the focused card's first action: a click there would go.
    const act = card(page, 0).locator(".lc-act").first()
    await expect(act).toBeVisible()
    await drag(page, act, -300)
    await expectFocus(page, 1)
    expect(await clicks()).toBe(0)
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => String(getSelection()))).toBe("")
    // And back.
    await drag(page, card(page, 1), 300)
    await expectFocus(page, 0)
  })

  test("the strip follows the pointer 1:1 and is held snap-free while dragged", async ({
    page,
  }) => {
    await open(page)
    const b = (await card(page, 0).boundingBox())!
    const x = b.x + b.width / 2
    const y = b.y + 200
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 150, y, { steps: 6 })
    expect(await left(page)).toBe(150)
    await expect(strip(page)).toHaveAttribute("data-dragging", "")
    expect(
      await strip(page).evaluate((el) => getComputedStyle(el).scrollSnapType)
    ).toBe("none")
    expect(
      await card(page, 0).evaluate((el) => getComputedStyle(el).cursor)
    ).toBe("grabbing")
    await page.mouse.move(x - 200, y, { steps: 2 })
    expect(await left(page)).toBe(200)
    await page.waitForTimeout(200)
    await page.mouse.up()
    // Held still before the release: no flick, the nearest card.
    await expectFocus(page, 0)
    await expect(strip(page)).not.toHaveAttribute("data-dragging", "")
    await expect(strip(page)).not.toHaveAttribute("data-free", "")
  })

  test("a slow drag past half a card settles on the next; a held short one on the same", async ({
    page,
  }) => {
    await open(page)
    const s = await step(page)
    await drag(page, card(page, 0), -(s / 2 + 60), { steps: 20, hold: 200 })
    await expectFocus(page, 1)
    await drag(page, card(page, 1), -150, { steps: 10, hold: 200 })
    await expectFocus(page, 1)
  })

  test("a press that moves 3px is a click", async ({ page }) => {
    await open(page)
    const b = (await card(page, 1).boundingBox())!
    const x = b.x + 120
    const y = b.y + b.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 3, y, { steps: 3 })
    await page.mouse.up()
    await expectFocus(page, 1)
    await expect(strip(page)).not.toHaveAttribute("data-dragging", "")
  })

  test("dragging past either end does not overscroll or jump", async ({
    page,
  }) => {
    await open(page)
    const b = (await card(page, 0).boundingBox())!
    const y = b.y + 200
    await page.mouse.move(b.x + 200, y)
    await page.mouse.down()
    await page.mouse.move(b.x + 500, y, { steps: 6 })
    expect(await left(page)).toBe(0)
    // Back the other way moves at once: nothing was stored past the edge.
    await page.mouse.move(b.x + 450, y, { steps: 2 })
    expect(await left(page)).toBe(50)
    await page.waitForTimeout(200)
    await page.mouse.up()
    await expectFocus(page, 0)

    await page.locator("#recent-work .lp-strip").focus()
    await page.keyboard.press("End")
    await expectFocus(page, TOTAL - 1)
    const max = await left(page)
    const e = (await card(page, TOTAL - 1).boundingBox())!
    await page.mouse.move(e.x + 400, y)
    await page.mouse.down()
    await page.mouse.move(e.x + 100, y, { steps: 6 })
    expect(await left(page)).toBe(max)
    await page.mouse.up()
    await expectFocus(page, TOTAL - 1)
    // The drag ended on the end card (a link): no click, no navigation.
    await page.waitForTimeout(300)
    await expect(page).toHaveURL(/\/$/)
  })

  test("pictures and links never start a native drag", async ({ page }) => {
    await open(page)
    await page.evaluate(() => {
      const w = window as unknown as { __drags: number }
      w.__drags = 0
      document.addEventListener("dragstart", (e) => {
        if (!e.defaultPrevented) w.__drags++
      })
    })
    for (const sel of ["img", ".lc-act"]) {
      const el = card(page, 0).locator(sel).first()
      if (!(await el.count())) continue
      await drag(page, el, -120, { hold: 150 })
    }
    expect(
      await page.evaluate(
        () => (window as unknown as { __drags: number }).__drags
      )
    ).toBe(0)
  })

  test("cursors: grab on a card, pointer on the card in focus and on its actions", async ({
    page,
  }) => {
    await open(page)
    expect(
      await card(page, 1).evaluate((el) => getComputedStyle(el).cursor)
    ).toBe("grab")
    expect(
      await card(page, 0).evaluate((el) => getComputedStyle(el).cursor)
    ).toBe("pointer")
    expect(
      await card(page, 0)
        .locator(".lc-act")
        .first()
        .evaluate((el) => getComputedStyle(el).cursor)
    ).toBe("pointer")
  })

  test("the clip of the card brought into focus plays; the one left stops", async ({
    page,
  }) => {
    const i = cards.findIndex((c) => c.kind === "work" && c.media?.clip)
    test.skip(i < 0, "no clip card")
    await open(page)
    const video = card(page, i).locator("video")
    const paused = () =>
      video.evaluate((v: HTMLVideoElement) => v.paused).catch(() => true)
    for (let j = 1; j <= i; j++) {
      await drag(page, card(page, j - 1), -300)
      await expectFocus(page, j)
    }
    await expect.poll(paused).toBe(false)
    await drag(page, card(page, i), i + 1 < TOTAL ? -300 : 300)
    await expect.poll(paused).toBe(true)
  })
})

test("the vertical wheel over the strip scrolls the page", async ({ page }) => {
  await open(page)
  const b = (await card(page, 0).boundingBox())!
  await page.mouse.move(b.x + 200, b.y + 200)
  const y0 = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, 300)
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(y0 + 200)
  expect(await left(page)).toBe(0)
})

test.describe("touch at 390", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })

  /** A native touch swipe (CDP touch events; see `touchSwipe`). */
  async function swipe(page: Page, dx: number, dy: number, speed: number) {
    const b = (await strip(page).boundingBox())!
    await touchSwipe(
      page,
      b.x + (dx < 0 ? 300 : 80),
      b.y + (dy < 0 ? 300 : 120),
      dx,
      dy,
      speed
    )
  }

  for (const speed of [400, 1500, 4000]) {
    test(`a swipe at ${speed}px/s moves exactly one card`, async ({ page }) => {
      await open(page)
      await swipe(page, -200, 0, speed)
      await expectFocus(page, 1)
      await swipe(page, 200, 0, speed)
      await expectFocus(page, 0)
    })
  }

  test("a vertical swipe that starts on the strip scrolls the page", async ({
    page,
  }) => {
    await open(page)
    const y0 = await page.evaluate(() => scrollY)
    await swipe(page, 0, -240, 800)
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(y0 + 150)
    expect(await left(page)).toBe(0)
  })

  test("a tap on the card peeking in brings it into focus", async ({
    page,
  }) => {
    await open(page)
    const b = (await card(page, 1).boundingBox())!
    await page.touchscreen.tap(Math.min(b.x + 30, 380), b.y + b.height / 2)
    await expectFocus(page, 1)
    await expect(page).toHaveURL(/\/$/)
  })

  test("a tap on the card in focus goes to its case study", async ({
    page,
  }) => {
    await open(page)
    const b = (await card(page, 0).boundingBox())!
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height * 0.55)
    await expect(page).toHaveURL(new RegExp(`${LINKS[0]!.caseStudy!.href}$`))
  })
})

/**
 * Status pills (owner, 16 Nov 2026: "remove \"live\" and \"day job\" from
 * cards", then "remove \"autopilot\" tags from carousel on homepage"): the
 * schema refuses the three words, and the strip shows only the pills
 * content still gives.
 */
test.describe("status pills on the strip", () => {
  test("LIVE, DAY JOB and AUTOPILOT are refused by the schema", () => {
    const base = cards.find((c) => c.kind === "work")!
    for (const word of ["LIVE", "Day job", "AUTOPILOT", " autopilot "])
      expect(
        workCardSchema.safeParse({ ...base, pill: word }).success,
        word
      ).toBe(false)
    expect(
      workCardSchema.safeParse({ ...base, pill: "2021 TO 2023" }).success
    ).toBe(true)
  })

  test("the strip shows only the pills content keeps", async ({ page }) => {
    await gotoReady(page, "/")
    const shown = await page
      .locator("[data-strip] span.lc-pill")
      .allTextContents()
    expect(shown.map((t) => t.trim())).toEqual(["2021 TO 2023"])
  })
})
