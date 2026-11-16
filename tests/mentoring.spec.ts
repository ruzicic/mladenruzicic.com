import { expect, test, type Locator, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"
import { MENTORING } from "@/content/pages/mentoring"

import { collectConsoleErrors, finishAnimations, gotoReady } from "./helpers"

/**
 * `/mentoring` (Desktop Chrome): the numbers row under the intro, the pile
 * handled like paper (tap, throw, spring-back, rapid taps), the fit marks,
 * and the haptic calls (one per manual send-to-back, none otherwise, and
 * nothing at all where the platform has no haptics).
 */

const said = MENTORING.said
const total = said.pile.length

async function openPile(page: Page) {
  await gotoReady(page, "/mentoring")
  const pile = page.getByRole("region", { name: said.title })
  await pile.scrollIntoViewIfNeeded()
  const counter = pile.getByRole("button", {
    name: /^\d+ \/ \d+, testimonial/,
  })
  return { pile, counter }
}

/** Holds the cycle, so only the test moves the pile. */
async function pause(pile: Locator) {
  await pile.getByRole("button", { name: said.pauseLabel }).click()
  await expect(pile.getByRole("button", { name: said.playLabel })).toBeVisible()
}

/** The top card's centre, in page coordinates. */
async function topCentre(pile: Locator) {
  const box = await pile.locator('figure[data-pos="0"]').boundingBox()
  if (!box) throw new Error("no top card")
  return { x: box.x + box.width / 2, y: box.y + box.height / 3 }
}

async function drag(page: Page, from: { x: number; y: number }, dx: number) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(from.x + (dx * i) / steps, from.y + i)
    // A steady hand: no flick, so only the distance decides.
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(120)
  await page.mouse.up()
}

/** Waits until no card is in the air. */
async function settled(pile: Locator) {
  await expect(pile.locator("figure[data-fly]")).toHaveCount(0, {
    timeout: 3_000,
  })
  await expect(pile.locator('figure[data-pos="0"]')).toHaveCount(1)
}

test.describe("numbers row", () => {
  test("three figures, value first, and the reviews link", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const head = page.getByRole("main").locator(".ment-head")
    const items = head.getByRole("list").getByRole("listitem")
    await expect(items).toHaveCount(MENTORING.numbers.length)
    await expect(items).toHaveCount(3)
    await expect(head).not.toContainText("mentoring since")
    for (const [i, n] of MENTORING.numbers.entries()) {
      await expect(items.nth(i)).toHaveText(
        new RegExp(`^${n.value.replace(".", "\\.")}\\s+${n.label}`)
      )
    }
    const reviews = MENTORING.numbers.find((n) => n.href)!
    const link = items.getByRole("link", { name: new RegExp(reviews.label) })
    await expect(link).toHaveAttribute("href", reviews.href!)
    await expect(link).toHaveAttribute("target", "_blank")

    // One row of three: every figure on the same line, and the row has no
    // empty fourth column (the last figure ends near the column's end).
    const tops = await items.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top))
    )
    expect(new Set(tops).size).toBe(1)
    const cols = await head
      .locator(".ment-nums")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" "))
    expect(cols).toHaveLength(3)
  })

  test("the same row of three on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoReady(page, "/mentoring")
    const items = page.locator(".ment-nums > li")
    await expect(items).toHaveCount(3)
    const tops = await items.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().top))
    )
    expect(new Set(tops).size).toBe(1)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
  })
})

test.describe("testimonial pile", () => {
  test(`all ${total} figures are in the DOM`, async ({ page }) => {
    const { pile } = await openPile(page)
    await expect(pile.getByRole("figure")).toHaveCount(total)
  })

  test("a tap sends the top card to the back", async ({ page }) => {
    const { pile, counter } = await openPile(page)
    await pause(pile)
    const first = await pile.locator('figure[data-pos="0"]').innerText()
    await page.mouse.click(
      ...(Object.values(await topCentre(pile)) as [number, number])
    )
    await expect(counter).toHaveText(`2 / ${total}`)
    await settled(pile)
    expect(await pile.locator('figure[data-pos="0"]').innerText()).not.toBe(
      first
    )
  })

  test("a drag past the threshold throws the card", async ({ page }) => {
    const { pile, counter } = await openPile(page)
    await pause(pile)
    await drag(page, await topCentre(pile), 160)
    await expect(counter).toHaveText(`2 / ${total}`)
    await settled(pile)
  })

  test("a short drag springs back", async ({ page }) => {
    const { pile, counter } = await openPile(page)
    await pause(pile)
    const top = pile.locator('figure[data-pos="0"]')
    const before = await top.boundingBox()
    await drag(page, await topCentre(pile), 40)
    await page.waitForTimeout(900)
    await expect(counter).toHaveText(`1 / ${total}`)
    // Back where it was, with nothing left written on it.
    const after = await top.boundingBox()
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(1.5)
    expect(await top.evaluate((el) => el.style.transform)).toBe("")
  })

  test("rapid taps keep the order", async ({ page }) => {
    const { pile, counter } = await openPile(page)
    await pause(pile)
    const at = Object.values(await topCentre(pile)) as [number, number]
    for (let i = 0; i < 4; i++) await page.mouse.click(...at)
    await expect(counter).toHaveText(`5 / ${total}`)
    await settled(pile)
    // The pile's slots are whole: one card in each of the four visible ones.
    for (const pos of ["0", "1", "2", "3"])
      await expect(pile.locator(`figure[data-pos="${pos}"]`)).toHaveCount(1)
    // And no thrown card is stranded in view: the waiting ones fade out at
    // the back once they land.
    await expect
      .poll(() =>
        pile
          .locator('figure[data-pos="out"]')
          .evaluateAll(
            (els) =>
              els.filter((el) => getComputedStyle(el).opacity !== "0").length
          )
      )
      .toBe(0)
  })
})

/*
 * By touch (owner, 16 Nov 2026: "disable scroll while dragging testimonial
 * cards"): a sideways drag, or a drag after a short hold, moves the card and
 * never the page; a quick vertical swipe that starts on a card is still the
 * page scrolling. Chromium only: touches go through CDP.
 */
test.describe("testimonial pile by touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })

  test("a drag holds the page still; a quick vertical swipe scrolls it", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "touch through CDP")
    const { pile, counter } = await openPile(page)
    await pile.getByRole("button", { name: said.pauseLabel }).tap()
    await expect(
      pile.getByRole("button", { name: said.playLabel })
    ).toBeVisible()
    const box = (await pile.locator(".ment-pile").boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    const cdp = await page.context().newCDPSession(page)
    const scrollY = () => page.evaluate(() => Math.round(window.scrollY))
    const gesture = async (
      dx: number,
      dy: number,
      { hold = 0, steps = 12, stepMs = 30 } = {}
    ) => {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      })
      if (hold) await page.waitForTimeout(hold)
      for (let i = 1; i <= steps; i++) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x + (dx * i) / steps, y: y + (dy * i) / steps }],
        })
        await page.waitForTimeout(stepMs)
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      })
      await page.waitForTimeout(600)
    }

    let y0 = await scrollY()
    await gesture(150, 30)
    await expect(counter).toHaveText(`2 / ${total}`)
    expect(await scrollY(), "a sideways drag").toBe(y0)

    y0 = await scrollY()
    await gesture(20, -160, { hold: 320 })
    await expect(counter).toHaveText(`3 / ${total}`)
    expect(await scrollY(), "a drag after a hold").toBe(y0)

    y0 = await scrollY()
    await gesture(0, -200, { steps: 6, stepMs: 16 })
    await expect(counter).toHaveText(`3 / ${total}`)
    expect(await scrollY(), "a quick vertical swipe").toBeGreaterThan(y0)
  })
})

test.describe("who it is for", () => {
  test("headings from content, marks instead of rules", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const section = page.getByRole("region", { name: "Who it is for" })
    for (const group of [MENTORING.fit, MENTORING.notFit]) {
      await expect(
        section.getByRole("heading", { name: group.title })
      ).toBeVisible()
    }
    const items = section.getByRole("listitem")
    await expect(items).toHaveCount(
      MENTORING.fit.items.length + MENTORING.notFit.items.length
    )
    const styles = await items.evaluateAll((els) =>
      els.map((el) => {
        const li = getComputedStyle(el)
        const ul = getComputedStyle(el.parentElement!)
        const mark = el.querySelector(".ment-mark")
        return {
          rules:
            li.borderTopWidth +
            li.borderBottomWidth +
            ul.borderTopWidth +
            ul.borderBottomWidth,
          hidden: mark?.getAttribute("aria-hidden"),
          size: mark ? Math.round(mark.getBoundingClientRect().width) : 0,
        }
      })
    )
    for (const s of styles) {
      expect(s.rules).toBe("0px0px0px0px")
      expect(s.hidden).toBe("true")
      expect(s.size).toBe(20)
    }
  })
})

test.describe("haptics", () => {
  test("one tick per manual move, none on autoplay or a spring-back", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __vibrations: unknown[] }
      w.__vibrations = []
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: (pattern: unknown) => {
          w.__vibrations.push(pattern)
          return true
        },
      })
    })
    const calls = () =>
      page.evaluate(
        () =>
          (window as unknown as { __vibrations: unknown[] }).__vibrations.length
      )
    const { pile, counter } = await openPile(page)
    await page.mouse.move(1, 1)

    // Autoplay: the bar's end advances the pile, silently.
    await finishAnimations(pile)
    await expect(counter).toHaveText(`2 / ${total}`)
    expect(await calls()).toBe(0)

    await pause(pile)
    await drag(page, await topCentre(pile), 40)
    await page.waitForTimeout(300)
    expect(await calls()).toBe(0)

    await page.mouse.click(
      ...(Object.values(await topCentre(pile)) as [number, number])
    )
    await expect(counter).toHaveText(`3 / ${total}`)
    expect(await calls()).toBe(1)

    await counter.click()
    await expect(counter).toHaveText(`4 / ${total}`)
    expect(await calls()).toBe(2)
  })

  test("without haptics support it is a quiet no-op", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "vibrate", {
        configurable: true,
        value: undefined,
      })
    })
    const log = collectConsoleErrors(page)
    const { pile, counter } = await openPile(page)
    await pause(pile)
    await page.mouse.click(
      ...(Object.values(await topCentre(pile)) as [number, number])
    )
    await expect(counter).toHaveText(`2 / ${total}`)
    await page
      .getByRole("banner")
      .getByRole("button", { name: ASK.ariaOpen })
      .click()
    await expect(page.getByRole("dialog", { name: ASK.title })).toBeVisible()
    // A desktop without a touch screen gets no hidden switch either.
    await expect(page.locator('input[type="checkbox"][switch]')).toHaveCount(0)
    expect(log.errors).toEqual([])
  })
})

const BOOKING = "https://cal.com/ruzicic/15m-discovery-session"

test("the booking link is in the contact line on /, /mentoring and /about", async ({
  page,
}) => {
  for (const path of ["/", "/mentoring", "/about"]) {
    await gotoReady(page, path)
    const link = page.locator(`#contact a[href="${BOOKING}"]`)
    await expect(link, path).toHaveCount(1)
    await expect(link, path).toHaveAttribute("target", "_blank")
    await expect(link, path).toHaveAttribute("rel", /noopener/)
    await expect(link, path).not.toHaveAttribute("rel", /\bme\b/)
    // The owner's footer line of 15 Nov 2026 has no email link.
    await expect(
      page.locator('#contact a[href^="mailto:"]'),
      `${path}: no email in the contact line`
    ).toHaveCount(0)
  }
})

test('the "Can we work together?" card links to the booking page', () => {
  const work = ASK.questions.find((q) => q.id === "work")
  expect(work?.card).toMatchObject({ kind: "link", href: BOOKING })
  expect(work?.answer).toContain("The fastest way in is a 15-minute call.")
})

test("the pile's toggle shows a hold and the reader's pause", async ({
  page,
}) => {
  const { pile } = await openPile(page)
  const toggle = pile.locator(".ment-toggle")
  await expect(toggle).toHaveAttribute("data-state", "running")
  await expect(toggle).toHaveAccessibleName(said.pauseLabel)
  await pile.locator('figure[data-pos="0"]').hover()
  await expect(toggle).toHaveAttribute("data-state", "held")
  await expect(toggle).toHaveAccessibleName(said.pauseLabel)
  await page.mouse.move(2, 2)
  await expect(toggle).toHaveAttribute("data-state", "running")
  await toggle.click()
  await expect(toggle).toHaveAttribute("data-state", "paused")
  await expect(toggle).toHaveAccessibleName(said.playLabel)
  await pile.locator('figure[data-pos="0"]').hover()
  await page.waitForTimeout(250)
  await expect(toggle).toHaveAttribute("data-state", "paused")
})

test.describe("the booking block (owner, 15 Nov 2026)", () => {
  test("the MentorCruise lockup links to his profile", async ({ page }) => {
    await gotoReady(page, "/mentoring")
    const lockup = page.locator(".ment-intro a.ment-lk")
    await expect(lockup).toHaveCount(1)
    await expect(lockup).toHaveAttribute("href", "https://mentors.to/ruzicic")
  })

  test("after How it works: the line, the booking button, then a way to write", async ({
    page,
  }) => {
    await gotoReady(page, "/mentoring")
    const block = page.getByRole("region", { name: MENTORING.cta.line })
    await expect(block).toBeVisible()
    const book = block.getByRole("link", { name: MENTORING.cta.action.label })
    await expect(book).toHaveAttribute("href", MENTORING.cta.action.href)
    await expect(book).toHaveAttribute("target", "_blank")
    await expect(book).toHaveClass(/\bbtn\b/)
    await expect(
      block.getByRole("link", { name: "write to me" })
    ).toHaveAttribute("href", "mailto:me@mladenruzicic.com")
    await expect(block.locator("p")).toHaveText("Or write to me.")
    // In the page body, after "How it works", and the only booking link.
    const after = await page.evaluate(() => {
      const how = document.getElementById("ment-how")!
      const cta = document.getElementById("ment-cta")!
      return Boolean(
        how.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    })
    expect(after).toBe(true)
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: /book a 15-minute call/i })
    ).toHaveCount(1)
  })
})
