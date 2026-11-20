import { expect, test, type Locator, type Page } from "@playwright/test"

import { ASK } from "@/content/ask"

import { escapeRe, gotoReady } from "./helpers"

/**
 * Ask, the PR agent in the top block (PLAN.md §1 "Ask"). Every prepared
 * question yields its prepared answer and source line; with no live model,
 * a typed question that overlaps a prepared one gets that answer, and
 * anything else gets the honest fallback with the email link. Answers come
 * from `content/ask.ts`, so copy changes need no test change.
 *
 * The live path (`workers/ask`) is tested against a mocked endpoint: the
 * page is pointed at a same-origin path through `window.__askEndpoint`,
 * with one of Cloudflare's published Turnstile test site keys in
 * `window.__askTurnstileSiteKey`, and Playwright answers it, so no model is
 * ever called. Turnstile's script is served by a stub that behaves as the
 * test keys do (always pass, always fail, or ask for a tick), so no real
 * widget runs and the suite never depends on challenges.cloudflare.com.
 */

async function openAsk(page: Page, path = "/") {
  await gotoReady(page, path)
  await page
    .getByRole("banner")
    .getByRole("button", { name: ASK.ariaOpen })
    .click()
  const dialog = page.getByRole("dialog", { name: ASK.title })
  await expect(dialog).toBeVisible()
  return dialog
}

/** A paragraph in `root` whose whole text is `text`. */
function paragraph(root: Locator, text: string) {
  return root
    .getByRole("paragraph")
    .filter({ hasText: new RegExp(`^\\s*${escapeRe(text)}\\s*$`) })
}

async function type(dialog: Locator, text: string) {
  const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
  await box.fill(text)
  await dialog.getByRole("button", { name: ASK.sendLabel }).click()
  return box
}

const chips = (dialog: Locator) =>
  dialog.getByRole("group", { name: ASK.suggestionsLabel })

for (const [i, q] of ASK.questions.entries()) {
  test(`"${q.chip}" yields its answer and source line`, async ({ page }) => {
    const dialog = await openAsk(page)
    if (i < ASK.chipsShown) {
      await chips(dialog).getByRole("button", { name: q.chip }).click()
    } else {
      // Not offered yet: the panel shows the first `chipsShown`. The same
      // words typed answer the same way.
      await expect(
        chips(dialog).getByRole("button", { name: q.chip })
      ).toHaveCount(0)
      await type(dialog, q.question)
    }

    await expect(paragraph(dialog, q.question)).toBeVisible()
    await expect(dialog.getByText(q.answer)).toBeVisible()
    await expect(paragraph(dialog, q.source)).toBeVisible()

    // The card links on: to the page it cites, or to the email.
    if (q.card.kind === "link" || q.card.kind === "product") {
      await expect(
        dialog.locator(`a[href="${q.card.href}"]`).first()
      ).toBeVisible()
    }
    // An asked question leaves the suggestions.
    await expect(
      chips(dialog).getByRole("button", { name: q.chip })
    ).toHaveCount(0)
  })
}

test("the panel offers the first chips, and the next one once one is asked", async ({
  page,
}) => {
  const dialog = await openAsk(page)
  const group = chips(dialog)
  await expect(group.getByRole("button")).toHaveCount(ASK.chipsShown)
  for (const q of ASK.questions.slice(0, ASK.chipsShown))
    await expect(group.getByRole("button", { name: q.chip })).toBeVisible()
  await group.getByRole("button", { name: ASK.questions[0].chip }).click()
  await expect(dialog.getByText(ASK.questions[0].answer)).toBeVisible()
  const next = ASK.questions[ASK.chipsShown]
  if (next)
    await expect(group.getByRole("button", { name: next.chip })).toBeVisible()
})

test("a typed question that matches gets the prepared answer", async ({
  page,
}) => {
  const dialog = await openAsk(page)
  const box = await type(dialog, "Is he taking on any mentees at the moment?")
  const mentor = ASK.questions.find((q) => q.id === "mentor")!
  await expect(dialog.getByText(mentor.answer)).toBeVisible()
  await expect(paragraph(dialog, mentor.source)).toBeVisible()
  await expect(box).toHaveValue("")
})

test("a question it cannot answer gets the fallback and the email link", async ({
  page,
}) => {
  const dialog = await openAsk(page)
  const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
  await box.fill("Which football team does he support?")
  await box.press("Enter")
  await expect(dialog.getByText(ASK.fallback.answer)).toBeVisible()
  await expect(paragraph(dialog, ASK.fallback.source)).toBeVisible()
  const mail = dialog.locator('a[href^="mailto:"]').first()
  await expect(mail).toBeVisible()
  await expect(mail).toHaveAttribute("href", /^mailto:\S+@\S+$/)
  for (const q of ASK.questions)
    await expect(dialog.getByText(q.answer)).toHaveCount(0)
})

test("after maxTurns questions a day the field goes, also after closing and reopening", async ({
  page,
}) => {
  // Two page loads and a close: past the default budget on CI's WebKit.
  test.slow()
  // Seed the day's count one short of the limit, as earlier visits would.
  await page.addInitScript(
    ([key, n]) => {
      // Once only: the reopen below reloads the page and runs this again.
      if (localStorage.getItem(key as string) === null)
        localStorage.setItem(
          key as string,
          JSON.stringify({ d: new Date().toISOString().slice(0, 10), n })
        )
    },
    ["ask:used", ASK.maxTurns - 1] as const
  )
  let dialog = await openAsk(page)
  const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
  await expect(box).toBeVisible()
  await chips(dialog).getByRole("button").first().click()
  await expect(dialog.getByText(ASK.done.line)).toBeVisible()
  await expect(box).toHaveCount(0)
  await expect(chips(dialog)).not.toBeVisible()

  // Close and open again: still done (the reported bug).
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await page
    .getByRole("banner")
    .getByRole("button", { name: ASK.ariaOpen })
    .click()
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(ASK.done.line)).toBeVisible()
  await expect(
    dialog.getByRole("textbox", { name: ASK.inputLabel })
  ).toHaveCount(0)

  // And after a reload.
  dialog = await openAsk(page)
  await expect(dialog.getByText(ASK.done.line)).toBeVisible()
  if (ASK.done.card.kind === "link")
    await expect(
      dialog.locator(`a[href="${ASK.done.card.href}"]`)
    ).toBeVisible()
})

test("data-ask-open is set on <html> only while the panel is open", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const html = page.locator("html")
  await expect(html).not.toHaveAttribute("data-ask-open")
  const dialog = await openAsk(page)
  await expect(html).toHaveAttribute("data-ask-open", "")
  await dialog.getByRole("button", { name: ASK.closeLabel }).first().click()
  await expect(dialog).toBeHidden()
  await expect(html).not.toHaveAttribute("data-ask-open")
})

test("the page does not scroll under the panel and nothing shifts sideways", async ({
  page,
}) => {
  await gotoReady(page, "/")
  const ask = page.locator(".site-top__ask")
  const before = (await ask.boundingBox())!.x
  const width = await page.evaluate(() => document.documentElement.clientWidth)
  const dialog = await openAsk(page)
  await page.mouse.move(200, 700)
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  // A classic scrollbar keeps its room (`scrollbar-gutter`): no shift.
  expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(
    width
  )
  expect((await ask.boundingBox())!.x).toBe(before)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await page.mouse.wheel(0, 600)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0)
})

test.describe("on a phone, by touch (Chromium)", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })

  /** A finger's swipe through CDP, from (x, y0) to (x, y1). */
  async function swipe(page: Page, x: number, y0: number, y1: number) {
    const cdp = await page.context().newCDPSession(page)
    const steps = 8
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: y0 }],
    })
    for (let i = 1; i <= steps; i++)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / steps }],
      })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await page.waitForTimeout(400)
  }

  test("the sheet comes in from the right; the page holds, the sheet scrolls", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "touch through CDP")
    await gotoReady(page, "/")
    await page
      .getByRole("banner")
      .getByRole("button", { name: ASK.ariaOpen })
      .tap()
    const dialog = page.getByRole("dialog", { name: ASK.title })
    await expect(dialog).toBeVisible()
    const sheet = dialog.locator(".ask-panel")
    // On its way in it is to the right of where it rests, never below.
    const first = (await sheet.boundingBox())!
    expect(first.y).toBe(0)
    expect(first.x).toBeGreaterThanOrEqual(0)
    await expect.poll(async () => (await sheet.boundingBox())!.x).toBe(0)

    // A swipe on the sheet's empty part does not move the page.
    await swipe(page, 200, 600, 250)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    // With an answer and its card in, the sheet's content scrolls inside.
    await chips(dialog)
      .getByRole("button", { name: ASK.questions[0].chip })
      .tap()
    await expect(dialog.getByText(ASK.questions[0].answer)).toBeVisible()
    const scroller = dialog.locator(".ask-scroll")
    const room = await scroller.evaluate(
      (el) => el.scrollHeight - el.clientHeight
    )
    await swipe(page, 200, 600, 250)
    if (room > 0)
      await expect
        .poll(() => scroller.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)

    await dialog.getByRole("button", { name: ASK.closeLabel }).tap()
    await expect(dialog).toBeHidden()
    await swipe(page, 200, 600, 250)
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0)
  })
})

test("Ask opens on every page, not only on /", async ({ page }) => {
  for (const path of ["/work", "/mentoring", "/work/tenderlift"]) {
    const dialog = await openAsk(page, path)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
  }
})

test("a source line link navigates and closes the panel", async ({ page }) => {
  const dialog = await openAsk(page)
  const mentor = ASK.questions.find((q) => q.id === "mentor")!
  await chips(dialog).getByRole("button", { name: mentor.chip }).click()
  const source = dialog.getByRole("link", { name: mentor.source })
  await expect(source).toBeVisible()
  await source.click()
  await expect(page).toHaveURL(/\/mentoring$/)
  await expect(dialog).toBeHidden()
  await expect(page.locator("html")).not.toHaveAttribute("data-ask-open")
})

/* -------------------------------------------------------------------------- */
/* The live model, mocked                                                     */
/* -------------------------------------------------------------------------- */

const ENDPOINT = "/__ask-test"
const TURNSTILE = "https://challenges.cloudflare.com/"
/** Cloudflare's published test site keys (developers.cloudflare.com/turnstile/troubleshooting/testing/). */
const KEYS = {
  pass: "1x00000000000000000000AA",
  fail: "2x00000000000000000000AB",
  interactive: "3x00000000000000000000FF",
}
const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"

/**
 * Turnstile's `api.js`, stubbed with the test keys' behaviour. The "tick"
 * of the interactive key is a real button, so the keyboard path is tested.
 */
const TURNSTILE_STUB = `
window.turnstile = {
  render(el, o) {
    const id = "w" + Math.random().toString(36).slice(2)
    window.__turnstileOptions = o
    const k = o.sitekey
    if (k.startsWith("2x")) setTimeout(() => o["error-callback"]("300030"), 30)
    else if (k.startsWith("3x")) setTimeout(() => {
      o["before-interactive-callback"]()
      const b = document.createElement("button")
      b.type = "button"
      b.textContent = "Verify you are human"
      b.dataset.widget = id
      b.onclick = () => { o["after-interactive-callback"](); o.callback("${DUMMY_TOKEN}") }
      el.append(b)
    }, 30)
    else setTimeout(() => o.callback("${DUMMY_TOKEN}"), 30)
    return id
  },
  remove(id) {
    document.querySelectorAll('[data-widget="' + id + '"]').forEach((n) => n.remove())
  },
}
`

function sse(events: [string, unknown][]) {
  return events
    .map(
      ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
    )
    .join("")
}

interface Reply {
  status?: number
  body?: string
  type?: string
  headers?: Record<string, string>
}

interface Sent {
  body: unknown
  session: string | null
  turnstile: string | null
}

/**
 * Points the page at the mock and the Turnstile stub, and records every
 * request each of them gets. `reply` may differ per request.
 */
async function mockLive(
  page: Page,
  reply: Reply | ((sent: Sent, i: number) => Reply),
  key: keyof typeof KEYS = "pass"
) {
  const requests: Sent[] = []
  const turnstile: string[] = []
  await page.addInitScript(
    ([path, siteKey]) => {
      const w = window as {
        __askEndpoint?: string
        __askTurnstileSiteKey?: string
      }
      w.__askEndpoint = path
      w.__askTurnstileSiteKey = siteKey
    },
    [ENDPOINT, KEYS[key]]
  )
  page.on("request", (r) => {
    if (r.url().startsWith(TURNSTILE)) turnstile.push(r.url())
  })
  await page.route(`${TURNSTILE}**`, (route) =>
    route.fulfill({ contentType: "text/javascript", body: TURNSTILE_STUB })
  )
  await page.route(`**${ENDPOINT}`, async (route) => {
    const headers = route.request().headers()
    const sent: Sent = {
      body: route.request().postDataJSON(),
      session: headers["ask-session"] ?? null,
      turnstile: headers["ask-turnstile"] ?? null,
    }
    requests.push(sent)
    const r =
      typeof reply === "function" ? reply(sent, requests.length - 1) : reply
    await route.fulfill({
      status: r.status ?? 200,
      headers: {
        "Content-Type": r.type ?? "text/event-stream; charset=utf-8",
        ...r.headers,
      },
      body: r.body ?? "",
    })
  })
  return { requests, turnstile }
}

const ANSWER = sse([
  ["delta", { text: "TenderLift covers all 26 cantons," }],
  ["delta", { text: " in German, French, Italian and English." }],
  [
    "done",
    {
      outcome: "answer",
      sources: [
        { href: "/work/tenderlift", label: "TenderLift case study" },
        { href: "javascript:alert(1)", label: "Bad" },
      ],
    },
  ],
])
const ANSWER_TEXT =
  "TenderLift covers all 26 cantons, in German, French, Italian and English."

const refusal = (status: number, body: Record<string, unknown>): Reply => ({
  status,
  type: "application/json",
  body: JSON.stringify(body),
})

const M = ASK.live.messages

test.describe("with the live model", () => {
  // The dev server is built without the Ask variables, so its policy does
  // not list Turnstile's origin; the stub is served from that origin anyway.
  test.use({ bypassCSP: true })

  test("a typed question passes the check once, then streams its answer with checked sources", async ({
    page,
  }) => {
    const live = await mockLive(page, (sent): Reply => {
      const headers: Record<string, string> = {}
      if (!sent.session) headers["Ask-Session"] = "c2Vzc2lvbg.c2lnbmF0dXJl"
      return { body: ANSWER, headers }
    })
    const dialog = await openAsk(page)
    const question = "Which languages does TenderLift read?"
    await type(dialog, question)

    await expect(paragraph(dialog, question)).toBeVisible()
    await expect(dialog.getByText(ANSWER_TEXT)).toBeVisible()
    // Only the question is sent, with the Turnstile token and no session.
    expect(live.requests).toEqual([
      { body: { question }, session: null, turnstile: DUMMY_TOKEN },
    ])
    expect(live.turnstile).toHaveLength(1)
    const options = await page.evaluate(
      () =>
        (window as { __turnstileOptions?: Record<string, unknown> })
          .__turnstileOptions
    )
    expect(options).toMatchObject({
      sitekey: KEYS.pass,
      action: "ask",
      appearance: "interaction-only",
    })
    // The source line links the page the Worker checked; the unsafe one is
    // dropped before it can render.
    const source = dialog.getByRole("link", {
      name: `${ASK.live.sourcePrefix} · TENDERLIFT CASE STUDY`,
    })
    await expect(source).toHaveAttribute("href", "/work/tenderlift")
    await expect(dialog.locator('a[href^="javascript:"]')).toHaveCount(0)
    await expect(
      dialog.locator('a[href="https://tenderlift.ch"]').first()
    ).toBeVisible()

    // The next question carries the session instead: no second check.
    await type(dialog, "Does TenderLift cover Ticino as well?")
    await expect.poll(() => live.requests.length).toBe(2)
    expect(live.requests[1]).toMatchObject({
      session: "c2Vzc2lvbg.c2lnbmF0dXJl",
      turnstile: null,
    })
    expect(live.turnstile).toHaveLength(1)
  })

  test("nothing from Turnstile loads until a typed question is sent", async ({
    page,
  }) => {
    const live = await mockLive(page, { body: ANSWER })
    const dialog = await openAsk(page)
    const q = ASK.questions[0]
    await chips(dialog).getByRole("button", { name: q.chip }).click()
    await expect(dialog.getByText(q.answer)).toBeVisible()
    // Prepared questions answer from content: no model, no check.
    expect(live.requests).toHaveLength(0)
    expect(live.turnstile).toHaveLength(0)
    expect(await page.evaluate(() => "turnstile" in window)).toBe(false)

    await type(dialog, "Which languages does TenderLift read?")
    await expect(dialog.getByText(ANSWER_TEXT)).toBeVisible()
    expect(live.turnstile).toHaveLength(1)
  })

  test("a failed check says so, sends nothing, and keeps the suggestions", async ({
    page,
  }) => {
    const live = await mockLive(page, { body: ANSWER }, "fail")
    const dialog = await openAsk(page)
    await type(dialog, "Which languages does TenderLift read?")
    await expect(dialog.getByText(M.challenge_failed)).toBeVisible()
    expect(live.requests).toHaveLength(0)
    await expect(dialog.locator('a[href^="mailto:"]').first()).toBeVisible()
    await expect(
      chips(dialog).getByRole("button", { name: ASK.questions[0].chip })
    ).toBeVisible()
  })

  test("a check that needs a tick says so and works with the keyboard", async ({
    page,
    browserName,
  }) => {
    const live = await mockLive(page, { body: ANSWER }, "interactive")
    const dialog = await openAsk(page)
    const box = dialog.getByRole("textbox", { name: ASK.inputLabel })
    await box.fill("Which languages does TenderLift read?")
    await box.press("Enter")
    await expect(
      dialog.getByRole("status").filter({ hasText: ASK.live.interactive })
    ).toBeVisible()
    const tick = dialog.getByRole("button", { name: "Verify you are human" })
    await expect(tick).toBeVisible()
    // Under the question field: the next stops after it in the tab order.
    // (WebKit on macOS tabs to buttons only with Option held.)
    const tab = browserName === "webkit" ? "Alt+Tab" : "Tab"
    await box.focus()
    await page.keyboard.press(tab)
    await page.keyboard.press(tab)
    await expect(tick).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(dialog.getByText(ANSWER_TEXT)).toBeVisible()
    await expect(dialog.getByText(ASK.live.interactive)).toHaveCount(0)
    expect(live.requests).toHaveLength(1)
  })

  test("an expired session runs the check again and resends the question", async ({
    page,
  }) => {
    const live = await mockLive(page, (sent, i) =>
      i === 1 && sent.session
        ? refusal(401, { outcome: "challenge_needed" })
        : {
            body: ANSWER,
            headers: { "Ask-Session": `c2Vzc2lvbg.c2lnbmF0dXJl${i}` },
          }
    )
    const dialog = await openAsk(page)
    await type(dialog, "Which languages does TenderLift read?")
    await expect(dialog.getByText(ANSWER_TEXT)).toBeVisible()
    await type(dialog, "Does TenderLift cover Ticino as well?")
    await expect.poll(() => live.requests.length).toBe(3)
    expect(live.requests[2]).toMatchObject({
      session: null,
      turnstile: DUMMY_TOKEN,
    })
    expect(live.turnstile).toHaveLength(1)
  })

  const outcomes: {
    outcome: string
    reply: Reply
    line: string
    email: boolean
  }[] = [
    {
      outcome: "rate_limited",
      reply: refusal(429, { outcome: "rate_limited", retryAfter: 60 }),
      line: M.rate_limited.replace("{wait}", ASK.live.wait.minute),
      email: false,
    },
    {
      outcome: "daily_limit",
      reply: refusal(429, { outcome: "daily_limit", retryAfter: 50_000 }),
      line: M.daily_limit,
      email: true,
    },
    {
      outcome: "budget_reached",
      reply: refusal(429, { outcome: "budget_reached", retryAfter: 50_000 }),
      line: M.budget_reached,
      email: true,
    },
    {
      outcome: "unavailable",
      reply: refusal(503, { outcome: "unavailable" }),
      line: M.unavailable,
      email: true,
    },
    {
      outcome: "challenge_failed",
      reply: refusal(403, { outcome: "challenge_failed" }),
      line: M.challenge_failed,
      email: true,
    },
    {
      outcome: "bad_request",
      reply: refusal(400, { outcome: "bad_request" }),
      line: M.bad_request,
      email: false,
    },
    {
      outcome: "an unreadable reply",
      reply: { status: 502, type: "text/html", body: "<h1>Bad gateway</h1>" },
      line: M.unavailable,
      email: true,
    },
  ]

  for (const o of outcomes) {
    test(`${o.outcome} gets its own line`, async ({ page }) => {
      await mockLive(page, o.reply)
      const dialog = await openAsk(page)
      await type(dialog, "Which football team does he support?")
      await expect(dialog.getByText(o.line)).toBeVisible()
      await expect(dialog.getByText("Bad gateway")).toHaveCount(0)
      await expect(dialog.locator('a[href^="mailto:"]')).toHaveCount(
        o.email ? 1 : 0
      )
      if (o.outcome === "daily_limit") {
        // The Worker's per-visitor cap ends Ask for the day here too.
        await expect(dialog.getByText(ASK.done.line)).toBeVisible()
        await expect(
          dialog.getByRole("textbox", { name: ASK.inputLabel })
        ).toHaveCount(0)
        return
      }
      // The suggestions are still there to use.
      await expect(
        chips(dialog).getByRole("button", { name: ASK.questions[0].chip })
      ).toBeVisible()
    })
  }

  test("a network failure ends the wait with the unavailable line", async ({
    page,
  }) => {
    await mockLive(page, { body: ANSWER })
    await page.route(`**${ENDPOINT}`, (route) => route.abort("failed"))
    const dialog = await openAsk(page)
    await type(dialog, "Which football team does he support?")
    await expect(dialog.getByText(M.unavailable)).toBeVisible()
  })

  test("a stream that breaks off keeps what arrived and says it was cut short", async ({
    page,
  }) => {
    await mockLive(page, {
      body: sse([
        ["delta", { text: "TenderLift reads the Swiss public tenders" }],
        ["error", { outcome: "unavailable" }],
      ]),
    })
    const dialog = await openAsk(page)
    await type(dialog, "What does TenderLift do every day?")
    await expect(
      dialog.getByText("TenderLift reads the Swiss public tenders")
    ).toBeVisible()
    await expect(dialog.getByText(ASK.live.cutShort)).toBeVisible()
  })

  test("the model's text is shown as text, never as markup", async ({
    page,
  }) => {
    await mockLive(page, {
      body: sse([
        ["delta", { text: '<img src=x onerror="window.__xss=1"> <b>bold</b>' }],
        ["done", { outcome: "answer", sources: [] }],
      ]),
    })
    const dialog = await openAsk(page)
    await type(dialog, "Show me some markup please")
    await expect(dialog.getByText("<b>bold</b>")).toBeVisible()
    await expect(dialog.locator("img[src='x']")).toHaveCount(0)
    expect(await page.evaluate(() => "__xss" in window)).toBe(false)
  })

  test("an answer the site does not have offers the email", async ({
    page,
  }) => {
    await mockLive(page, {
      body: sse([
        ["delta", { text: "The site doesn't say." }],
        [
          "done",
          {
            outcome: "unknown",
            sources: [
              { href: "mailto:me@mladenruzicic.com", label: "Email Mladen" },
            ],
          },
        ],
      ]),
    })
    const dialog = await openAsk(page)
    await type(dialog, "Has he ever spoken at a conference?")
    await expect(dialog.getByText("The site doesn't say.")).toBeVisible()
    await expect(dialog.locator('a[href^="mailto:"]').first()).toBeVisible()
  })

  test("a question too short to answer is not sent", async ({ page }) => {
    const live = await mockLive(page, { body: ANSWER })
    const dialog = await openAsk(page)
    await type(dialog, "hi")
    await expect(dialog.getByText(M.bad_request)).toBeVisible()
    expect(live.requests).toHaveLength(0)
    expect(live.turnstile).toHaveLength(0)
  })
})
