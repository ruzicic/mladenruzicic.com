import { describe, expect, it } from "vitest"

import { readAnswer } from "../eval/read-answer"
import { readConfig } from "../src/config"
import {
  acceptsEventStream,
  isAllowedOrigin,
  normalizeForMemo,
  parseQuestion,
  readCappedBody,
  screenQuestion,
  visitorAddress,
} from "../src/guards"
import { handleRequest } from "../src/handler"
import { ask, CONFIG, deps, ORIGIN } from "./helpers"

describe("origins", () => {
  it("allows the production origins exactly", () => {
    expect(isAllowedOrigin("https://mladenruzicic.com", CONFIG)).toBe(true)
    expect(isAllowedOrigin("https://www.mladenruzicic.com", CONFIG)).toBe(true)
    expect(isAllowedOrigin("https://mladenruzicic.com.evil.test", CONFIG)).toBe(
      false
    )
    expect(isAllowedOrigin("http://mladenruzicic.com", CONFIG)).toBe(false)
    expect(isAllowedOrigin("https://ask.mladenruzicic.com", CONFIG)).toBe(false)
    expect(isAllowedOrigin("null", CONFIG)).toBe(false)
    expect(isAllowedOrigin(null, CONFIG)).toBe(false)
  })

  it("allows localhost only when switched on", () => {
    expect(isAllowedOrigin("http://localhost:3200", CONFIG)).toBe(false)
    const dev = readConfig({
      ASK_ALLOWED_ORIGINS: "",
      ASK_ALLOW_LOCALHOST: "true",
    })
    expect(isAllowedOrigin("http://localhost:3200", dev)).toBe(true)
    expect(isAllowedOrigin("http://127.0.0.1:8787", dev)).toBe(true)
    expect(isAllowedOrigin("http://localhost.evil.test", dev)).toBe(false)
    expect(isAllowedOrigin("https://localhost:3200", dev)).toBe(false)
  })

  it("refuses another origin without CORS headers, before any work", async () => {
    const { deps: d, calls } = deps()
    const res = await handleRequest(
      ask({ question: "What is TenderLift?" }, { origin: "https://evil.test" }),
      d
    )
    expect(res.status).toBe(403)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull()
    expect(calls.limit).toHaveLength(0)
    expect(calls.turnstile).toHaveLength(0)
    expect(calls.run).toHaveLength(0)
  })
})

describe("CORS", () => {
  it("answers a preflight with the exact origin, the two headers, no credentials", async () => {
    const { deps: d, calls } = deps()
    const res = await handleRequest(
      ask(null, {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Method": "POST" },
      }),
      d
    )
    expect(res.status).toBe(204)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN)
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("POST")
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe(
      "Content-Type, Ask-Session, Ask-Turnstile"
    )
    expect(res.headers.get("Access-Control-Expose-Headers")).toBe(
      "Ask-Session, Retry-After"
    )
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBeNull()
    expect(res.headers.get("Vary")).toBe("Origin")
    expect(calls.limit).toHaveLength(0)
  })

  it("refuses a preflight for another method", async () => {
    const { deps: d } = deps()
    const res = await handleRequest(
      ask(null, {
        method: "OPTIONS",
        headers: { "Access-Control-Request-Method": "PUT" },
      }),
      d
    )
    expect(res.status).toBe(403)
  })

  it("sends the security headers on every response", async () => {
    const { deps: d } = deps()
    for (const req of [
      ask({ question: "What is TenderLift?" }),
      ask({ question: "hi" }),
      ask(null, { path: "/" }),
    ]) {
      const res = await handleRequest(req, d)
      expect(res.headers.get("Cache-Control")).toBe("no-store")
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff")
      expect(res.headers.get("Content-Security-Policy")).toContain(
        "default-src 'none'"
      )
      await res.body?.cancel()
    }
  })
})

describe("body and question", () => {
  it("cuts off a body with no length as soon as it passes the cap", async () => {
    const big = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024))
      },
    })
    const req = new Request("https://x.test/ask", {
      method: "POST",
      body: big,
      // @ts-expect-error Node needs this for a streamed request body.
      duplex: "half",
    })
    expect(await readCappedBody(req, 2048)).toEqual({
      ok: false,
      reason: "too_large",
    })
  })

  it("refuses a body that is not UTF-8", async () => {
    const req = new Request("https://x.test/ask", {
      method: "POST",
      body: new Uint8Array([0x7b, 0xff, 0xfe, 0x7d]),
    })
    expect((await readCappedBody(req)).ok).toBe(false)
  })

  it("caps the question at 3 to 500 characters", () => {
    const len = (n: number) =>
      parseQuestion(JSON.stringify({ question: "a".repeat(n) })).ok
    expect(len(2)).toBe(false)
    expect(len(3)).toBe(true)
    expect(len(500)).toBe(true)
    expect(len(501)).toBe(false)
  })

  it("takes only { question }: no history, no options", () => {
    const ok = (body: unknown) => parseQuestion(JSON.stringify(body)).ok
    expect(ok({ question: "Who is he?", history: [] })).toBe(false)
    expect(ok({ messages: [{ role: "user", content: "x" }] })).toBe(false)
    expect(ok({ question: 42 })).toBe(false)
    expect(ok([])).toBe(false)
    expect(ok(null)).toBe(false)
    expect(parseQuestion("not json").ok).toBe(false)
    expect(ok({ question: "   " })).toBe(false)
  })

  it("removes control and invisible characters", () => {
    const r = parseQuestion(
      JSON.stringify({ question: "Who\u200b is\u202e he?\u0007" })
    )
    expect(r).toEqual({ ok: true, question: "Who is he?" })
  })

  it("asks for a stream", () => {
    expect(acceptsEventStream("text/event-stream")).toBe(true)
    expect(acceptsEventStream("application/json, text/event-stream")).toBe(true)
    expect(acceptsEventStream("*/*")).toBe(false)
    expect(acceptsEventStream(null)).toBe(false)
  })
})

describe("the spam screen", () => {
  it("passes ordinary questions, one bare domain included", () => {
    for (const q of [
      "What is TenderLift?",
      "Is studenti.rs his?",
      "Koliko dugo radi studenti.rs?",
      "CV?",
      "Did he build https://studenti.rs or not, and when did it start?",
    ])
      expect(screenQuestion(q), q).toEqual({ ok: true })
  })

  it("refuses link spam and questions without words", () => {
    for (const q of [
      "Visit https://a.example and https://b.example",
      "www.a.example www.b.example",
      "see https://spam.example/a/very/long/path?x=1",
      "spam.example/landing/page?ref=ask",
      "??? 1234",
    ])
      expect(screenQuestion(q).ok, q).toBe(false)
  })

  it("compares repeats without case, spacing or punctuation", () => {
    expect(normalizeForMemo("What is TenderLift?")).toBe(
      normalizeForMemo("  what is   tenderlift ")
    )
    expect(normalizeForMemo("Šta radi?")).toBe("šta radi")
  })
})

describe("the visitor", () => {
  it("is an IPv4 address, or an IPv6 /64", () => {
    expect(visitorAddress("203.0.113.7")).toBe("203.0.113.7")
    expect(visitorAddress("2001:db8:0:1:aaaa:bbbb:cccc:dddd")).toBe(
      "2001:db8:0:1::/64"
    )
    // Privacy addresses in the same /64 are one visitor.
    expect(visitorAddress("2001:db8::1:1234")).toBe(
      visitorAddress("2001:0db8:0000:0000:ffff:0:0:1")
    )
    expect(visitorAddress("2001:DB8:0:2::1")).toBe("2001:db8:0:2::/64")
    expect(visitorAddress("::ffff:203.0.113.7")).toBe("203.0.113.7")
    expect(visitorAddress("::1")).toBe("0:0:0:0::/64")
  })

  it("shares one daily allowance across a /64", async () => {
    const { deps: d } = deps()
    let last = ""
    for (let i = 0; i <= CONFIG.visitorDailyCap; i++) {
      const ip = `2001:db8:0:1::${i + 1}`
      const res = await handleRequest(
        ask({ question: `Question number ${i}?` }, { ip }),
        d
      )
      last = (await readAnswer(res)).outcome ?? ""
    }
    expect(last).toBe("daily_limit")
  })
})
