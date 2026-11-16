import { expect, test, type Page } from "@playwright/test"

import { ABOUT } from "@/content/pages/about"

import { gotoReady, timedDrag } from "./helpers"

/**
 * `/about` after the owner's 15 Nov 2026 copy and layout: the story (the
 * second paragraph split around the early projects' carousel, layout B), no
 * "How I work", no "Facts", no "Where it started" section, the CV with role
 * names in two-line entries, the plain "Write to me" link, the postscript.
 */

const PARAS = ".ab-intro p.ab-para"
const EARLY = ABOUT.early
const N = EARLY.frames.length

/** The owner's second paragraph, as he wrote it, early line included. */
const P2 =
  "That has looked different every few years. I started while I was still at school: websites for shops, small Windows apps, PHP sites of my own. It earned real money. Client sites in a small studio near Novi Sad. An IoT platform. Virtual reality for architects, my first job in Switzerland. Two years on Shopify's Shop app. Since 2023 I have been at ZF, today as a product owner on tools truck drivers use every day."

test("the story, the owner's words, the second paragraph split around the carousel", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const paras = page.locator(PARAS)
  await expect(paras).toHaveCount(5)
  await expect(paras.nth(0)).toHaveText(
    "I keep ending up at the part of a problem nobody owns: the tool everyone works around, the market with no usable product in it. I like to sit with the people who have the problem, build something they can touch within a week, and stay close after it ships."
  )
  // Not a word of the paragraph changed: its two halves make it whole.
  const halves = await paras.evaluateAll((els) =>
    els.slice(1, 3).map((el) => el.textContent!.replace(/\s+/g, " ").trim())
  )
  expect(halves.join(" ")).toBe(P2)
  expect(halves[0]).toMatch(/It earned real money\.$/)
  await expect(paras.nth(4)).toContainText(
    "I'm from Bosnia and Herzegovina by way of Serbia, I live in Ticino (Switzerland), and I work in Serbian, English and Italian."
  )
  await expect(paras.nth(4)).toContainText("; I answer my own email.")
  // The product lockups in the paragraphs, in order.
  await expect(paras.locator("a.ab-lk .blk-w")).toHaveText([
    "Shopify",
    "ZF",
    "TenderLift",
    "studenti.rs",
  ])
  // In the page: portrait, title, two paragraphs, the carousel, the rest.
  const order = await page
    .locator(".ab-intro > *")
    .evaluateAll((els) =>
      els.map((el) =>
        el.classList.contains("ab-car") ? "carousel" : el.tagName.toLowerCase()
      )
    )
  expect(order).toEqual(["img", "h1", "p", "p", "carousel", "p", "p", "p"])
})

test("no How I work, no Facts, no Where it started", async ({ page }) => {
  await gotoReady(page, "/about")
  const headings = await page.getByRole("heading", { level: 2 }).allInnerTexts()
  // The postscript has no heading; the CV is the page's one section title.
  expect(headings).toEqual([ABOUT.cv.title])
  const main = page.getByRole("main")
  await expect(main).not.toContainText("Where it started")
  await expect(main).not.toContainText("Kept because the first ones")
})

test('"Write to me" is a plain mailto link in running text', async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const link = page.locator(PARAS).nth(4).getByRole("link", {
    name: "Write to me",
  })
  await expect(link).toHaveAttribute("href", "mailto:me@mladenruzicic.com")
  // The site's ordinary inline link: no lockup class, no tile.
  expect(await link.getAttribute("class")).toBeNull()
  await expect(link.locator("[data-tile]")).toHaveCount(0)
  expect(
    await link.evaluate((el) => getComputedStyle(el).textDecorationLine)
  ).toContain("underline")
})

test("the markdown twin: the story with the early projects as a list in place, the CV with roles", async ({
  request,
}) => {
  const md = await (
    await request.get("/about", { headers: { Accept: "text/markdown" } })
  ).text()
  expect(md).not.toMatch(/^## (How I work|Facts|Where it started)$/m)
  expect(md).not.toContain("Kept because the first ones")
  expect(md).toContain("[Write to me](mailto:me@mladenruzicic.com)")
  const list = EARLY.frames.map((f) => `- ${f.caption}: ${f.text}`).join("\n")
  // After the early line, before "Client sites", with no heading.
  expect(md).toContain(`It earned real money.\n\n${list}\n\nClient sites`)
  for (const row of ABOUT.cv.rows) {
    expect(md).toContain(`, ${row.role} (${row.year}): ${row.text}`)
  }
})

/* -------------------------------------------------------------------------- */
/* The early projects' carousel (owner, 15 Nov 2026: layout B)                 */
/* -------------------------------------------------------------------------- */

const rail_ = (page: Page) => page.locator(".ab-car__rail")
const rail = (page: Page) =>
  page.getByRole("region", { name: EARLY.label, exact: true })
/** The real slides; the loop's copies at either end are not counted. */
const slides = (page: Page) =>
  page.locator(".ab-car .ab-slide:not([data-rail-clone])")
const count = (page: Page) => page.locator(".ab-car__count")
const fmt = (f: string, i: number) =>
  f.replace("{n}", String(i + 1)).replace("{total}", String(N))

/**
 * The slides that show any of themselves inside the rail's box, by their
 * index among the real slides; a copy counts as the slide it shows.
 */
const visible = (page: Page) =>
  page.locator(".ab-car__rail").evaluate((r, n) => {
    const box = r.getBoundingClientRect()
    const all = Array.from(r.children)
    const looped = all.length === n + 2
    return all.flatMap((el, i) => {
      const b = el.getBoundingClientRect()
      const real = looped ? (i - 1 + n) % n : i
      return Math.min(b.right, box.right) - Math.max(b.left, box.left) > 1
        ? [real]
        : []
    })
  }, N)

/** Puts real slide `i` at rest in the rail at once. */
const showSlide = (page: Page, i: number) =>
  page.locator(".ab-car__rail").evaluate((r, i) => {
    const real = r.querySelectorAll<HTMLElement>(
      ":scope > :not([data-rail-clone])"
    )[i]
    const first = r.firstElementChild as HTMLElement
    r.scrollTo({
      left: real.offsetLeft - first.offsetLeft,
      behavior: "instant",
    })
  }, i)

test("four slides, each picture and its words, one at a time", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  await expect(rail(page)).toHaveAttribute("aria-roledescription", "carousel")
  await expect(slides(page)).toHaveCount(N)
  for (const [i, frame] of EARLY.frames.entries()) {
    const s = slides(page).nth(i)
    await expect(s).toHaveAttribute("role", "group")
    await expect(s).toHaveAttribute("aria-roledescription", "slide")
    await expect(s).toHaveAttribute(
      "aria-label",
      fmt(EARLY.slideLabelFormat, i)
    )
    await expect(s.locator(".ab-mono")).toHaveText(frame.caption)
    await expect(s.locator(".ab-slide__text")).toHaveText(frame.text)
    await expect(s.locator("img")).toHaveAttribute("alt", frame.alt!)
  }
  expect(await visible(page)).toEqual([0])
  // Desktop: the 165 by 124 picture beside the words, in the text column
  // (the boards' 540px times the type scale, 16 Nov 2026).
  const pic = (await slides(page)
    .first()
    .locator(".ab-slide__pic")
    .boundingBox())!
  expect(Math.round(pic.width)).toBe(165)
  expect(Math.round(pic.height)).toBe(124)
  const box = (await rail(page).boundingBox())!
  expect(Math.round(box.width)).toBe(632)
})

/** The real slide at rest in the rail, after any jump off a copy. */
async function expectAt(page: Page, i: number) {
  await expect(count(page)).toHaveText(fmt(EARLY.counterFormat, i))
  await expect(slides(page).nth(i)).toHaveAttribute("data-on", "")
  await expect
    .poll(() =>
      page
        .locator(".ab-car__rail [data-on]")
        .evaluate((el) => el.hasAttribute("data-rail-clone"))
    )
    .toBe(false)
  await expect.poll(() => visible(page)).toEqual([i])
}

// Owner, 16 Nov 2026: "carousel on about page should loop (go to 1 when at
// the end and the other way around); not automatically".
test("the arrows step through and loop at both ends; never disabled", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const prev = page.getByRole("button", { name: EARLY.prevLabel })
  const next = page.getByRole("button", { name: EARLY.nextLabel })
  await expectAt(page, 0)
  await expect(prev).toBeEnabled()
  for (let i = 1; i < N; i++) {
    await next.click()
    await expectAt(page, i)
  }
  await expect(next).toBeEnabled()
  // Past the last: the first ("4 / 4", then "1 / 4").
  await next.click()
  await expectAt(page, 0)
  // Back from the first: the last.
  await prev.click()
  await expectAt(page, N - 1)
  await prev.click()
  await expectAt(page, N - 2)
  // Nothing moves on its own.
  await page.waitForTimeout(1500)
  await expectAt(page, N - 2)
})

test("quick presses add up, across the end too", async ({ page }) => {
  await gotoReady(page, "/about")
  const next = page.getByRole("button", { name: EARLY.nextLabel })
  for (let i = 0; i < N + 1; i++) await next.click()
  await expectAt(page, 1)
})

test("arrow keys loop; Home and End go to either end", async ({ page }) => {
  await gotoReady(page, "/about")
  await rail(page).focus()
  await page.keyboard.press("ArrowLeft")
  await expectAt(page, N - 1)
  await page.keyboard.press("ArrowRight")
  await expectAt(page, 0)
  await page.keyboard.press("ArrowRight")
  await expectAt(page, 1)
  await page.keyboard.press("End")
  await expectAt(page, N - 1)
  await page.keyboard.press("ArrowLeft")
  await expectAt(page, N - 2)
  await page.keyboard.press("Home")
  await expectAt(page, 0)
})

test("a mouse drag moves one slide and settles; past either end it loops", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const b = (await rail(page).boundingBox())!
  const y = b.y + b.height / 2
  // A quick drag with fixed timing (`timedDrag`): the same flick on any
  // machine.
  const dragBy = (from: number, to: number) =>
    timedDrag(page, b.x + from, y, to - from, { steps: 10 })
  await dragBy(300, 60)
  await expectAt(page, 1)
  await dragBy(60, 300)
  await expectAt(page, 0)
  // Back past the first: the last.
  await dragBy(60, 300)
  await expectAt(page, N - 1)
  // On past the last: the first.
  await dragBy(300, 60)
  await expectAt(page, 0)
})

test("the loop's copies are hidden, inert, without ids, and fetch nothing new", async ({
  page,
}) => {
  const images: string[] = []
  page.on("request", (r) => {
    if (r.resourceType() === "image") images.push(r.url())
  })
  await gotoReady(page, "/about")
  const clones = page.locator(".ab-car__rail > [data-rail-clone]")
  await expect(clones).toHaveCount(2)
  for (const c of await clones.all()) {
    await expect(c).toHaveAttribute("aria-hidden", "true")
    expect(await c.evaluate((el) => (el as HTMLElement).inert)).toBe(true)
    expect(await c.evaluate((el) => el.querySelectorAll("[id]").length)).toBe(0)
  }
  // First the copy of the last slide, last the copy of the first.
  const src = (sel: string) =>
    page.locator(`.ab-car__rail > ${sel} img`).getAttribute("src")
  expect(await src("[data-rail-clone]:first-child")).toBe(
    await src(":not([data-rail-clone]):nth-child(" + (N + 1) + ")")
  )
  expect(await src("[data-rail-clone]:last-child")).toBe(
    await src(":not([data-rail-clone]):nth-child(2)")
  )
  // The assistive tree holds the real slides only.
  await expect(
    page.getByRole("group", { name: fmt(EARLY.slideLabelFormat, 0) })
  ).toHaveCount(1)
  // Walk the whole loop: every early picture is requested at most once.
  const next = page.getByRole("button", { name: EARLY.nextLabel })
  for (let i = 0; i <= N; i++) await next.click()
  await expectAt(page, 1)
  const early = images.filter((u) =>
    /static%2Fabout%2F|static\/about\//.test(u)
  )
  expect(early.length).toBe(new Set(early).size)
})

test("without JavaScript there are no copies and no loop", async ({
  browser,
  baseURL,
}) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await ctx.newPage()
  await page.goto("/about")
  await expect(page.locator(".ab-car__rail > *")).toHaveCount(N)
  await expect(page.locator("[data-rail-clone]")).toHaveCount(0)
  await ctx.close()
})

// Owner, 15 Nov 2026: "we can cut it a bit to avoid layout jumps". Every
// slide is one height at every width; the page under the carousel never
// moves while stepping through.
for (const width of [1440, 1024, 768, 390]) {
  test(`at ${width} every slide has the same height and the page does not move`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/about")
    const after = page.locator(PARAS).nth(EARLY.after)
    const seen = new Set<string>()
    for (let i = 0; i < N; i++) {
      await showSlide(page, i)
      await expect(count(page)).toHaveText(fmt(EARLY.counterFormat, i))
      const car = (await page.locator(".ab-car").boundingBox())!
      const next = (await after.boundingBox())!
      seen.add(`${Math.round(car.height)}/${Math.round(next.y)}`)
    }
    expect([...seen]).toHaveLength(1)
    // Each slide's own content fits the rail's height: none is cut.
    const fits = await slides(page).evaluateAll((els) =>
      els.every(
        (el) =>
          (el.firstElementChild as HTMLElement).getBoundingClientRect()
            .height <=
          el.getBoundingClientRect().height + 0.5
      )
    )
    expect(fits).toBe(true)
  })
}

test.describe("on a phone, by touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })

  // Polish round, 15 Nov 2026: on a phone nothing of the next slide shows
  // (clipped words at the edge read as broken); the arrows say there is more.
  test("one slide in the column, gutters both sides, the counter and arrows above", async ({
    page,
  }) => {
    await gotoReady(page, "/about")
    const prev = page.getByRole("button", { name: EARLY.prevLabel })
    const next = page.getByRole("button", { name: EARLY.nextLabel })
    await expect(next).toBeVisible()
    await expect(prev).toBeEnabled()
    await expect(count(page)).toBeVisible()
    const s0 = slides(page).first()
    const pic = (await s0.locator(".ab-slide__pic").boundingBox())!
    expect(Math.round(pic.width)).toBe(228)
    expect(Math.round(pic.height)).toBe(171)
    const words = (await s0.locator(".ab-slide__words").boundingBox())!
    expect(words.y).toBeGreaterThan(pic.y + pic.height)
    // The counter and the arrows sit above the slide, right-aligned.
    for (const el of [count(page), next]) {
      const b = (await el.boundingBox())!
      expect(b.y + b.height).toBeLessThanOrEqual(pic.y)
    }
    const nb = (await next.boundingBox())!
    // The rail keeps the page gutter on both sides; nothing of slide 2 is in it.
    const rail = (await rail_(page).boundingBox())!
    expect(Math.round(rail.x)).toBe(24)
    expect(Math.round(390 - (rail.x + rail.width))).toBe(24)
    expect(Math.round(nb.x + nb.width)).toBe(Math.round(rail.x + rail.width))
    expect(await visible(page)).toEqual([0])
    // The arrows step on a phone too.
    await next.click()
    await expect(count(page)).toHaveText(fmt(EARLY.counterFormat, 1))
    await expect.poll(() => visible(page)).toEqual([1])
  })

  for (const speed of [400, 3000]) {
    test(`a swipe at ${speed}px/s moves exactly one slide`, async ({
      page,
    }) => {
      await gotoReady(page, "/about")
      const r = rail(page)
      await r.scrollIntoViewIfNeeded()
      const b = (await r.boundingBox())!
      const cdp = await page.context().newCDPSession(page)
      await cdp.send("Input.synthesizeScrollGesture", {
        x: Math.round(b.x + 280),
        y: Math.round(b.y + 80),
        xDistance: -200,
        yDistance: 0,
        speed,
        gestureSourceType: "touch",
      })
      await expect(count(page)).toHaveText(fmt(EARLY.counterFormat, 1))
      await expect.poll(() => visible(page)).toEqual([1])
    })
  }

  // The loop by touch: a swipe back from the first lands on the last, and
  // one on from the last on the first, each with the rail at rest on the
  // real slide, one slide in view, nothing of a neighbour.
  test("a swipe past either end loops", async ({ page }) => {
    await gotoReady(page, "/about")
    const r = rail(page)
    await r.scrollIntoViewIfNeeded()
    const b = (await r.boundingBox())!
    const cdp = await page.context().newCDPSession(page)
    const swipe = (dx: number) =>
      cdp.send("Input.synthesizeScrollGesture", {
        x: Math.round(b.x + (dx < 0 ? 280 : 60)),
        y: Math.round(b.y + 80),
        xDistance: dx,
        yDistance: 0,
        speed: 1200,
        gestureSourceType: "touch",
      })
    await swipe(200)
    await expectAt(page, N - 1)
    await swipe(-200)
    await expectAt(page, 0)
    await swipe(-200)
    await expectAt(page, 1)
  })
})

/* The owner's text fixes (15 Nov 2026): captions are a name and a year with no
 * source note (the provenance lives in docs/v4-build/ABOUT-SOURCES.md), the
 * humour site is named otompotom.com, and its line was cut so every slide
 * fits beside its picture. */
const SOURCE_NOTES = [
  "from my own files",
  "from the Web Archive",
  "rebuilt from my backup",
  "the photos are lost",
]

test("early captions are a name and a year; otompotom.com by its domain", async ({
  page,
  request,
}) => {
  expect(EARLY.frames.map((f) => f.caption)).toEqual([
    "Baby Robin, 2005",
    "Sara Trade, 2009",
    "iglica.rs, 2011",
    "otompotom.com, 2012",
  ])
  const oto = EARLY.frames[3]!
  expect(oto.label).toBe("otompotom.com, a humour site, 2012")
  expect(oto.alt).toMatch(/^The otompotom\.com humour website: /)
  expect(oto.text).toBe(
    "Co-founded with the owners of a huge Facebook community. It made money, and we never met in person."
  )

  await gotoReady(page, "/about")
  const body = await page.locator("main").innerText()
  const md = await (
    await request.get("/about", { headers: { Accept: "text/markdown" } })
  ).text()
  for (const text of [body, md]) {
    for (const note of SOURCE_NOTES) expect(text).not.toContain(note)
    expect(text).not.toContain("An eye-opener")
    expect(text).toContain("otompotom.com, 2012")
    expect(text).toContain(oto.text)
  }
})

/* -------------------------------------------------------------------------- */
/* The CV: years above, company and role, the description (15 Nov 2026)       */
/* -------------------------------------------------------------------------- */

test("each CV entry: the years, the company and its role, the description", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const rows = page.locator("ol.ab-rules > li.ab-cv")
  await expect(rows).toHaveCount(ABOUT.cv.rows.length)
  for (const [i, row] of ABOUT.cv.rows.entries()) {
    const li = rows.nth(i)
    await expect(li.locator(".ab-cv__years")).toHaveText(row.year)
    await expect(li.locator(".ab-cv__role")).toHaveText(row.role)
    await expect(li.getByRole("heading", { level: 3 })).toContainText(row.role)
    await expect(li.locator(".ab-cv__text")).toHaveText(row.text)
    // Stacked, not in columns: one left edge, years above the line above the
    // description, which takes the column's width.
    const [y, l, t] = await Promise.all(
      [".ab-cv__years", ".ab-cv__line", ".ab-cv__text"].map(
        async (sel) => (await li.locator(sel).boundingBox())!
      )
    )
    expect(Math.round(l.x)).toBe(Math.round(y.x))
    expect(Math.round(t.x)).toBe(Math.round(y.x))
    expect(l.y).toBeGreaterThanOrEqual(y.y + y.height - 1)
    expect(t.y).toBeGreaterThanOrEqual(l.y + l.height - 1)
    const liBox = (await li.boundingBox())!
    expect(t.width).toBeGreaterThan(liBox.width * 0.6)
  }
  // The years in the list rows' label style: mono, uppercase.
  const style = await rows
    .first()
    .locator(".ab-cv__years")
    .evaluate((el) => {
      const s = getComputedStyle(el)
      return [s.textTransform, s.fontFamily.includes("Mono")]
    })
  expect(style).toEqual(["uppercase", true])
})

// Owner, 16 Nov 2026: "fontstyle for company name + role can't be the
// same". Three levels: the company in the ink at medium weight, the role in
// mono capitals in the quiet ink, the description in the muted body.
for (const width of [1440, 390]) {
  test(`at ${width} the company, the role and the description are three styles`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/about")
    const li = page.locator("ol.ab-rules > li.ab-cv").first()
    const look = (sel: string) =>
      li.locator(sel).evaluate((el) => {
        const s = getComputedStyle(el)
        return {
          family: s.fontFamily.includes("Mono") ? "mono" : "sans",
          weight: s.fontWeight,
          size: s.fontSize,
          color: s.color,
          transform: s.textTransform,
        }
      })
    const [name, role, text] = await Promise.all(
      [".ab-cv__name", ".ab-cv__role", ".ab-cv__text"].map(look)
    )
    expect(name).toMatchObject({ family: "sans", weight: "500" })
    expect(role).toMatchObject({ family: "mono", transform: "uppercase" })
    expect(text).toMatchObject({ family: "sans", weight: "400" })
    // Three colours: ink, quiet ink, muted.
    expect(new Set([name.color, role.color, text.color]).size).toBe(3)
    if (width < 720) {
      // On a phone the role has its own line, flush with the company.
      const [n, r] = await Promise.all(
        [".ab-cv__name", ".ab-cv__role"].map(
          async (sel) => (await li.locator(sel).boundingBox())!
        )
      )
      expect(r.y).toBeGreaterThanOrEqual(n.y + n.height - 1)
      expect(Math.round(r.x)).toBe(Math.round(n.x))
    }
  })
}

/* -------------------------------------------------------------------------- */
/* The postscript and Paranoia (15 Nov 2026)                                  */
/* -------------------------------------------------------------------------- */

const PS = ABOUT.postscript!

test("the postscript: the sentence, the game, the avatars, the button and the sign", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const ps = page.getByRole("region", { name: "Postscript" })
  await expect(ps.locator(".ab-ps__text")).toHaveText(
    "P.S. Deep down, I believe playing League of Legends until I hit Diamond must have helped somehow. Right!?",
    // The hidden tooltips sit in the line but are not part of its text.
    { useInnerText: true }
  )
  // The game is a name, not a link.
  await expect(ps.locator(".ab-ps__game a")).toHaveCount(0)
  await expect(ps.locator(".ab-ps__tile img")).toHaveAttribute(
    "src",
    PS.game.icon
  )
  const avatars = ps.getByRole("img", { name: /^(Nocturne|Morgana)$/ })
  await expect(avatars).toHaveCount(2)
  await expect(ps.getByRole("button", { name: PS.cta })).toBeVisible()
  await expect(ps.locator(".ab-ps__sign")).toHaveText(PS.sign)
  await expect(
    ps.locator('.ab-ps__sign svg.ico[data-icon="sound"]')
  ).toHaveCount(1)
})

/** The tooltip that belongs to an avatar (each one sits in its avatar's box). */
function tipOf(avatar: import("@playwright/test").Locator) {
  return avatar
    .locator("xpath=..")
    .getByRole("tooltip", { includeHidden: true })
}

test("the avatars show the champion's name on hover and on focus; Escape closes", async ({
  page,
}) => {
  await gotoReady(page, "/about")
  const ps = page.getByRole("region", { name: "Postscript" })
  const nocturne = ps.getByRole("img", { name: "Nocturne" })
  const tip = tipOf(nocturne)
  await nocturne.scrollIntoViewIfNeeded()
  await nocturne.hover()
  await expect(tip).toBeVisible()
  await expect(tip).toHaveText("Nocturne")
  await expect(nocturne).toHaveAttribute(
    "aria-describedby",
    (await tip.getAttribute("id"))!
  )
  await page.mouse.move(2, 2)
  await expect(tip).toBeHidden()

  const morgana = ps.getByRole("img", { name: "Morgana" })
  await morgana.focus()
  await expect(tipOf(morgana)).toBeVisible()
  await expect(tipOf(morgana)).toHaveText("Morgana")
  await page.keyboard.press("Escape")
  await expect(tipOf(morgana)).toBeHidden()
})

for (const width of [1440, 1024]) {
  test.describe(`tooltips at the bottom of the page, ${width}`, () => {
    test.use({ viewport: { width, height: 900 } })

    test("each sits centred above its own avatar, inside the viewport", async ({
      page,
    }) => {
      await gotoReady(page, "/about")
      // The very bottom: the paper sheet is scaled down there.
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      )
      await page.waitForTimeout(400)
      const ps = page.getByRole("region", { name: "Postscript" })
      const check = async (name: string) => {
        const avatar = ps.getByRole("img", { name })
        const tip = tipOf(avatar)
        await expect(tip).toBeVisible()
        const a = (await avatar.boundingBox())!
        const t = (await tip.boundingBox())!
        expect(
          Math.abs(t.x + t.width / 2 - (a.x + a.width / 2)),
          `${name} centred`
        ).toBeLessThanOrEqual(2)
        expect(t.y + t.height, `${name} above`).toBeLessThanOrEqual(a.y)
        expect(t.x).toBeGreaterThanOrEqual(0)
        expect(t.y).toBeGreaterThanOrEqual(0)
        expect(t.x + t.width).toBeLessThanOrEqual(width)
      }
      for (const name of ["Nocturne", "Morgana"]) {
        await ps.getByRole("img", { name }).hover()
        await check(name)
      }
      await page.mouse.move(2, 2)
      for (const name of ["Nocturne", "Morgana"]) {
        await ps.getByRole("img", { name }).focus()
        await check(name)
      }
    })
  })
}

test("nothing of the effect loads before intent; hovering the button fetches it", async ({
  page,
}) => {
  const requests: string[] = []
  page.on("request", (r) => requests.push(r.url()))
  await gotoReady(page, "/about")
  expect(requests.filter((u) => u.endsWith(PS.sound))).toHaveLength(0)
  const before = requests.filter((u) => u.endsWith(".js")).length
  const button = page.getByRole("button", { name: PS.cta })
  await button.scrollIntoViewIfNeeded()
  await button.hover()
  await expect
    .poll(() => requests.filter((u) => u.endsWith(PS.sound)).length)
    .toBe(1)
  expect(requests.filter((u) => u.endsWith(".js")).length).toBeGreaterThan(
    before
  )
})

/*
 * While a run is on, the page holds still (owner, 16 Nov 2026: "disable
 * scroll while paranoia is active"): no wheel, no keys, and it scrolls again
 * as soon as the run ends, whichever way it ends.
 */
const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY))

async function startRun(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await gotoReady(page, "/about")
  const button = page.getByRole("button", { name: PS.cta })
  await button.scrollIntoViewIfNeeded()
  await button.hover()
  await button.click()
  const overlay = page.locator('body > canvas[aria-hidden="true"]')
  await expect(overlay).toHaveCount(1)
  await expect(page.locator("html")).toHaveAttribute("data-scroll-locked", "")
  return { button, overlay }
}

test("a run: the overlay comes, the page holds still, Escape ends it and lets go", async ({
  page,
}) => {
  const { button, overlay } = await startRun(page)
  await expect(page.locator("html")).toHaveAttribute("data-paranoia-run", "")
  await expect(button).toHaveAttribute("aria-disabled", "true")
  await expect(
    page.getByRole("region", { name: "Postscript" }).getByRole("status")
  ).toContainText("Escape")
  // No wheel and no key scrolls the page, and focus stays on the button.
  const y0 = await scrollY(page)
  await page.mouse.wheel(0, -400)
  await page.keyboard.press("PageUp")
  await page.keyboard.press("ArrowUp")
  await page.waitForTimeout(300)
  expect(await scrollY(page)).toBe(y0)
  await expect(button).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(overlay).toHaveCount(0, { timeout: 3000 })
  await expect(page.locator("html")).not.toHaveAttribute("data-paranoia-run")
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked")
  await expect(button).toHaveAttribute("aria-disabled", "false")
  // Exactly where it was, and it scrolls again.
  expect(await scrollY(page)).toBe(y0)
  await page.mouse.wheel(0, -400)
  await expect.poll(() => scrollY(page)).toBeLessThan(y0)
})

test("a run lets the page go when its tab is hidden, or when the page is left", async ({
  page,
}) => {
  const { overlay } = await startRun(page)
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect(overlay).toHaveCount(0)
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked")
  await page.evaluate(() => {
    delete (document as { visibilityState?: unknown }).visibilityState
  })

  // Left mid-run (a link in the footer): the next page scrolls.
  const { button } = await startRun(page)
  await expect(button).toHaveAttribute("aria-disabled", "true")
  await page.evaluate(() => {
    const a = document.querySelector<HTMLAnchorElement>(
      'footer a[href="/work"], a[href="/work"]'
    )
    a?.click()
  })
  await expect(page).toHaveURL(/\/work$/)
  await expect(page.locator("html")).not.toHaveAttribute("data-scroll-locked")
})

test("under reduced motion a run holds still and ends cleanly on its own", async ({
  page,
}) => {
  test.setTimeout(30_000)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await gotoReady(page, "/about")
  const button = page.getByRole("button", { name: PS.cta })
  await button.scrollIntoViewIfNeeded()
  await button.focus()
  await page.keyboard.press("Enter")
  const overlay = page.locator('body > canvas[aria-hidden="true"]')
  await expect(overlay).toHaveCount(1)
  await expect(overlay).toHaveCount(0, { timeout: 10_000 })
  await expect(page.locator("html")).not.toHaveAttribute("data-paranoia-run")
  await expect(
    page.getByRole("region", { name: "Postscript" }).getByRole("status")
  ).toHaveText("")
})

test("League of Legends is nowhere but /about", async ({ page }) => {
  for (const path of ["/", "/work"]) {
    await gotoReady(page, path)
    expect(await page.content(), path).not.toMatch(/league of legends/i)
  }
})
