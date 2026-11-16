import { expect, test, type Page, type Request } from "@playwright/test"

import { TURNSTILE_FIELD } from "@/lib/newsletter/protocol"
import { SITE } from "@/content/site"

import { escapeRe, gotoReady } from "./helpers"

/**
 * The newsletter line in every page's footer (owner, 13 Nov 2026; `content/site.ts` →
 * `newsletter`, `app/components/site/NewsletterForm.tsx`, the `subscribe`
 * Server Action).
 *
 * It writes to the owner's live list, so nothing here can subscribe anyone:
 * every address is `@example.com`, which the action refuses before it calls
 * the provider. The shared dev server and CI have no `CONVERTKIT_API_KEY`, so
 * a well-formed address gets the honest "offline" error; the success state is
 * tested by rewriting that real response on its way back to the page.
 *
 * The Turnstile check (owner, 16 Nov 2026) is off on a server without its
 * variables, which is tested as such; its client side is tested with a
 * published test site key and a stubbed script, so the suite never depends
 * on challenges.cloudflare.com. The server side, with Siteverify and Kit
 * mocked, is `newsletter-bots.spec.ts`.
 */

const COPY = SITE.newsletter
const ADDRESS = "someone@example.com"

/** The footer's email field, by its visible label. */
function emailField(page: Page) {
  return page
    .locator("footer")
    .getByRole("textbox", { name: COPY.inputLabel, exact: true })
}

function submit(page: Page) {
  return page
    .locator("footer")
    .getByRole("button", { name: COPY.submitLabel, exact: true })
}

function status(page: Page) {
  return page.locator("footer").getByRole("status")
}

/** A Server Action call from the page (a POST carrying `Next-Action`). */
function isAction(req: Request): boolean {
  return req.method() === "POST" && req.headers()["next-action"] !== undefined
}

/**
 * The sign-up's height and the footer nav's offset from it: both stay put
 * when the state changes (no layout shift). Page coordinates, so scrolling
 * between two reads does not count.
 */
function footerGeometry(page: Page) {
  return page.evaluate(() => {
    const news = document.querySelector("footer .news")
    const nav = document.querySelector("footer nav")
    if (!news || !nav) throw new Error("footer sign-up or nav missing")
    const a = news.getBoundingClientRect()
    const b = nav.getBoundingClientRect()
    return { height: a.height, width: a.width, navOffset: b.top - a.top }
  })
}

test.skip(!COPY.enabled, "the newsletter line is switched off in content")

test.describe("newsletter on every page", () => {
  for (const path of [
    "/work",
    "/work/tenderlift",
    "/work/zf-scalar",
    "/mentoring",
    "/about",
    "/press",
    "/no-such-page",
  ]) {
    test(`${path}: one sign-up in the footer, with ids of its own`, async ({
      page,
    }) => {
      await gotoReady(page, path)
      const footer = page.locator("footer")
      await expect(footer.locator(".news")).toHaveCount(1)
      await expect(footer.getByText(COPY.line, { exact: true })).toBeVisible()
      await expect(emailField(page)).toBeVisible()
      await expect(submit(page)).toBeEnabled()
      const dupes = await page.evaluate(() => {
        const ids = [...document.querySelectorAll("[id]")].map((e) => e.id)
        return ids.filter((id, i) => ids.indexOf(id) !== i)
      })
      expect(dupes).toEqual([])
    })
  }

  test("it works off the landing too: the server's answer shows in place", async ({
    page,
  }) => {
    await gotoReady(page, "/about")
    await emailField(page).fill("a@b")
    await submit(page).click()
    await expect(status(page)).toHaveText(COPY.errors.invalid)
    await expect(emailField(page)).toBeFocused()
  })
})

test.describe("newsletter", () => {
  test("the form is in the footer with a labelled email field", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const footer = page.locator("footer")
    await expect(footer.getByText(COPY.line, { exact: true })).toBeVisible()

    const field = emailField(page)
    await expect(field).toBeVisible()
    await expect(field).toHaveAttribute("type", "email")
    await expect(field).toHaveAttribute("autocomplete", "email")
    await expect(field).toHaveAttribute("required", "")
    await expect(submit(page)).toBeEnabled()

    // The live region exists before anything is announced.
    await expect(status(page)).toHaveCount(1)
    await expect(status(page)).toHaveText("")

    // The honeypot is neither reachable nor announced.
    const trap = footer.locator('input[name="website"]')
    await expect(trap).toHaveAttribute("tabindex", "-1")
    await expect(
      footer.getByRole("textbox", { name: COPY.honeypotLabel })
    ).toHaveCount(0)
  })

  test("an address the browser rejects is never sent", async ({ page }) => {
    await gotoReady(page, "/")
    let sent = 0
    page.on("request", (req) => {
      if (isAction(req)) sent++
    })
    await emailField(page).fill("not-an-address")
    await submit(page).click()
    await expect(emailField(page)).toHaveJSProperty("validity.valid", false)
    // Give a stray request the time to show up.
    await page.waitForTimeout(500)
    expect(sent).toBe(0)
    await expect(status(page)).toHaveText("")
  })

  test("an address the server rejects gets the invalid line", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    // `a@b` passes the browser's check; the server's zod schema wants a TLD.
    await emailField(page).fill("a@b")
    await submit(page).click()
    await expect(status(page)).toHaveText(COPY.errors.invalid)
    await expect(page.getByText(COPY.thanks)).toHaveCount(0)
    // The address is kept for correcting, and focus returns to it.
    await expect(emailField(page)).toHaveValue("a@b")
    await expect(emailField(page)).toBeFocused()
    await expect(emailField(page)).toHaveAttribute("aria-invalid", "true")
  })

  test("with no provider key the user is told, never thanked", async ({
    page,
  }) => {
    await gotoReady(page, "/")
    const before = await footerGeometry(page)
    await emailField(page).fill(ADDRESS)
    await submit(page).click()
    await expect(status(page)).toHaveText(COPY.errors.unavailable)
    await expect(page.getByText(COPY.thanks)).toHaveCount(0)
    await expect(emailField(page)).toHaveValue(ADDRESS)
    await expect(submit(page)).toBeEnabled()
    // The error takes the reserved status row: nothing moves.
    expect(await footerGeometry(page)).toEqual(before)
  })

  test("a confirmed sign-up shows the thanks in place", async ({ page }) => {
    // Let the real action run (it refuses or reports offline: nothing is
    // sent), then turn its answer into the one a confirmed sign-up returns.
    await page.route("**/*", async (route) => {
      const req = route.request()
      if (!isAction(req)) return route.fallback()
      const res = await route.fetch()
      const body = await res.text()
      const ok = body.replace(
        /\{"status":"error","code":"[a-z]+","email":"[^"]*"\}/,
        '{"status":"ok"}'
      )
      expect(ok, "the action's answer has the expected shape").not.toBe(body)
      await route.fulfill({ response: res, body: ok })
    })

    await gotoReady(page, "/")
    const before = await footerGeometry(page)
    await emailField(page).fill(ADDRESS)
    await submit(page).click()

    await expect(status(page)).toHaveText(COPY.thanks)
    await expect(status(page)).toBeFocused()
    // The form stays in the layout but leaves the page's interface.
    await expect(emailField(page)).toBeHidden()
    await expect(page.locator("footer form")).toHaveAttribute("inert", "")
    expect(await footerGeometry(page)).toEqual(before)
  })

  test("with no Turnstile key nothing of the check exists", async ({
    page,
  }) => {
    const turnstile: string[] = []
    page.on("request", (r) => {
      if (r.url().startsWith(TURNSTILE)) turnstile.push(r.url())
    })
    let posted = ""
    page.on("request", (r) => {
      if (isAction(r)) posted = r.postData() ?? ""
    })
    await gotoReady(page, "/")
    await expect(
      page.locator(`footer [name="${TURNSTILE_FIELD}"]`)
    ).toHaveCount(0)
    await emailField(page).fill(ADDRESS)
    await submit(page).click()
    await expect(status(page)).toHaveText(COPY.errors.unavailable)
    expect(posted).toContain(ADDRESS)
    expect(tokenSent(posted)).toBeNull()
    expect(turnstile).toEqual([])
  })

  test("without JavaScript the form still posts and reports", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto("/")
    await emailField(page).fill(ADDRESS)
    await submit(page).click()
    await page.waitForLoadState("load")
    await expect(status(page)).toHaveText(
      new RegExp(`^${escapeRe(COPY.errors.unavailable)}$`)
    )
    await expect(page.getByText(COPY.thanks)).toHaveCount(0)
    await context.close()
  })
})

/* -------------------------------------------------------------------------- */
/* The Turnstile check, client side                                           */
/* -------------------------------------------------------------------------- */

const TURNSTILE = "https://challenges.cloudflare.com/"
/** Cloudflare's published test site keys (developers.cloudflare.com/turnstile/troubleshooting/testing/). */
const KEYS = {
  pass: "1x00000000000000000000AA",
  fail: "2x00000000000000000000AB",
  interactive: "3x00000000000000000000FF",
}
const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"

/**
 * Turnstile's `api.js`, stubbed with the test keys' behaviour (as in
 * `ask.spec.ts`), recording each render: its options and the field that had
 * focus. The n-th render's token is `XXXX.DUMMY.TOKEN.XXXX.n`, so a post
 * shows which render it came from. The "tick" of the interactive key is a
 * real button.
 */
const TURNSTILE_STUB = `
window.__turnstileRenders = []
window.turnstile = {
  render(el, o) {
    const id = "w" + Math.random().toString(36).slice(2)
    const n = window.__turnstileRenders.push({
      action: o.action,
      appearance: o.appearance,
      focus: document.activeElement && document.activeElement.name,
    })
    const token = "${DUMMY_TOKEN}." + n
    const k = o.sitekey
    if (k.startsWith("2x")) setTimeout(() => o["error-callback"]("300030"), 30)
    else if (k.startsWith("3x")) setTimeout(() => {
      o["before-interactive-callback"]()
      const b = document.createElement("button")
      b.type = "button"
      b.textContent = "Verify you are human"
      b.dataset.widget = id
      b.onclick = () => { o["after-interactive-callback"](); o.callback(token) }
      el.append(b)
    }, 30)
    else setTimeout(() => o.callback(token), 30)
    return id
  },
  remove(id) {
    document.querySelectorAll('[data-widget="' + id + '"]').forEach((n) => n.remove())
  },
}
`

/**
 * The token in a posted action body (multipart; React prefixes field names),
 * `""` for an empty field, `null` when there is no such field at all.
 */
function tokenSent(body: string): string | null {
  const m = new RegExp(
    `name="[^"]*${TURNSTILE_FIELD}"\\r?\\n\\r?\\n([^\\r\\n]*)`
  ).exec(body)
  return m ? m[1] : null
}

/**
 * Turns the client side of the check on with a test key
 * (`window.__newsletterTurnstileSiteKey`, read by `NewsletterForm`) and
 * serves the stub for Turnstile's script. The server has no secret, so it
 * ignores the token and answers as before; what is tested is what the page
 * loads and posts.
 */
async function withCheck(page: Page, key: keyof typeof KEYS = "pass") {
  const scripts: string[] = []
  const posts: string[] = []
  await page.addInitScript((siteKey) => {
    ;(
      window as { __newsletterTurnstileSiteKey?: string }
    ).__newsletterTurnstileSiteKey = siteKey
  }, KEYS[key])
  page.on("request", (r) => {
    if (r.url().startsWith(TURNSTILE)) scripts.push(r.url())
    if (isAction(r)) posts.push(r.postData() ?? "")
  })
  await page.route(`${TURNSTILE}**`, (route) =>
    route.fulfill({ contentType: "text/javascript", body: TURNSTILE_STUB })
  )
  return { scripts, posts }
}

interface Render {
  action: string
  appearance: string
  /** The `name` of the element that had focus when the widget rendered. */
  focus: string | null
}

function renders(page: Page): Promise<Render[]> {
  return page.evaluate(
    () => (window as { __turnstileRenders?: Render[] }).__turnstileRenders ?? []
  )
}

test.describe("newsletter with the Turnstile check", () => {
  // The server is built without the Turnstile variables, so its policy does
  // not list Turnstile's origin; the stub is served from that origin anyway.
  test.use({ bypassCSP: true })

  test("the script loads on the first focus, never with the page", async ({
    page,
  }) => {
    const { scripts } = await withCheck(page)
    await gotoReady(page, "/")
    await page.mouse.wheel(0, 4000)
    await page.waitForTimeout(500)
    expect(scripts, "nothing of Turnstile on page load").toEqual([])

    await emailField(page).focus()
    await expect.poll(() => scripts.length).toBe(1)
    expect(scripts[0]).toContain("render=explicit")
    await expect
      .poll(() => renders(page))
      .toEqual([
        {
          action: "newsletter",
          appearance: "interaction-only",
          focus: "email",
        },
      ])
    // Typing does not ask again while a token is in hand.
    await emailField(page).fill(ADDRESS)
    await page.waitForTimeout(200)
    expect(await renders(page)).toHaveLength(1)
    expect(scripts).toHaveLength(1)
  })

  test("the token goes with the post, and each post gets a fresh one", async ({
    page,
  }) => {
    const { posts } = await withCheck(page)
    await gotoReady(page, "/")
    const before = await footerGeometry(page)
    await emailField(page).fill(ADDRESS)
    await submit(page).click()
    // No secret on this server: the check is not enforced, the answer is
    // the one it always was.
    await expect(status(page)).toHaveText(COPY.errors.unavailable)
    expect(posts).toHaveLength(1)
    expect(tokenSent(posts[0])).toBe(`${DUMMY_TOKEN}.1`)
    // The widget ran unseen: nothing moved.
    expect(await footerGeometry(page)).toEqual(before)

    // The error puts focus back in the field, which starts the next check
    // at once, so a retry finds its token ready (render 2).
    await expect.poll(async () => (await renders(page)).length).toBe(2)
    const answered = page.waitForResponse((r) => isAction(r.request()))
    await submit(page).click()
    await answered
    expect(posts).toHaveLength(2)
    expect(tokenSent(posts[1])).toBe(`${DUMMY_TOKEN}.2`)
    // One render per post, plus the one the second error starts for the
    // next retry; every one of them on the field's focus, none on a send.
    await expect.poll(async () => (await renders(page)).length).toBe(3)
    await page.waitForTimeout(300)
    expect((await renders(page)).map((r) => r.focus)).toEqual([
      "email",
      "email",
      "email",
    ])
  })

  test("a failed check still posts, without a token", async ({ page }) => {
    const { posts } = await withCheck(page, "fail")
    await gotoReady(page, "/")
    await emailField(page).fill(ADDRESS)
    await submit(page).click()
    await expect(status(page)).toHaveText(COPY.errors.unavailable)
    expect(posts).toHaveLength(1)
    expect(tokenSent(posts[0])).toBe("")
  })

  test("when Turnstile asks for a tick, it shows under the field and the send waits", async ({
    page,
  }) => {
    const { posts } = await withCheck(page, "interactive")
    await gotoReady(page, "/")
    await emailField(page).fill(ADDRESS)
    const tick = page
      .locator("footer form")
      .getByRole("button", { name: "Verify you are human" })
    await expect(tick).toBeVisible()
    // Sent before the tick: the send is held, the button busy.
    await submit(page).click()
    await expect(submit(page)).toBeDisabled()
    await page.waitForTimeout(300)
    expect(posts).toHaveLength(0)
    // The tick is a control in the form, reachable like any other.
    await tick.focus()
    await page.keyboard.press("Enter")
    await expect(tick).toHaveCount(0)
    await expect(status(page)).toHaveText(COPY.errors.unavailable)
    expect(posts).toHaveLength(1)
    expect(tokenSent(posts[0])).toBe(`${DUMMY_TOKEN}.1`)
  })
})
