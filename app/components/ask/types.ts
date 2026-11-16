import type { RefusalOutcome } from "@/lib/ask/protocol"
import type { Ask, AskCard, ProductMark } from "@/lib/content/schema"

/** Width, height and blur placeholder of a public image (`content/media.ts`). */
export interface AskImageMeta {
  width: number
  height: number
  blurDataURL: string
}

/** One prepared question with its answer, as the client sees it. */
export interface AskPrepared {
  id: string
  chip: string
  question: string
  answer: string
  source: string
  /** The page or section the source line cites. */
  sourceHref?: string
  card: AskCard
  keywords: string[]
}

/**
 * Everything the Ask island needs, assembled on the server by `TopBlock`
 * from `getAsk()`, `getPress()`, `getSite()` and the product marks, so the
 * client never imports the content loaders (or zod).
 */
export interface AskClientData {
  label: string
  closeLabel: string
  ariaOpen: string
  dialogLabel: string
  title: string
  note: string
  suggestionsLabel: string
  inputLabel: string
  placeholder: string
  sendLabel: string
  thinkingVerbs: string[]
  footNote: string
  turnFormat: string
  maxTurns: number
  questions: AskPrepared[]
  /** How many suggestion chips show at once (the first remaining ones). */
  chipsShown: number
  fallback: {
    answer: string
    source: string
    sourceHref?: string
    card: AskCard
  }
  /**
   * The live model, when the site is built with both its endpoint and the
   * Turnstile site key; `null` keeps typed questions on the keyword match.
   */
  liveConfig: { endpoint: string; siteKey: string } | null
  /** Copy for the live model (`content/ask.ts` `live`). */
  live: Omit<Ask["live"], "footNote">
  /** The short bio the bio card shows and copies (`getPress().shortBio`). */
  bio: string
  /** Tiles the cards reference, by product slug. */
  marks: Record<string, ProductMark>
  /** Image sizes the cards reference, by public path. */
  images: Record<string, AskImageMeta>
  /** The name and the line under it, echoed above the glass on desktop. */
  name: string
  line: string
}

/** Every refusal the panel shows a line for; `challenge_needed` it handles. */
export type LiveRefusal = Exclude<RefusalOutcome, "challenge_needed">

/** One link under a live answer, checked by the Worker against the site map. */
export interface AskSource {
  href: string
  label: string
}

/** What `answer()` resolves to. */
export interface AskAnswer {
  /** The prepared question it matched, or `null` for anything else. */
  id: string | null
  answer: string
  source: string
  sourceHref?: string
  /** A live answer's links, first one `sourceHref`; the line links each. */
  sources?: AskSource[]
  /** A live answer has a card only when one of its sources has one. */
  card?: AskCard
  /** A line after the answer, such as "the answer was cut short". */
  notice?: string
}
