import type { CSSProperties, ReactNode } from "react"

import type { DiagramData, FileType } from "@/lib/content/schema-diagrams"

/** The mono label at the top of the square. */
export function Head({ d }: { d: DiagramData }) {
  return <p className="dg-h">{d.title}</p>
}

/** The point, in Geist 500 (DIAGRAMS.md, "Lead with the point"). */
export function Lead({ d }: { d: DiagramData }) {
  return (
    <>
      <p className="dg-t dg-lead" data-short={d.leadShort ? "" : undefined}>
        {d.lead}
      </p>
      {d.leadShort && (
        <p className="dg-t dg-lead-short" aria-hidden="true">
          {d.leadShort}
        </p>
      )}
    </>
  )
}

/** Visually hidden text, read by assistive technology. */
export function Sr({ children }: { children: ReactNode }) {
  return <span className="dg-sr">{children}</span>
}

/**
 * The walk (DIAGRAMS.md, second and third amendments): every lit part names
 * its keyframes by kind and step, and app/styles/diagram.css runs them only
 * while the diagram is on screen, motion is allowed and the page is not
 * paused.
 *
 * - `n`: a node lights for a moment, then rests.
 * - `h`: a part lights and holds until the cycle ends (an end, a fill).
 * - `x` / `y`: a line draws along its axis, then holds.
 */
export function walk(kind: "n" | "h" | "x" | "y", k: number): CSSProperties {
  return { "--a": `dg${kind}${k}` } as CSSProperties
}

/** A file mark: a sheet with a folded corner and a typed tab. */
export function FileMark({
  tab,
  page = false,
  lines = 3,
  className,
  style,
}: {
  tab?: { label: string; type: FileType }
  page?: boolean
  lines?: number
  className?: string
  style?: CSSProperties
}) {
  const widths = page ? [72, 100, 86, 44] : [100, 84, 70].slice(0, lines)
  return (
    <span className={className ? `dg-fm ${className}` : "dg-fm"} style={style}>
      <span className="dg-fmf" />
      <span className="dg-fml">
        {widths.map((w, i) => (
          <span
            key={i}
            className="dg-ln"
            data-acc={
              page ? (i === 0 ? "t" : i === 3 ? "l" : undefined) : undefined
            }
            style={{ width: `${w}%` }}
          />
        ))}
      </span>
      {tab && (
        <span className="dg-tab" data-t={tab.type}>
          <span>{tab.label}</span>
        </span>
      )}
    </span>
  )
}
