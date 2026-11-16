/**
 * Bracket placeholders ("[CONFIRM THE BACKEND STACK]", "[YEAR]") are the
 * owner's open questions. They live in docs/v4-build/PLACEHOLDERS.md and
 * must never reach a visitor or a machine. One definition, three users:
 *
 *   · `lib/content/index.ts` fails the build when one is in content;
 *   · `lib/seo/markdown.ts` and `lib/ask/context.ts` drop the sentences that
 *     hold one, as a second line of defence.
 *
 * Pure strings, no filesystem: safe anywhere.
 */

/**
 * A `[` followed by a capital letter, unless it opens a markdown link
 * (`[text](url)`, `[text][ref]`) or a reference definition (`[Ref]: url`).
 */
const PLACEHOLDER = /\[[A-Z](?![^\]\n]*\](?:\(|\[|:))/

/** Every placeholder opening in a text, with a few words after it. */
export function placeholderMatches(text: string): string[] {
  const re = new RegExp(PLACEHOLDER.source + "[^\\]\\n]{0,60}", "g")
  return [...text.matchAll(re)].map((m) => m[0])
}

function hasPlaceholder(text: string): boolean {
  return PLACEHOLDER.test(text)
}

/** Sentences of a paragraph; a sentence starts at a capital, digit, quote. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[\p{Lu}\p{N}["“‘(])/u)
}

/** The text without the sentences that hold a placeholder. */
export function dropPlaceholderSentences(text: string): {
  kept: string
  dropped: string[]
} {
  const kept: string[] = []
  const dropped: string[] = []
  for (const sentence of sentences(text.trim())) {
    if (hasPlaceholder(sentence)) dropped.push(sentence.trim())
    else if (sentence.trim()) kept.push(sentence.trim())
  }
  return { kept: kept.join(" "), dropped }
}

/**
 * Markdown with the placeholder sentences removed line by line, so headings,
 * lists and blank lines keep their shape. A line left with nothing goes.
 */
export function dropPlaceholderLines(markdown: string): string {
  if (!hasPlaceholder(markdown)) return markdown
  return markdown
    .split("\n")
    .flatMap((line) => {
      if (!hasPlaceholder(line)) return [line]
      const { kept } = dropPlaceholderSentences(line)
      return kept ? [kept] : []
    })
    .join("\n")
}

/** Every string in a value that holds a placeholder, with its path. */
export function findPlaceholders(
  value: unknown,
  path = ""
): { path: string; text: string }[] {
  if (typeof value === "string")
    return hasPlaceholder(value) ? [{ path, text: value }] : []
  if (Array.isArray(value))
    return value.flatMap((v, i) => findPlaceholders(v, `${path}[${i}]`))
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) =>
      findPlaceholders(v, path ? `${path}.${k}` : k)
    )
  return []
}
