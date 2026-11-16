import { afterEach, describe, expect, it, vi } from "vitest"

import { readAnswer } from "../eval/read-answer"
import { buildDeployConfig, logRetentionDays } from "../scripts/local-config"
import { readConfig } from "../src/config"
import { handleRequest } from "../src/handler"
import type { Admission } from "../src/limits-store"
import {
  cleanLoggedQuestion,
  d1QuestionLog,
  purgeCutoff,
  purgeQuestions,
} from "../src/questions-log"
import { modelText, type ModelUsage } from "../src/stream"
import {
  ask,
  CONFIG,
  deps,
  DUMMY_TOKEN,
  IP,
  modelStream,
  NOW,
  sessionFor,
  settle,
  UA,
  VARS,
  type DepsOverrides,
} from "./helpers"
import { SqliteQuestions } from "./sqlite-questions"

/**
 * The question log (src/questions-log.ts, migrations/0001_questions.sql):
 * what a row holds, what it never holds, when nothing is written, that a
 * failing database never changes an answer, and the daily purge. The
 * database is a local SQLite built from the real migration.
 */

const Q = { question: "Who is behind TenderLift?" }
const ANSWER_TEXT = "Mladen co-founded TenderLift in September 2025."

/** Exactly the columns a row has: nothing that could name a visitor. */
const COLUMNS = [
  "id",
  "asked_at",
  "question",
  "outcome",
  "replayed",
  "sources",
  "duration_ms",
  "input_tokens",
  "output_tokens",
  "model",
  "country",
]

function withCountry(request: Request, country: unknown): Request {
  Object.defineProperty(request, "cf", { value: { country } })
  return request
}

function setup(overrides: DepsOverrides = {}) {
  const db = new SqliteQuestions()
  const made = deps({ questions: d1QuestionLog(db), ...overrides })
  return { db, ...made }
}

/** Stubs the limits object's verdict. */
function admitting(admission: Admission): DepsOverrides {
  const { limits } = deps()
  return { limits: { ...limits, admit: async () => admission } }
}

async function run(
  overrides: DepsOverrides = {},
  request: Request = withCountry(ask(Q), "CH")
) {
  const s = setup(overrides)
  const answer = await readAnswer(await handleRequest(request, s.deps))
  await settle(s.calls)
  return { ...s, answer, rows: s.db.rows() }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("the question log: a row per outcome", () => {
  it("logs an answer with its time, sources, duration, tokens, model and country", async () => {
    const { rows, answer } = await run({
      model: async () =>
        modelStream(
          [
            "Mladen co-founded ",
            "TenderLift in September 2025. ",
            '<<<META>>>{"kind":"answer","sources":["/work/tenderlift"]}',
          ],
          { usage: { prompt_tokens: 15_600, completion_tokens: 210 } }
        ),
    })
    expect(answer.outcome).toBe("answer")
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row.asked_at).toBe(NOW.toISOString())
    expect(row.question).toBe(Q.question)
    expect(row.outcome).toBe("answer")
    expect(row.replayed).toBe(0)
    expect(JSON.parse(String(row.sources))).toEqual(["/work/tenderlift"])
    expect(row.duration_ms).toEqual(expect.any(Number))
    expect(Number(row.duration_ms)).toBeGreaterThanOrEqual(0)
    expect(row.input_tokens).toBe(15_600)
    expect(row.output_tokens).toBe(210)
    expect(row.model).toBe(CONFIG.model)
    expect(row.country).toBe("CH")
  })

  it("leaves token counts empty when the stream does not report them", async () => {
    const { rows } = await run()
    expect(rows[0].input_tokens).toBeNull()
    expect(rows[0].output_tokens).toBeNull()
  })

  it("logs the model's refusal (out of scope) and an unknown", async () => {
    const refused = await run({
      reply: [
        "That is outside what Ask covers. ",
        '<<<META>>>{"kind":"out_of_scope","sources":["/about"]}',
      ],
    })
    expect(refused.rows.map((r) => [r.outcome, r.sources])).toEqual([
      ["out_of_scope", "[]"],
    ])
    const unknown = await run({
      reply: [
        "The site doesn't say. ",
        '<<<META>>>{"kind":"unknown","sources":[]}',
      ],
    })
    expect(unknown.rows[0].outcome).toBe("unknown")
    expect(JSON.parse(String(unknown.rows[0].sources))).toEqual([
      "mailto:me@mladenruzicic.com",
    ])
  })

  it("logs a repeat answered from the memo as replayed, without a model", async () => {
    const { db, deps: d, calls } = setup()
    const session = await sessionFor()
    await readAnswer(await handleRequest(ask(Q, { session }), d))
    await settle(calls)
    await readAnswer(await handleRequest(ask(Q, { session }), d))
    await settle(calls)
    const rows = db.rows()
    expect(rows.map((r) => [r.outcome, r.replayed, r.model])).toEqual([
      ["answer", 0, CONFIG.model],
      ["answer", 1, null],
    ])
    expect(rows[1].sources).toBe(rows[0].sources)
  })

  it.each([
    ["pending", "rate_limited"],
    ["daily_limit", "daily_limit"],
    ["budget_reached", "budget_reached"],
  ] as const)("logs a %s refusal as %s", async (kind, outcome) => {
    const { rows, calls } = await run(admitting({ kind } as Admission))
    expect(calls.run).toHaveLength(0)
    expect(rows.map((r) => [r.outcome, r.model, r.sources])).toEqual([
      [outcome, null, "[]"],
    ])
  })

  it("logs an error when the limits object fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { limits } = deps()
    const { rows } = await run({
      limits: {
        ...limits,
        admit: async () => {
          throw new Error("object overloaded")
        },
      },
    })
    expect(rows.map((r) => r.outcome)).toEqual(["error"])
  })

  it("logs an error when the model throws, and a timeout when it never starts", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const failed = await run({
      model: async () => {
        throw new Error("capacity")
      },
    })
    expect(failed.rows.map((r) => [r.outcome, r.model])).toEqual([
      ["error", CONFIG.model],
    ])
    const slow = await run({
      model: async () => modelStream([], { hang: true }),
    })
    expect(slow.rows.map((r) => r.outcome)).toEqual(["timeout"])
  })

  it("logs a timeout, once, when the answer takes too long", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { rows, answer } = await run({
      model: async () => modelStream(["He ", "is ", "slow "], { delayMs: 900 }),
    })
    expect(answer.events.at(-1)?.event).toBe("error")
    expect(rows.map((r) => r.outcome)).toEqual(["timeout"])
  })

  it("logs an error when the answer comes back empty", async () => {
    const { rows } = await run({
      reply: ['<<<META>>>{"kind":"answer","sources":[]}'],
    })
    expect(rows.map((r) => r.outcome)).toEqual(["error"])
  })

  it("logs a question from a fresh Turnstile check too", async () => {
    const { rows, calls } = await run(
      {},
      withCountry(ask(Q, { turnstile: DUMMY_TOKEN }), "IT")
    )
    expect(calls.turnstile).toHaveLength(1)
    expect(rows.map((r) => [r.outcome, r.country])).toEqual([["answer", "IT"]])
  })

  it("keeps the country only when it is two letters or digits", async () => {
    for (const [country, kept] of [
      ["T1", "T1"],
      ["Switzerland", null],
      [undefined, null],
      ["c'", null],
    ] as const) {
      const { rows } = await run({}, withCountry(ask(Q), country))
      expect(rows[0].country).toBe(kept)
    }
  })
})

describe("the question log: never an identifier", () => {
  it("has no column for an address, a hash, a session, a browser or the answer", () => {
    expect(new SqliteQuestions().columns()).toEqual(COLUMNS)
  })

  it("stores nothing of the address, the browser, the session or the answer", async () => {
    const session = await sessionFor()
    const { db, deps: d, calls } = setup()
    const res = await handleRequest(
      withCountry(
        ask(Q, { session, headers: { "X-Forwarded-For": "198.51.100.9" } }),
        "CH"
      ),
      d
    )
    const issued = res.headers.get("Ask-Session")
    const answer = await readAnswer(res)
    expect(answer.text).toBe(ANSWER_TEXT)
    await settle(calls)
    const stored = JSON.stringify(db.rows())
    for (const secret of [
      IP,
      "203.0.113",
      UA,
      session,
      ANSWER_TEXT,
      "198.51.100.9",
    ])
      expect(stored).not.toContain(secret)
    if (issued) expect(stored).not.toContain(issued)
    // Only the INSERT and nothing that reads the log back.
    expect(
      db.statements.every((s) => s.startsWith("INSERT INTO questions"))
    ).toBe(true)
  })

  it("stores the question cleaned and capped, never longer than 500 characters", () => {
    const long = `${"a".repeat(600)}`
    expect([...cleanLoggedQuestion(long)]).toHaveLength(500)
    expect(cleanLoggedQuestion("Who\u0000 is\u001b[31m he‮?​ ")).toBe(
      "Who is [31m he ?"
    )
  })
})

describe("the question log: when nothing is written", () => {
  it.each([
    ["a malformed body", ask(null, { raw: '{"question": 1}' }), 400],
    ["spam", ask({ question: "https://a.test https://b.test" }), 400],
    ["no check at all", ask(Q, { turnstile: null }), 401],
  ] as const)(
    "does not log %s (refused before the visitor check)",
    async (_, request, status) => {
      const { rows, answer } = await run({}, request)
      expect(answer.status).toBe(status)
      expect(rows).toEqual([])
    }
  )

  it("does not log a failed Turnstile check or the per-minute limit", async () => {
    expect((await run({ turnstile: "failed" })).rows).toEqual([])
    expect((await run({ limited: true })).rows).toEqual([])
  })

  it("writes nothing and answers the same without the binding", async () => {
    const without = deps()
    const a = await readAnswer(await handleRequest(ask(Q), without.deps))
    await settle(without.calls)
    const { answer: b, rows } = await run()
    expect(rows).toHaveLength(1)
    expect(a).toEqual(b)
    // The handler started no extra background work without a log.
    expect(without.calls.background).toHaveLength(2)
  })

  it('writes nothing when ASK_LOG_RETENTION_DAYS is "0"', async () => {
    const config = readConfig({ ...VARS, ASK_LOG_RETENTION_DAYS: "0" })
    expect(config.logRetentionDays).toBe(0)
    const { rows, db, answer } = await run({ config })
    expect(answer.outcome).toBe("answer")
    expect(rows).toEqual([])
    expect(db.statements).toEqual([])
  })

  it("reads the retention with a default of 90 and a ceiling of 365", () => {
    expect(readConfig(VARS).logRetentionDays).toBe(90)
    expect(
      readConfig({ ...VARS, ASK_LOG_RETENTION_DAYS: "30" }).logRetentionDays
    ).toBe(30)
    expect(
      readConfig({ ...VARS, ASK_LOG_RETENTION_DAYS: "9999" }).logRetentionDays
    ).toBe(365)
    expect(
      readConfig({ ...VARS, ASK_LOG_RETENTION_DAYS: "-4" }).logRetentionDays
    ).toBe(0)
  })
})

describe("the question log: a failing database changes nothing", () => {
  it("answers exactly the same when every write fails, with one operational line", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    const ok = await run()
    const s = setup()
    s.db.fail = true
    const res = await handleRequest(withCountry(ask(Q), "CH"), s.deps)
    const broken = await readAnswer(res)
    await settle(s.calls)
    expect(broken).toEqual(ok.answer)
    expect(s.db.rows()).toEqual([])
    const lines = errors.mock.calls.map((c) => String(c[0]))
    expect(lines).toEqual([
      JSON.stringify({ message: "ask: question log unavailable" }),
    ])
    expect(lines.join("")).not.toContain("D1_ERROR")
  })

  it("does not wait for a database that never answers", async () => {
    const s = setup()
    s.db.hang = true
    const started = Date.now()
    const a = await readAnswer(await handleRequest(ask(Q), s.deps))
    expect(a.text).toBe(ANSWER_TEXT)
    expect(Date.now() - started).toBeLessThan(500)
  })

  it("does not change a refusal when the write throws at once", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { deps: d, calls } = deps({
      ...admitting({ kind: "daily_limit" } as Admission),
      questions: {
        write: () => {
          throw new Error("binding gone")
        },
      },
    })
    const a = await readAnswer(await handleRequest(ask(Q), d))
    await settle(calls)
    expect(a.status).toBe(429)
    expect(a.body?.outcome).toBe("daily_limit")
  })
})

describe("the daily purge", () => {
  const DAY = 86_400_000

  function seeded(ages: number[]) {
    const db = new SqliteQuestions()
    const log = d1QuestionLog(db)
    return Promise.all(
      ages.map((days) =>
        log.write({
          askedAt: new Date(NOW.getTime() - days * DAY),
          question: `asked ${days} days ago`,
          outcome: "answer",
          replayed: false,
          sources: [],
          durationMs: 1,
          inputTokens: null,
          outputTokens: null,
          model: null,
          country: null,
        })
      )
    ).then(() => db)
  }

  it("deletes only the rows older than the retention", async () => {
    const db = await seeded([0, 1, 89, 89.99, 90.01, 91, 400])
    await purgeQuestions(db, 90, NOW)
    expect(db.rows().map((r) => r.question)).toEqual([
      "asked 0 days ago",
      "asked 1 days ago",
      "asked 89 days ago",
      "asked 89.99 days ago",
    ])
  })

  it("follows a shorter retention", async () => {
    const db = await seeded([0, 6, 8])
    await purgeQuestions(db, 7, NOW)
    expect(db.rows()).toHaveLength(2)
  })

  it("still deletes after the default 90 days when the log is switched off", async () => {
    const db = await seeded([10, 95])
    await purgeQuestions(db, 0, NOW)
    expect(db.rows().map((r) => r.question)).toEqual(["asked 10 days ago"])
  })

  it("does nothing without a binding", async () => {
    await expect(purgeQuestions(undefined, 90, NOW)).resolves.toBeUndefined()
  })

  it("cuts off at an exact ISO time", () => {
    expect(purgeCutoff(NOW, 90)).toBe("2026-08-14T10:00:00.000Z")
  })
})

describe("token counts from the stream", () => {
  it("reads usage from an OpenAI-style or a legacy last chunk", async () => {
    for (const shape of ["openai", "legacy"] as const) {
      const usage: ModelUsage = { inputTokens: null, outputTokens: null }
      const texts: string[] = []
      for await (const t of modelText(
        modelStream(["Hi. "], {
          shape,
          usage: { prompt_tokens: 12, completion_tokens: 3 },
        }),
        usage
      ))
        texts.push(t)
      expect(texts).toEqual(["Hi. "])
      expect(usage).toEqual({ inputTokens: 12, outputTokens: 3 })
    }
  })
})

describe("the deploy config", () => {
  const RAW = {
    name: "mladenruzicic-ask",
    kv_namespaces: [{ binding: "ASK_NOTES" }],
    d1_databases: [
      {
        binding: "ASK_QUESTIONS",
        database_name: "mladenruzicic-ask-questions",
        migrations_dir: "migrations",
      },
    ],
    vars: { ASK_LOG_RETENTION_DAYS: "90" },
  }
  const NOTES = "0123456789abcdef0123456789abcdef"
  const DB = "00000000-0000-4000-8000-000000000000"

  it("fills in both ids and leaves the input alone", () => {
    const r = buildDeployConfig(RAW, {
      notesNamespaceId: NOTES,
      questionsDatabaseId: DB,
    })
    expect(r.ok && r.questionLog).toBe("on")
    if (!r.ok) return
    expect(r.config.kv_namespaces).toEqual([
      { binding: "ASK_NOTES", id: NOTES },
    ])
    expect(r.config.d1_databases).toEqual([
      { ...RAW.d1_databases[0], database_id: DB },
    ])
    expect(RAW.d1_databases[0]).not.toHaveProperty("database_id")
  })

  it("stops a deploy with the log on and no database id", () => {
    const r = buildDeployConfig(RAW, {
      notesNamespaceId: NOTES,
      questionsDatabaseId: null,
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/no database id/)
    expect(r.error).toMatch(/Nothing was deployed/)
  })

  it('deploys without the binding when the log is off ("0") and there is no id', () => {
    const raw = { ...RAW, vars: { ASK_LOG_RETENTION_DAYS: "0" } }
    expect(logRetentionDays(raw)).toBe(0)
    const r = buildDeployConfig(raw, {
      notesNamespaceId: NOTES,
      questionsDatabaseId: null,
    })
    expect(r.ok && r.questionLog).toBe("off")
    if (r.ok) expect(r.config).not.toHaveProperty("d1_databases")
  })

  it("refuses a config that lost a binding", () => {
    expect(
      buildDeployConfig(
        { ...RAW, d1_databases: [] },
        { notesNamespaceId: NOTES, questionsDatabaseId: DB }
      ).ok
    ).toBe(false)
  })
})
