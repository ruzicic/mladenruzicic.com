import { MAX_QUESTION_CHARS } from "../../../lib/ask/protocol"
import { isInvisible } from "./guards"

/**
 * The question log: one row per typed question that got past the visitor
 * check, in the D1 database bound as `ASK_QUESTIONS` (schema:
 * `migrations/0001_questions.sql`). The owner reads it from his terminal
 * (`pnpm run questions`); nothing in the Worker ever reads it back, so a
 * question cannot reach the model or a visitor through the log.
 *
 * A row holds no address, no hash of one, no session id, no user agent and
 * no answer text. The writer below is the only place a row is built, and it
 * takes nothing else.
 *
 * Logging never decides an answer: the handler writes after the outcome is
 * known, through `waitUntil`, and a failed write is one operational line.
 * With no binding, or `ASK_LOG_RETENTION_DAYS` = "0", nothing is written.
 */

/** How a logged question ended. */
export type LogOutcome =
  /** Streamed answers, as the model classed them. */
  | "answer"
  | "unknown"
  /** The model's refusal: off topic, or an attempt to change the rules. */
  | "out_of_scope"
  /** The same question sent again while the first was being answered. */
  | "rate_limited"
  /** This visitor's questions for the UTC day were used up. */
  | "daily_limit"
  /** Everyone's questions for the UTC day were used up. */
  | "budget_reached"
  /** The model or the limits failed, or the answer came back empty. */
  | "error"
  /** The model was too slow to start, or to finish. */
  | "timeout"

export const LOG_OUTCOMES: readonly LogOutcome[] = [
  "answer",
  "unknown",
  "out_of_scope",
  "rate_limited",
  "daily_limit",
  "budget_reached",
  "error",
  "timeout",
]

/** Everything a row holds. There is deliberately no field for a person. */
export interface QuestionRecord {
  /** When the question arrived. */
  askedAt: Date
  question: string
  outcome: LogOutcome
  /** Answered from the ten-minute repeat memo, without the model. */
  replayed: boolean
  /** The links offered under the answer (hrefs only). */
  sources: string[]
  durationMs: number
  /** As the model's stream reported them; `null` when it did not. */
  inputTokens: number | null
  outputTokens: number | null
  /** `null` when the model was not called. */
  model: string | null
  /** `request.cf.country`; `null` when absent or not two letters/digits. */
  country: string | null
}

/** The part of D1 the log uses, so tests can bind a local SQLite. */
export interface LogDatabase {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> }
  }
}

export interface QuestionLog {
  write(record: QuestionRecord): Promise<void>
}

const INSERT =
  "INSERT INTO questions (asked_at, question, outcome, replayed, sources, " +
  "duration_ms, input_tokens, output_tokens, model, country) " +
  "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"

const PURGE = "DELETE FROM questions WHERE asked_at < ?1"

/** Most links a row keeps (the answer offers at most three). */
const MAX_SOURCES = 6
const MAX_SOURCE_CHARS = 300
const MAX_MODEL_CHARS = 120

/** Default retention, in days, and the most the setting may ask for. */
export const DEFAULT_RETENTION_DAYS = 90
export const MAX_RETENTION_DAYS = 365

/**
 * The question as it is stored: invisible and control characters removed,
 * whitespace collapsed, at most `MAX_QUESTION_CHARS` characters. The handler
 * already did all of this (`parseQuestion`); doing it again here keeps the
 * log safe if a caller ever passes something else.
 */
export function cleanLoggedQuestion(question: string): string {
  return [
    ...[...question]
      .map((ch) => (isInvisible(ch.codePointAt(0) ?? 0) ? " " : ch))
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  ]
    .slice(0, MAX_QUESTION_CHARS)
    .join("")
    .trim()
}

function count(n: number | null): number | null {
  return typeof n === "number" && Number.isFinite(n) && n >= 0
    ? Math.round(n)
    : null
}

export function cleanCountry(value: unknown): string | null {
  return typeof value === "string" && /^[A-Z0-9]{2}$/.test(value) ? value : null
}

export function d1QuestionLog(db: LogDatabase): QuestionLog {
  return {
    async write(r) {
      const question = cleanLoggedQuestion(r.question)
      if (!question) return
      const sources = r.sources
        .filter((s) => typeof s === "string")
        .slice(0, MAX_SOURCES)
        .map((s) => s.slice(0, MAX_SOURCE_CHARS))
      await db
        .prepare(INSERT)
        .bind(
          r.askedAt.toISOString(),
          question,
          r.outcome,
          r.replayed ? 1 : 0,
          JSON.stringify(sources),
          Math.max(0, Math.round(r.durationMs)),
          count(r.inputTokens),
          count(r.outputTokens),
          r.model ? r.model.slice(0, MAX_MODEL_CHARS) : null,
          cleanCountry(r.country)
        )
        .run()
    },
  }
}

/** The moment before which rows are deleted. */
export function purgeCutoff(now: Date, retentionDays: number): string {
  return new Date(now.getTime() - retentionDays * 86_400_000).toISOString()
}

/**
 * The daily Cron Trigger: deletes every row older than the retention. With
 * logging switched off (`0`) nothing new is written, and rows already there
 * still go after the default 90 days, so switching the log off never makes
 * old questions live longer. Without a binding there is nothing to do.
 */
export async function purgeQuestions(
  db: LogDatabase | undefined,
  retentionDays: number,
  now: Date
): Promise<void> {
  if (!db) return
  const days = retentionDays > 0 ? retentionDays : DEFAULT_RETENTION_DAYS
  await db.prepare(PURGE).bind(purgeCutoff(now, days)).run()
}
