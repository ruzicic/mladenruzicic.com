import type { Outcome, WireSource } from "../../../lib/ask/protocol"

/**
 * Reads a `/ask` response into one result: the streamed text, how it ended
 * and its sources, or the refusal. Shared by the tests and the eval script.
 */

export interface ReadAnswer {
  status: number
  text: string
  /** How it ended: `done`'s or `error`'s outcome, or the refusal's. */
  outcome?: Outcome
  sources: WireSource[]
  /** A refusal's `retryAfter`, in seconds. */
  retryAfter?: number
  /** For a JSON (non-stream) response, the whole body. */
  body?: Record<string, unknown>
  events: { event: string; data: Record<string, unknown> }[]
}

export async function readAnswer(response: Response): Promise<ReadAnswer> {
  const out: ReadAnswer = {
    status: response.status,
    text: "",
    sources: [],
    events: [],
  }
  const type = response.headers.get("Content-Type") ?? ""
  if (!type.startsWith("text/event-stream")) {
    const raw = await response.text()
    if (!raw) return out
    out.body = JSON.parse(raw) as Record<string, unknown>
    out.outcome = out.body.outcome as Outcome
    if (typeof out.body.retryAfter === "number")
      out.retryAfter = out.body.retryAfter
    return out
  }
  const raw = await response.text()
  for (const block of raw.split("\n\n")) {
    const event = /^event: (.+)$/m.exec(block)?.[1]
    const data = /^data: (.+)$/m.exec(block)?.[1]
    if (!event || !data) continue
    const parsed = JSON.parse(data) as Record<string, unknown>
    out.events.push({ event, data: parsed })
    if (event === "delta") out.text += String(parsed.text ?? "")
    if (event === "done" || event === "error")
      out.outcome = parsed.outcome as Outcome
    if (event === "done") out.sources = (parsed.sources as WireSource[]) ?? []
  }
  return out
}
