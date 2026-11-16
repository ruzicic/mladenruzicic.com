/* -------------------------------------------------------------------------- */
/* Reading the model                                                          */
/* -------------------------------------------------------------------------- */

/** Token counts, when the stream reports them (for the question log). */
export interface ModelUsage {
  inputTokens: number | null
  outputTokens: number | null
}

/**
 * The text deltas of a Workers AI streaming response (server-sent events).
 * Handles both shapes the platform uses: OpenAI-style chunks
 * (`choices[0].delta.content`) and the older `{ "response": "…" }`. Reasoning
 * deltas (`reasoning_content`, `reasoning`) are skipped: they are never
 * shown to a visitor. A chunk's `usage` (`prompt_tokens`,
 * `completion_tokens`), if the stream sends one, is copied into `usage`.
 */
export async function* modelText(
  stream: ReadableStream<Uint8Array>,
  usage?: ModelUsage
): AsyncGenerator<string, void, undefined> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline: number
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        const text = deltaOf(line, usage)
        if (text === null) return
        if (text) yield text
      }
    }
    const rest = deltaOf(buffer.trim(), usage)
    if (rest) yield rest
  } finally {
    reader.releaseLock()
    await stream.cancel().catch(() => {})
  }
}

/** One SSE line's text: `""` for nothing, `null` for the end. */
function deltaOf(line: string, usage?: ModelUsage): string | null {
  if (!line.startsWith("data:")) return ""
  const payload = line.slice(5).trim()
  if (payload === "[DONE]") return null
  try {
    const chunk = JSON.parse(payload) as {
      response?: unknown
      choices?: { delta?: { content?: unknown } }[]
      usage?: { prompt_tokens?: unknown; completion_tokens?: unknown } | null
    }
    if (usage && chunk.usage && typeof chunk.usage === "object") {
      const { prompt_tokens: input, completion_tokens: output } = chunk.usage
      if (typeof input === "number") usage.inputTokens = input
      if (typeof output === "number") usage.outputTokens = output
    }
    const content = chunk.choices?.[0]?.delta?.content ?? chunk.response
    return typeof content === "string" ? content : ""
  } catch {
    return ""
  }
}

/* -------------------------------------------------------------------------- */
/* Cleaning the answer while it streams                                       */
/* -------------------------------------------------------------------------- */

const MARKER_RE = /<<<\s*META\s*>>>/i
const URL_RE = /(?:https?:\/\/|www\.)[^\s)\]>"']+/gi
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const PATH_RE = /^\/[\w\-./#?=&%]+$|^\/$/
const MD_LINK_TAIL = /\]\(([^)\s]*)\)/g

/**
 * Turns the model's raw text into what a visitor may see, word by word:
 *
 *   · the `<<<META>>>` line (`MARKER` in prompt.ts) and everything after
 *     it is held back and parsed;
 *   · links, URLs and paths are removed from the text (the interface shows
 *     validated sources instead) and remembered as candidate sources;
 *   · email addresses other than the site's are removed;
 *   · markdown emphasis, headings and table pipes are stripped;
 *   · angle brackets are dropped, so no markup survives even in a client
 *     that forgot to render text as text;
 *   · the long dash becomes a comma.
 *
 * A word is released only once the whitespace after it has arrived, so a
 * half-received marker or link is never shown.
 */
export class AnswerFilter {
  private pending = ""
  private space = ""
  private meta: string | null = null
  private started = false
  private emitted = ""
  readonly mentioned: string[] = []

  constructor(private readonly email: string) {}

  /** Text so far, as the visitor sees it. */
  get text(): string {
    return this.emitted
  }

  push(chunk: string): string {
    if (this.meta !== null) {
      this.meta += chunk
      return ""
    }
    this.pending += chunk
    const m = MARKER_RE.exec(this.pending)
    if (m) {
      const before = this.pending.slice(0, m.index)
      this.meta = this.pending.slice(m.index + m[0].length)
      this.pending = ""
      return this.release(before, true)
    }
    const cut = Math.max(
      this.pending.lastIndexOf(" "),
      this.pending.lastIndexOf("\n")
    )
    if (cut < 0) return ""
    const ready = this.pending.slice(0, cut + 1)
    this.pending = this.pending.slice(cut + 1)
    return this.release(ready, false)
  }

  /** Flush what is left; returns the last text and the parsed final line. */
  end(): { text: string; meta: { kind?: unknown; sources?: unknown } | null } {
    const text = this.meta === null ? this.release(this.pending, true) : ""
    this.pending = ""
    return { text, meta: parseMeta(this.meta) }
  }

  private release(text: string, final: boolean): string {
    let out = ""
    const parts = text.split(/(\s+)/)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      if (/^\s+$/.test(part)) {
        // Collapse runs of spaces; keep line breaks (lists), at most two.
        if (this.started)
          this.space = part.includes("\n\n")
            ? "\n\n"
            : part.includes("\n")
              ? "\n"
              : " "
        continue
      }
      const word = this.clean(part)
      if (!word.text) continue
      out += (word.glue ? "" : this.space) + word.text
      this.space = ""
      this.started = true
    }
    if (final) this.space = ""
    this.emitted += out
    return out
  }

  private clean(raw: string): { text: string; glue: boolean } {
    let w = raw
    if (/^[—–]$/.test(w)) return { text: ",", glue: true }
    w = w.replace(/\s*—\s*/g, ", ")
    // Markdown: emphasis, inline code, headings, table rules and pipes.
    w = w.replace(/\*\*|__|`|[<>]/g, "")
    if (/^#{1,6}$/.test(w) || /^\|+$/.test(w) || /^:?-{3,}:?$/.test(w))
      return { text: "", glue: false }
    w = w.replace(/\|/g, "")
    // Links: keep the label, remember the target.
    w = w.replace(MD_LINK_TAIL, (_, href: string) => {
      if (href) this.mentioned.push(href)
      return ""
    })
    w = w.replace(/[[\]]/g, "")
    w = w.replace(URL_RE, (url) => {
      this.mentioned.push(url.replace(/[.,;:!?]+$/, ""))
      return ""
    })
    w = w.replace(EMAIL_RE, (mail) =>
      mail.toLowerCase() === this.email.toLowerCase() ? mail : ""
    )
    // A bare path such as "/work/tenderlift" or "(/about).".
    const core = w.replace(/^[("']+/, "").replace(/[)"'.,;:!?]+$/, "")
    if (core.length > 1 && PATH_RE.test(core)) {
      this.mentioned.push(core)
      w = w.replace(core, "")
    }
    w = w.replace(/\(\s*\)/g, "")
    if (!w) return { text: "", glue: false }
    // Only punctuation left (the link was the rest): glue it to the last word.
    if (/^[)\].,;:!?]+$/.test(w))
      return { text: w.replace(/[)\]]/g, ""), glue: true }
    return { text: w, glue: false }
  }
}

function parseMeta(
  raw: string | null
): { kind?: unknown; sources?: unknown } | null {
  if (raw === null) return null
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start < 0 || end <= start) return null
  try {
    const value = JSON.parse(raw.slice(start, end + 1)) as unknown
    return value && typeof value === "object"
      ? (value as { kind?: unknown; sources?: unknown })
      : null
  } catch {
    return null
  }
}

/* -------------------------------------------------------------------------- */
/* Writing to the visitor                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One server-sent event. `JSON.stringify` escapes every line break, so the
 * data is always exactly one `data:` line and cannot start a new event.
 */
export function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}
