import { expect, test } from "@playwright/test"

import { KIT_ENDPOINT, runSubscribe } from "@/lib/newsletter/subscribe"
import {
  clientIp,
  requestHostname,
  SITEVERIFY_URL,
  TURNSTILE_FIELD,
  verifyTurnstile,
} from "@/lib/newsletter/turnstile"

/**
 * The newsletter's bot checks on the server (`lib/newsletter/subscribe.ts`,
 * `lib/newsletter/turnstile.ts`), run in Node with `fetch` replaced: Kit and
 * Cloudflare's Siteverify are answered here, so nothing leaves the machine,
 * no key is needed, and no browser is opened.
 *
 * - No Turnstile variables (dev, CI, production until the secret is added):
 *   the sign-up works as it always did.
 * - A filled honeypot: the success-looking answer, and Kit is never called.
 * - Both variables set: no token, or one Siteverify does not accept, is
 *   refused with the generic `failed` line before Kit is called.
 *
 * Every value below is made up: no real key, secret or list is involved.
 */

const ADDRESS = "someone@mladenruzicic.dev"
const KIT_KEY = "kit-key-for-tests"
const SITE_KEY = "1x00000000000000000000AA"
const SECRET = "secret-for-tests-not-a-real-one"
const HOST = "mladenruzicic.com"
const IP = "203.0.113.7"
const TOKEN = "token-for-tests.abc_DEF-123"

const NO_CHECK = { CONVERTKIT_API_KEY: KIT_KEY, NODE_ENV: "production" }
const CHECK = {
  ...NO_CHECK,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY,
  TURNSTILE_SECRET_KEY: SECRET,
}

const SIGNED_UP = { subscription: { id: 1, state: "inactive" } }
const VERIFIED = {
  success: true,
  hostname: HOST,
  action: "newsletter",
  "error-codes": [],
}

interface Call {
  url: string
  body: string
}

type Answer = unknown | Response | Error

/** A `fetch` that answers Siteverify and Kit from here and records calls. */
function network({
  verify = VERIFIED,
  kit = SIGNED_UP,
}: { verify?: Answer; kit?: Answer } = {}) {
  const calls: Call[] = []
  const answer = (a: Answer) => {
    if (a instanceof Error) throw a
    if (a instanceof Response) return a
    return Response.json(a)
  }
  const send = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, body: String(init?.body ?? "") })
    if (url === SITEVERIFY_URL) return answer(verify)
    if (url === KIT_ENDPOINT) return answer(kit)
    throw new Error(`unexpected request to ${url}`)
  }) as typeof fetch
  return {
    send,
    calls,
    to: (url: string) => calls.filter((c) => c.url === url),
  }
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [k, v] of Object.entries(fields)) data.set(k, v)
  return data
}

const headers = (extra: Record<string, string> = {}) =>
  new Headers({ host: HOST, "x-real-ip": IP, ...extra })

const failed = { status: "error", code: "failed", email: ADDRESS }

test.describe("newsletter check: no Turnstile variables", () => {
  for (const [name, env] of [
    ["neither set", NO_CHECK],
    // Production today: the site key is set for Ask, the secret not yet.
    [
      "only the site key",
      { ...NO_CHECK, NEXT_PUBLIC_TURNSTILE_SITE_KEY: SITE_KEY },
    ],
    ["only the secret", { ...NO_CHECK, TURNSTILE_SECRET_KEY: SECRET }],
  ] as const) {
    test(`${name}: a sign-up goes to Kit without a token`, async () => {
      const net = network()
      const state = await runSubscribe(form({ email: ADDRESS }), {
        env,
        headers: headers(),
        fetch: net.send,
      })
      expect(state).toEqual({ status: "ok" })
      expect(net.to(SITEVERIFY_URL)).toHaveLength(0)
      expect(net.to(KIT_ENDPOINT)).toHaveLength(1)
      expect(JSON.parse(net.calls[0].body)).toEqual({
        api_key: KIT_KEY,
        email: ADDRESS,
      })
    })
  }

  test("success only when Kit confirms", async () => {
    const net = network({ kit: { error: "nope" } })
    const state = await runSubscribe(form({ email: ADDRESS }), {
      env: NO_CHECK,
      headers: headers(),
      fetch: net.send,
    })
    expect(state).toEqual(failed)
  })

  test("no Kit key: the honest offline line, nothing sent", async () => {
    const net = network()
    const state = await runSubscribe(form({ email: ADDRESS }), {
      env: { NODE_ENV: "production" },
      headers: headers(),
      fetch: net.send,
    })
    expect(state).toEqual({
      status: "error",
      code: "unavailable",
      email: ADDRESS,
    })
    expect(net.calls).toHaveLength(0)
  })

  test("a reserved address is never sent, check or no check", async () => {
    for (const env of [NO_CHECK, CHECK]) {
      const net = network()
      const state = await runSubscribe(
        form({ email: "someone@example.com", [TURNSTILE_FIELD]: TOKEN }),
        { env, headers: headers(), fetch: net.send }
      )
      expect(state).toMatchObject({ status: "error", code: "invalid" })
      expect(net.calls).toHaveLength(0)
    }
  })
})

test.describe("newsletter check: the honeypot", () => {
  for (const [name, env] of [
    ["no Turnstile", NO_CHECK],
    ["with Turnstile", CHECK],
  ] as const) {
    test(`${name}: a filled honeypot looks like success and calls nothing`, async () => {
      const net = network()
      const state = await runSubscribe(
        form({ email: ADDRESS, website: "https://spam.example" }),
        { env, headers: headers(), fetch: net.send }
      )
      expect(state).toEqual({ status: "ok" })
      expect(net.calls).toHaveLength(0)
    })
  }
})

test.describe("newsletter check: Turnstile on", () => {
  test("a token that verifies: Siteverify first, then Kit", async () => {
    const net = network()
    const state = await runSubscribe(
      form({ email: ADDRESS, [TURNSTILE_FIELD]: TOKEN }),
      { env: CHECK, headers: headers(), fetch: net.send }
    )
    expect(state).toEqual({ status: "ok" })
    expect(net.calls.map((c) => c.url)).toEqual([SITEVERIFY_URL, KIT_ENDPOINT])
    const sent = new URLSearchParams(net.calls[0].body)
    expect(sent.get("secret")).toBe(SECRET)
    expect(sent.get("response")).toBe(TOKEN)
    expect(sent.get("remoteip")).toBe(IP)
  })

  test("no token: refused, nothing sent", async () => {
    for (const token of [null, "", "has spaces in it", "x".repeat(2049)]) {
      const net = network()
      const fields: Record<string, string> = { email: ADDRESS }
      if (token !== null) fields[TURNSTILE_FIELD] = token
      const state = await runSubscribe(form(fields), {
        env: CHECK,
        headers: headers(),
        fetch: net.send,
      })
      expect(state, `token ${JSON.stringify(token)}`).toEqual(failed)
      expect(net.calls).toHaveLength(0)
    }
  })

  const refusals: [string, Answer][] = [
    [
      "Siteverify says no",
      { success: false, "error-codes": ["invalid-input-response"] },
    ],
    [
      "a spent token",
      { success: false, "error-codes": ["timeout-or-duplicate"] },
    ],
    ["a token from Ask", { ...VERIFIED, action: "ask" }],
    ["a token from another site", { ...VERIFIED, hostname: "evil.example" }],
    [
      "a wrong secret",
      { success: false, "error-codes": ["invalid-input-secret"] },
    ],
    ["Siteverify down", new Response("", { status: 503 })],
    ["Siteverify unreachable", new TypeError("fetch failed")],
    ["Siteverify garbled", new Response("<html>", { status: 200 })],
  ]
  for (const [name, verify] of refusals) {
    test(`${name}: refused with the generic line, Kit not called`, async () => {
      const net = network({ verify })
      const state = await runSubscribe(
        form({ email: ADDRESS, [TURNSTILE_FIELD]: TOKEN }),
        { env: CHECK, headers: headers(), fetch: net.send }
      )
      expect(state).toEqual(failed)
      expect(net.to(SITEVERIFY_URL)).toHaveLength(1)
      expect(net.to(KIT_ENDPOINT)).toHaveLength(0)
    })
  }

  test("a published test secret counts only under next dev", async () => {
    const env = {
      ...CHECK,
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    }
    const dummy = { success: true, hostname: "example.com", action: "" }

    const prod = network({ verify: dummy })
    expect(
      await runSubscribe(form({ email: ADDRESS, [TURNSTILE_FIELD]: TOKEN }), {
        env,
        headers: headers(),
        fetch: prod.send,
      })
    ).toEqual(failed)
    expect(prod.calls).toHaveLength(0)

    const dev = network({ verify: dummy })
    expect(
      await runSubscribe(form({ email: ADDRESS, [TURNSTILE_FIELD]: TOKEN }), {
        env: { ...env, NODE_ENV: "development" },
        headers: headers(),
        fetch: dev.send,
      })
    ).toEqual({ status: "ok" })
  })

  test("Siteverify is given up on after the timeout", async () => {
    const hang = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(init.signal?.reason)
        )
      })) as typeof fetch
    const started = Date.now()
    const verdict = await verifyTurnstile(TOKEN, {
      secret: SECRET,
      hostname: HOST,
      remoteIp: null,
      allowTestSecret: false,
      fetch: hang,
      timeoutMs: 100,
    })
    expect(verdict).toBe("unavailable")
    expect(Date.now() - started).toBeLessThan(2_000)
  })

  test("no visitor IP in the headers: none is sent", async () => {
    const net = network()
    await runSubscribe(form({ email: ADDRESS, [TURNSTILE_FIELD]: TOKEN }), {
      env: CHECK,
      headers: new Headers({ host: HOST }),
      fetch: net.send,
    })
    expect(new URLSearchParams(net.calls[0].body).has("remoteip")).toBe(false)
  })
})

test.describe("newsletter check: request helpers", () => {
  test("the hostname is the forwarded host, else the host, without a port", () => {
    expect(requestHostname(new Headers({ host: "localhost:3104" }))).toBe(
      "localhost"
    )
    expect(
      requestHostname(
        new Headers({
          host: "internal:80",
          "x-forwarded-host": "MladenRuzicic.com",
        })
      )
    ).toBe("mladenruzicic.com")
    expect(requestHostname(new Headers({ host: "[::1]:3000" }))).toBe("[::1]")
    expect(requestHostname(new Headers())).toBeNull()
  })

  test("the visitor IP comes from the platform's headers or not at all", () => {
    expect(clientIp(new Headers({ "x-real-ip": IP }))).toBe(IP)
    expect(
      clientIp(new Headers({ "x-forwarded-for": `${IP}, 10.0.0.1` }))
    ).toBe(IP)
    expect(clientIp(new Headers({ "x-forwarded-for": "2001:db8::1" }))).toBe(
      "2001:db8::1"
    )
    expect(clientIp(new Headers({ "x-real-ip": "<script>" }))).toBeNull()
    expect(clientIp(new Headers())).toBeNull()
  })
})
