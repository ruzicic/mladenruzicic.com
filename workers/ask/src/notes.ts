import { MARKER } from "./prompt"

/**
 * The optional second document: notes the owner keeps out of the public
 * repository, read at run time from one Workers KV key (`NOTES_KEY` in the
 * `ASK_NOTES` namespace). It is uploaded with `pnpm notes:upload <file>`
 * (README.md "Notes kept off GitHub").
 *
 * Off GitHub is not secret: the model reads these notes, so a determined
 * visitor can draw them out. They hold only what the owner is happy for Ask
 * to say.
 *
 * The document is the owner's, but it still crosses a boundary into the
 * prompt, so it is cleaned the way the context is: capped in size, control
 * characters and comments removed, the answer marker and the question fence
 * taken out, and headings pushed below the prompt's own sections. A missing
 * key, a failed read or a document over the cap all mean "no notes", never
 * an error for the visitor.
 */

export const NOTES_KEY = "ask-notes"
/** Larger documents are ignored, not cut (a cut could end mid-fact). */
export const MAX_NOTES_BYTES = 32 * 1024
/** How long an isolate keeps what it read. */
export const NOTES_CACHE_MS = 5 * 60_000

/** KV's own edge cache, in seconds (minimum 30). */
const KV_CACHE_TTL = 300

export function cleanNotes(raw: string): string {
  if (new TextEncoder().encode(raw).byteLength > MAX_NOTES_BYTES) return ""
  return (
    raw
      .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "")
      .replace(/[\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, "")
      .replaceAll(MARKER, "")
      .replace(/<\/?\s*(question|notes)\s*>/gi, "")
      .replace(/^#{1,6}\s+/gm, "### ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  )
}

export interface NotesSource {
  get(
    key: string,
    options: { type: "text"; cacheTtl: number }
  ): Promise<string | null>
}

let cached: { at: number; text: string } | null = null

/** The cleaned notes, or `""`. Never throws. */
export async function loadNotes(
  kv: NotesSource | undefined,
  now: number
): Promise<string> {
  if (!kv) return ""
  if (cached && now - cached.at < NOTES_CACHE_MS) return cached.text
  let text = ""
  try {
    const raw = await kv.get(NOTES_KEY, {
      type: "text",
      cacheTtl: KV_CACHE_TTL,
    })
    text = raw ? cleanNotes(raw) : ""
    if (raw && !text)
      console.error(JSON.stringify({ message: "ask: notes ignored" }))
  } catch {
    console.error(JSON.stringify({ message: "ask: notes unreadable" }))
  }
  cached = { at: now, text }
  return text
}

/** For tests: forget what was read. */
export function resetNotesCache() {
  cached = null
}
