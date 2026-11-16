/**
 * The wire contract between the Ask panel (`app/components/ask`) and the
 * Ask Worker (`workers/ask`). Both import this file, so a new outcome or a
 * renamed header is a type error on both sides at once. Types and constants
 * only: no imports, no runtime dependencies.
 *
 * A request is `POST /ask` with the JSON body `{ "question": "…" }` and
 * exactly one of two headers: `Ask-Session` (a session the Worker issued) or
 * `Ask-Turnstile` (a fresh Turnstile token, for the first question of a
 * visit). Every response that passed the Turnstile check carries a new
 * `Ask-Session` header for the next question.
 *
 * A response is either a server-sent event stream (status 200):
 *
 *   event: delta   data: { "text": "…" }                       the answer, in pieces
 *   event: done    data: { "outcome": "answer", "sources": [] }  how it ended
 *   event: error   data: { "outcome": "unavailable" }          it broke off
 *
 * or one JSON object with an error status: `{ "outcome": …, "retryAfter"?: s }`.
 * The Worker never sends human-readable text outside `delta`: the panel
 * owns every message (`content/ask.ts`).
 */

/** The request header that carries the Worker's session token. */
export const SESSION_HEADER = "Ask-Session"
/** The request header that carries a Turnstile token. */
export const TURNSTILE_HEADER = "Ask-Turnstile"
/** The Turnstile `action` the widget sets and the Worker requires. */
export const TURNSTILE_ACTION = "ask"

/** Bounds the Worker enforces; the panel checks the same before sending. */
export const MIN_QUESTION_CHARS = 3
export const MAX_QUESTION_CHARS = 500
export const MAX_BODY_BYTES = 2048

/** How a streamed answer ended. */
export type AnswerOutcome = "answer" | "unknown" | "out_of_scope"

/** Why there is no answer. */
export type RefusalOutcome =
  /** No session and no Turnstile token, or the session expired. */
  | "challenge_needed"
  /** The Turnstile token did not verify. */
  | "challenge_failed"
  /** Too many questions in a short time; `retryAfter` seconds. */
  | "rate_limited"
  /** This visitor's questions for the UTC day are used up. */
  | "daily_limit"
  /** Ask's questions for the UTC day are used up, for everyone. */
  | "budget_reached"
  /** The model (or a service Ask needs) is slow or down. */
  | "unavailable"
  /** Not a request the panel sends: wrong shape, too short, mostly links. */
  | "bad_request"

export type Outcome = AnswerOutcome | RefusalOutcome

const ANSWER_OUTCOMES: readonly AnswerOutcome[] = [
  "answer",
  "unknown",
  "out_of_scope",
]

const REFUSAL_OUTCOMES: readonly RefusalOutcome[] = [
  "challenge_needed",
  "challenge_failed",
  "rate_limited",
  "daily_limit",
  "budget_reached",
  "unavailable",
  "bad_request",
]

/** A link under an answer, checked by the Worker against the site map. */
export interface WireSource {
  href: string
  label: string
}

/** `event: delta` */
export interface DeltaEvent {
  text: string
}

/** `event: done` */
export interface DoneEvent {
  outcome: AnswerOutcome
  sources: WireSource[]
}

/** `event: error`: the stream started and then broke off. */
export interface ErrorEvent {
  outcome: "unavailable"
}

/** The JSON body of every non-stream response. */
export interface RefusalBody {
  outcome: RefusalOutcome
  /** Seconds until asking again can work, when that is known. */
  retryAfter?: number
}

export function isAnswerOutcome(value: unknown): value is AnswerOutcome {
  return ANSWER_OUTCOMES.includes(value as AnswerOutcome)
}

export function isRefusalOutcome(value: unknown): value is RefusalOutcome {
  return REFUSAL_OUTCOMES.includes(value as RefusalOutcome)
}
