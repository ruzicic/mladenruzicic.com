import { parseSiteMap, type SourceIndex } from "./sources"

/**
 * Builds the system prompt from the behaviour rules (`system-prompt.md`),
 * the generated context (`content/ask/context.md`) and, when there are any,
 * the owner's notes from KV (`notes.ts`). Pure: `knowledge.ts` feeds it the
 * bundled files, `scripts/measure.ts` the files on disk.
 */

/** Ends the answer text; the JSON with `kind` and `sources` follows it. */
export const MARKER = "<<<META>>>"

export interface Knowledge {
  systemPrompt: string
  sources: SourceIndex
  email: string
  /** Changes whenever the prompt changes; keys the prefix cache. */
  promptId: string
}

/** FNV-1a, enough to tell two prompts apart. */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export function buildKnowledge(context: string, rules: string): Knowledge {
  const sources = parseSiteMap(context)
  const email = sources.email?.href.replace(/^mailto:/, "") ?? ""
  if (!email) throw new Error("context.md has no mailto: link in its site map")
  const name =
    /^# What the site says about (.+)$/m.exec(context)?.[1]?.trim() ?? ""
  if (!name) throw new Error("context.md has no title line")
  const site = sources.siteUrl.replace(/^https?:\/\//, "")
  const filled = rules
    .replaceAll("{{NAME}}", name)
    .replaceAll("{{FIRST}}", name.split(" ")[0])
    .replaceAll("{{SITE}}", site)
    .replaceAll("{{EMAIL}}", email)
    .replaceAll("{{MARKER}}", MARKER)
  // Static first, so every request shares the same cached prefix: the rules,
  // then the context. The question goes in the user message.
  const systemPrompt = `${filled.trim()}\n\n# CONTEXT\n\n${context.trim()}\n`
  return { systemPrompt, sources, email, promptId: hash(systemPrompt) }
}

/**
 * The knowledge with the owner's notes appended to the context. The notes go
 * last, so the rules and the public context stay one cached prefix.
 */
export function withNotes(knowledge: Knowledge, notes: string): Knowledge {
  if (!notes) return knowledge
  const systemPrompt = `${knowledge.systemPrompt}\n## Notes he added for Ask\n\n${notes}\n`
  return { ...knowledge, systemPrompt, promptId: hash(systemPrompt) }
}

/** The user message: the question, fenced and marked as data. */
export function userMessage(question: string): string {
  const fenced = question
    .replace(/<\/?\s*question\s*>/gi, " ")
    .replaceAll(MARKER, " ")
    .trim()
  return `<question>\n${fenced}\n</question>`
}
