import type { ReactNode } from "react"

import type { RichSegment, RichText } from "@/lib/content/schema"

/** Punctuation that must stay on the line of the chip it follows. */
const LEAD = /^[,.;:!?)\]}”’»…]+/

/**
 * `text.map(render)` for rich text, with one rule: punctuation that directly
 * follows a product chip is moved into a `white-space: nowrap` wrapper with
 * the chip, so a line never starts with ", " or ".". The wrapper moves to the
 * next line as a whole when it does not fit. The text content is unchanged
 * (the same characters in the same order), so screen readers and copy and
 * paste read the same sentence.
 */
export function mapRich(
  text: RichText,
  render: (seg: RichSegment, i: number) => ReactNode
): ReactNode[] {
  return text.map((seg, i) => {
    if (seg.kind === "text") {
      const prev = text[i - 1]
      const lead = prev?.kind === "product" ? LEAD.exec(seg.text) : null
      return lead ? seg.text.slice(lead[0].length) : render(seg, i)
    }
    const next = text[i + 1]
    const lead =
      seg.kind === "product" && next?.kind === "text"
        ? LEAD.exec(next.text)
        : null
    const node = render(seg, i)
    return lead ? (
      <span key={i} className="whitespace-nowrap">
        {node}
        {lead[0]}
      </span>
    ) : (
      node
    )
  })
}
