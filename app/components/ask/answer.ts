import { MIN_QUESTION_CHARS } from "@/lib/ask/protocol"

import type { LiveResult, LiveStatus } from "./live"
import type {
  AskAnswer,
  AskClientData,
  AskPrepared,
  AskSource,
  LiveRefusal,
} from "./types"

/**
 * The one place Ask gets its answers (PLAN.md §1 "Ask").
 *
 *   1. A prepared question (a chip, or the same words typed) answers from
 *      `content/ask.ts`, instantly, and never reaches the network.
 *   2. With the live model configured (`liveConfig`), anything else goes to
 *      the Worker through `live.ts`, which is loaded only then, together
 *      with Turnstile. Its answer streams in through `onText`; every way it
 *      can end without one has its own line in `content/ask.ts` `live`.
 *   3. Without it, the question is matched against the prepared ones by
 *      keyword overlap, and then gets the honest fallback with the email.
 *
 * The question is the only thing sent: no history, no identifiers, no
 * cookies. `answer()` always resolves (an abort rejects).
 */

type Prepared = Pick<
  AskClientData,
  "questions" | "fallback" | "live" | "liveConfig"
>

let prepared: Prepared | null = null

/** The island hands over the prepared answers once, when it mounts. */
export function providePrepared(data: Prepared) {
  prepared = data
}

export interface AnswerOptions {
  /** The whole answer so far, each time more of it streams in. */
  onText?: (text: string) => void
  /** What the live path is doing, for the panel's status line. */
  onStatus?: (status: LiveStatus) => void
  /** Where the Turnstile widget may render, inside the dialog. */
  challengeHost?: () => HTMLElement | null
  /** Aborts the live request (the panel closed, a new question). */
  signal?: AbortSignal
}

/** Lower-case words, curly apostrophes straightened, punctuation dropped. */
function tokenize(text: string): string[] {
  return (
    text
      .toLocaleLowerCase()
      .replace(/[‘’ʼ]/g, "'")
      .match(/[\p{L}\p{N}'-]+/gu)
      ?.map((w) => w.replace(/^['-]+|['-]+$/g, ""))
      .filter(Boolean) ?? []
  )
}

/** The prepared question with exactly these words (its chip or its text). */
function exact(question: string, questions: AskPrepared[]): AskPrepared | null {
  const plain = tokenize(question).join(" ")
  return (
    questions.find(
      (q) =>
        tokenize(q.question).join(" ") === plain ||
        tokenize(q.chip).join(" ") === plain
    ) ?? null
  )
}

/**
 * The prepared question a free-text question is about: an exact chip or
 * question text first, then the most keyword hits (ties go to the earlier
 * question). `null` when nothing overlaps.
 */
export function match(
  question: string,
  questions: AskPrepared[]
): AskPrepared | null {
  const hit = exact(question, questions)
  if (hit) return hit

  const words = new Set(tokenize(question))
  let best: AskPrepared | null = null
  let bestScore = 0
  for (const q of questions) {
    let score = 0
    for (const k of q.keywords) if (words.has(k)) score += 1
    if (score > bestScore) {
      best = q
      bestScore = score
    }
  }
  return best
}

function fromPrepared(q: AskPrepared): AskAnswer {
  return {
    id: q.id,
    answer: q.answer,
    source: q.source,
    sourceHref: q.sourceHref,
    card: q.card,
  }
}

/* -------------------------------------------------------------------------- */
/* The live model                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The live endpoint and site key: from the build (`liveConfig`), or, for the
 * end-to-end tests, a same-origin path in `window.__askEndpoint` together
 * with one of Cloudflare's published test site keys in
 * `window.__askTurnstileSiteKey`. Nothing else is taken from the window, so
 * a script there cannot send questions anywhere the content security policy
 * does not already allow, or under a real site key.
 */
function liveConfig(
  data: Prepared
): { endpoint: string; siteKey: string } | null {
  if (data.liveConfig) return data.liveConfig
  const w = window as {
    __askEndpoint?: unknown
    __askTurnstileSiteKey?: unknown
  }
  const endpoint = w.__askEndpoint
  const siteKey = w.__askTurnstileSiteKey
  if (
    typeof endpoint === "string" &&
    /^\/(?![/\\])/.test(endpoint) &&
    typeof siteKey === "string" &&
    /^[123]x0{20}(AA|AB|BB|FF)$/.test(siteKey)
  )
    return { endpoint, siteKey }
  return null
}

/** Too short, or no words at all: the Worker would refuse it anyway. */
function plausible(question: string): boolean {
  return (
    [...question.trim()].length >= MIN_QUESTION_CHARS &&
    (question.match(/\p{L}/gu)?.length ?? 0) >= 2
  )
}

/** "a moment", "a minute", "5 minutes". */
function waitPhrase(seconds: number | undefined, data: Prepared): string {
  const { wait } = data.live
  if (!seconds || seconds < 30) return wait.moment
  if (seconds <= 90) return wait.minute
  return wait.minutes.replace("{n}", String(Math.ceil(seconds / 60)))
}

/** Refusals that point to the email: the visitor cannot fix them by asking again now. */
const EMAIL_CARD: ReadonlySet<LiveRefusal> = new Set([
  "challenge_failed",
  "daily_limit",
  "budget_reached",
  "unavailable",
])

function refused(
  data: Prepared,
  outcome: LiveRefusal,
  retryAfter?: number
): AskAnswer {
  const line = data.live.messages[outcome]
  return {
    id: null,
    answer:
      outcome === "rate_limited"
        ? line.replace("{wait}", waitPhrase(retryAfter, data))
        : line,
    source: "",
    card: EMAIL_CARD.has(outcome) ? data.fallback.card : undefined,
    exhausted: outcome === "daily_limit" ? true : undefined,
  }
}

/** A live result in the panel's shape: its source line and, maybe, a card. */
function fromLive(data: Prepared, result: LiveResult): AskAnswer {
  if (!("text" in result)) {
    if (result.outcome === "unavailable" && result.partial)
      return {
        id: null,
        answer: result.partial.trim(),
        source: "",
        notice: data.live.cutShort,
      }
    return refused(data, result.outcome, result.retryAfter)
  }
  const { text, outcome, sources } = result
  const links: AskSource[] = outcome === "out_of_scope" ? [] : sources
  // A source with a prepared card of its own (the mentoring page, the
  // press kit, a product) brings that card; an unknown answer the email.
  const card =
    outcome === "unknown"
      ? data.fallback.card
      : outcome === "answer"
        ? links
            .map(
              (s) =>
                data.questions.find(
                  (q) =>
                    q.sourceHref === s.href ||
                    (q.card.kind !== "bio" && q.card.href === s.href)
                )?.card
            )
            .find(Boolean)
        : undefined
  return {
    id: null,
    answer: text.trim(),
    source: links.length
      ? [
          data.live.sourcePrefix,
          ...links.map((s) => s.label.toUpperCase()),
        ].join(" · ")
      : data.live.noSource,
    sourceHref: links[0]?.href,
    sources: links,
    card,
  }
}

/* -------------------------------------------------------------------------- */

export async function answer(
  question: string,
  options: AnswerOptions = {}
): Promise<AskAnswer> {
  if (!prepared) throw new Error("Ask: no prepared answers provided")
  const data = prepared

  const chip = exact(question, data.questions)
  if (chip) return fromPrepared(chip)

  const live = liveConfig(data)
  if (live) {
    if (!plausible(question)) return refused(data, "bad_request")
    let result: LiveResult
    try {
      const { askLive } = await import("./live")
      result = await askLive(question, {
        ...live,
        onText: options.onText,
        onStatus: options.onStatus,
        challengeHost: options.challengeHost ?? (() => null),
        signal: options.signal,
      })
    } catch (error) {
      if (options.signal?.aborted) throw error
      result = { outcome: "unavailable" }
    }
    return fromLive(data, result)
  }

  const hit = match(question, data.questions)
  if (hit) return fromPrepared(hit)
  const { fallback } = data
  return {
    id: null,
    answer: fallback.answer,
    source: fallback.source,
    sourceHref: fallback.sourceHref,
    card: fallback.card,
  }
}
