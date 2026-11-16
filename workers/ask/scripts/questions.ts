/**
 * The question log, read from the terminal (README.md "Question log").
 *
 *   pnpm --dir workers/ask run questions                      # the last 50
 *   pnpm --dir workers/ask run questions --limit 200
 *   pnpm --dir workers/ask run questions --since 2026-11-01
 *   pnpm --dir workers/ask run questions --outcome out_of_scope,unknown
 *   pnpm --dir workers/ask run questions --outcome failed     # error, timeout
 *   pnpm --dir workers/ask run questions --all --json > ~/Documents/ask-questions.json
 *   pnpm --dir workers/ask run questions migrate              # apply migrations/
 *   pnpm --dir workers/ask run questions wipe --yes           # delete every row
 *
 * Every command runs `wrangler d1 execute` (or `migrations apply`) against
 * the remote database, through a git-ignored `wrangler.questions.json` that
 * holds the database id from `deploy.local.json`. `--local` uses
 * `wrangler dev`'s local database instead; `--dry-run` prints the Wrangler
 * command and runs nothing.
 *
 * A question is what a stranger typed: it is printed as data, with control,
 * zero-width and bidirectional characters removed and at most 500
 * characters, so it cannot move the cursor, recolour the terminal or
 * reorder the text around it. Never paste a logged question into a model
 * as an instruction.
 */
import { spawnSync } from "node:child_process"
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { experimental_readRawConfig } from "wrangler"

import { cleanLoggedQuestion, LOG_OUTCOMES } from "../src/questions-log"
import {
  QUESTIONS_BINDING,
  requireQuestionsDatabaseId,
  WORKER_DIR,
} from "./local-config"

const args = process.argv.slice(2).filter((a) => a !== "--")
const command = args[0] && !args[0].startsWith("--") ? args[0] : "list"
const dryRun = args.includes("--dry-run")
const local = args.includes("--local")
const json = args.includes("--json")

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function option(name: string): string | undefined {
  const i = args.indexOf(name)
  if (i < 0) return undefined
  const value = args[i + 1]
  if (!value || value.startsWith("--")) fail(`${name} needs a value.`)
  return value
}

/** Outcome groups, for typing less. */
const GROUPS: Record<string, string[]> = {
  refused: ["out_of_scope"],
  limit: ["rate_limited", "daily_limit", "budget_reached"],
  failed: ["error", "timeout"],
}

/** The config Wrangler reads: the database with its id, nothing else. */
function configPath(): string {
  if (local) return join(WORKER_DIR, "wrangler.jsonc")
  const { rawConfig } = experimental_readRawConfig(
    { config: join(WORKER_DIR, "wrangler.jsonc") },
    { useRedirectIfAvailable: false }
  )
  const databases = (rawConfig.d1_databases ?? []) as {
    binding: string
    database_name?: string
    migrations_dir?: string
  }[]
  const db = databases.find((d) => d.binding === QUESTIONS_BINDING)
  if (!db) fail(`wrangler.jsonc has no ${QUESTIONS_BINDING} binding.`)
  const out = join(WORKER_DIR, "wrangler.questions.json")
  const config = {
    name: rawConfig.name,
    d1_databases: [{ ...db, database_id: requireQuestionsDatabaseId() }],
  }
  writeFileSync(out, `${JSON.stringify(config, null, 2)}\n`)
  return out
}

function wrangler(argv: string[], capture: boolean): string {
  const full = [
    ...argv,
    "--config",
    configPath(),
    local ? "--local" : "--remote",
  ]
  const shown = full.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a))
  if (dryRun || !capture) console.error(`wrangler ${shown.join(" ")}`)
  if (dryRun) process.exit(0)
  const run = spawnSync(
    join(WORKER_DIR, "node_modules", ".bin", "wrangler"),
    full,
    {
      cwd: WORKER_DIR,
      stdio: ["inherit", capture ? "pipe" : "inherit", "inherit"],
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  if (run.status !== 0) process.exit(run.status ?? 1)
  return run.stdout ?? ""
}

interface Row {
  asked_at: string
  outcome: string
  replayed: number
  country: string | null
  duration_ms: number
  input_tokens: number | null
  output_tokens: number | null
  model: string | null
  sources: string
  question: string
}

/** Any text from the database, made safe to print. */
function text(value: unknown, max = 500): string {
  return cleanLoggedQuestion(String(value ?? "")).slice(0, max)
}

function parseRows(stdout: string): Row[] {
  const start = stdout.indexOf("[")
  if (start < 0) fail("Wrangler returned no JSON.")
  const out = JSON.parse(stdout.slice(start)) as { results?: Row[] }[]
  return out.flatMap((r) => r.results ?? [])
}

function sourcesOf(raw: string): string[] {
  try {
    const list = JSON.parse(raw) as unknown
    return Array.isArray(list) ? list.map((s) => text(s, 300)) : []
  } catch {
    return []
  }
}

function list() {
  const where: string[] = []
  const since = option("--since")
  if (since !== undefined) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(since) ||
      Number.isNaN(Date.parse(`${since}T00:00:00Z`))
    )
      fail("--since takes a UTC date: YYYY-MM-DD.")
    where.push(`asked_at >= '${since}'`)
  }
  const outcome = option("--outcome")
  if (outcome !== undefined) {
    const wanted = outcome
      .split(",")
      .map((o) => o.trim())
      .flatMap((o) => GROUPS[o] ?? [o])
    const unknown = wanted.filter(
      (o) => !(LOG_OUTCOMES as string[]).includes(o)
    )
    if (unknown.length || !wanted.length)
      fail(
        `--outcome takes ${[...LOG_OUTCOMES, ...Object.keys(GROUPS)].join(", ")}.`
      )
    where.push(`outcome IN (${wanted.map((o) => `'${o}'`).join(", ")})`)
  }
  let limit = ""
  if (!args.includes("--all")) {
    const n = Number(option("--limit") ?? "50")
    if (!Number.isInteger(n) || n < 1 || n > 100_000)
      fail("--limit takes a whole number from 1 to 100000 (or use --all).")
    limit = ` LIMIT ${n}`
  }
  // Only checked values above reach this string: no input is spliced in.
  const sql =
    "SELECT asked_at, outcome, replayed, country, duration_ms, input_tokens, " +
    "output_tokens, model, sources, question FROM questions" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY asked_at DESC${limit}`
  const rows = parseRows(
    wrangler(
      ["d1", "execute", QUESTIONS_BINDING, "--json", "--command", sql],
      true
    )
  )

  if (json) {
    const clean = rows.map((r) => ({
      askedAt: text(r.asked_at, 40),
      outcome: text(r.outcome, 40),
      replayed: r.replayed === 1,
      country: r.country === null ? null : text(r.country, 2),
      durationMs: r.duration_ms,
      inputTokens: r.input_tokens,
      outputTokens: r.output_tokens,
      model: r.model === null ? null : text(r.model, 120),
      sources: sourcesOf(r.sources),
      question: text(r.question),
    }))
    console.log(JSON.stringify(clean, null, 2))
    return
  }
  if (!rows.length) {
    console.log("No questions logged for this filter.")
    return
  }
  // Oldest first, so the newest ends next to the prompt.
  for (const r of [...rows].reverse()) {
    const when = text(r.asked_at, 40).replace("T", " ").slice(0, 16)
    const tokens =
      r.input_tokens !== null || r.output_tokens !== null
        ? `  ${r.input_tokens ?? "?"}→${r.output_tokens ?? "?"} tok`
        : ""
    const sources = sourcesOf(r.sources)
    console.log(
      `${when} UTC  ${text(r.outcome, 40)}${r.replayed === 1 ? " (repeat)" : ""}` +
        `  ${r.country ? text(r.country, 2) : "--"}` +
        `  ${(r.duration_ms / 1000).toFixed(1)} s${tokens}` +
        (sources.length ? `  ${sources.join(" ")}` : "")
    )
    console.log(`  ${text(r.question)}`)
  }
  console.log(
    `\n${rows.length} question${rows.length === 1 ? "" : "s"}, oldest first.`
  )
}

switch (command) {
  case "list":
    list()
    break
  case "migrate":
    wrangler(["d1", "migrations", "apply", QUESTIONS_BINDING], false)
    break
  case "wipe":
    if (!args.includes("--yes"))
      fail(
        `This deletes every logged question${local ? " in the local database" : ""}. ` +
          "Run it again with --yes to go ahead."
      )
    wrangler(
      [
        "d1",
        "execute",
        QUESTIONS_BINDING,
        "--yes",
        "--command",
        "DELETE FROM questions",
      ],
      false
    )
    break
  default:
    fail(
      "Usage: questions.ts [--limit n | --all] [--since YYYY-MM-DD] [--outcome a,b] [--json] [--local],\n" +
        "       questions.ts migrate [--local], or questions.ts wipe --yes [--local]. Add --dry-run to see the Wrangler command."
    )
}
