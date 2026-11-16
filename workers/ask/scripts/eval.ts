/**
 * Runs the evaluation set (`eval/cases.ts`) against a running Worker and
 * prints which answers break which rule.
 *
 *   pnpm --dir workers/ask dev        # in one terminal (see README: it uses
 *                                     # the Cloudflare account and costs money)
 *   pnpm --dir workers/ask eval       # in another
 *
 * Options: --url http://localhost:8787/ask   --origin http://localhost:3200
 *          --only id,id                      --delay 11000 (ms between calls)
 *          --abuse-only                      (no model calls at all)
 *
 * The abuse cases run first; none of them may reach the model. Then every
 * question is asked in one session started with Cloudflare's published
 * dummy Turnstile token, which only `.dev.vars`' test secret accepts. The
 * delay keeps the run under the per-minute limit (6), which `wrangler dev`
 * enforces locally too. Nothing is written anywhere.
 */
import { SESSION_HEADER, TURNSTILE_HEADER } from "../../../lib/ask/protocol"
import { ABUSE_CASES, CASES, check } from "../eval/cases"
import { readAnswer } from "../eval/read-answer"

/** developers.cloudflare.com/turnstile/troubleshooting/testing/ */
const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX"

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}

const url = arg("url", "http://localhost:8787/ask")
const origin = arg("origin", "http://localhost:3200")
const delay = Number(arg("delay", "11000"))
const only = arg("only", "").split(",").filter(Boolean)
const abuseOnly = process.argv.includes("--abuse-only")
const cases = abuseOnly
  ? []
  : only.length
    ? CASES.filter((c) => only.includes(c.id))
    : CASES

let failed = 0

for (const c of ABUSE_CASES) {
  const r = c.request
  const headers: Record<string, string> = {
    "Content-Type": r.type ?? "application/json",
  }
  if (r.accept !== null) headers.Accept = r.accept ?? "text/event-stream"
  if (r.origin !== null) headers.Origin = r.origin ?? origin
  if (r.session) headers[SESSION_HEADER] = r.session
  if (r.turnstile !== null)
    headers[TURNSTILE_HEADER] = r.turnstile ?? DUMMY_TOKEN
  const method = r.method ?? "POST"
  const res = await fetch(url, {
    method,
    headers,
    body:
      method === "GET" ? undefined : (r.raw ?? JSON.stringify(r.body ?? {})),
  })
  const a = await readAnswer(res)
  const ok = res.status === c.expect.status && a.outcome === c.expect.outcome
  if (!ok) failed++
  console.log(
    `${ok ? "pass" : "FAIL"}  abuse        ${c.id}: ${res.status} ${a.outcome ?? ""}`
  )
}

let session = ""
for (const [i, c] of cases.entries()) {
  await new Promise((r) => setTimeout(r, i === 0 ? 0 : delay))
  const started = Date.now()
  let fails: string[]
  let text = ""
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Origin: origin,
        ...(session
          ? { [SESSION_HEADER]: session }
          : { [TURNSTILE_HEADER]: DUMMY_TOKEN }),
      },
      body: JSON.stringify({ question: c.question }),
    })
    session = res.headers.get(SESSION_HEADER) ?? session
    const a = await readAnswer(res)
    text = a.text
    fails =
      a.status === 200 ? check(c, a) : [`HTTP ${a.status} ${a.outcome ?? ""}`]
    text += a.sources.length
      ? `\n      sources: ${a.sources.map((s) => s.href).join(", ")}`
      : ""
  } catch (error) {
    fails = [
      `request failed: ${error instanceof Error ? error.message : String(error)}`,
    ]
  }
  const ms = Date.now() - started
  if (fails.length) failed++
  console.log(
    `${fails.length ? "FAIL" : "pass"}  ${c.category.padEnd(12)} ${c.id} (${ms} ms)`
  )
  console.log(`      Q: ${c.question}`)
  console.log(`      A: ${text.replace(/\n(?! {6})/g, "\n         ")}`)
  for (const f of fails) console.log(`      ! ${f}`)
}

const total = ABUSE_CASES.length + cases.length
console.log(`\n${total - failed} of ${total} passed.`)
process.exit(failed ? 1 : 0)
