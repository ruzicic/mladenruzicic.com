import "@/app/styles/diagram.css"

import type { DiagramData } from "@/lib/content/schema-diagrams"
import { DIAGRAMS } from "@/content/diagrams"

import { accentVars } from "./accent"
import { BeforeAfter, Count } from "./Figures"
import { Flow } from "./Flow"
import { Loop } from "./Loop"
import { Pipeline } from "./Pipeline"
import { Search } from "./Search"
import { Confluence, Track } from "./Sources"
import { Walk } from "./Walk"

/**
 * Case-study diagrams (docs/v4-build/DIAGRAMS.md): typography and hairlines
 * on the page's paper, live markup, the site's three typefaces, one accent.
 *
 * `<Diagram id accent>` fills the square the page gives it (752px on
 * desktop, the column on phones; the square's hairline and radius are the
 * page's). It lays out from its own width with container queries, never
 * grows taller than the square, and is readable without JavaScript: the
 * only client code is `Walk`, which starts the motion while it is on screen.
 *
 * Words and numbers are in `content/diagrams/*.ts`; the page's caption
 * under the square comes from `diagramText(id).caption`.
 */

export const DIAGRAM_IDS = [
  "studenti-rs/loop",
  "studenti-rs/submission",
  "studenti-rs/pipeline",
  "studenti-rs/search",
  "studenti-rs/classification-count",
  "studenti-rs/classification-before-after",
  "studenti-rs/support",
  "hegias/model-to-headset",
  "tenderlift/sources",
  "tenderlift/notice-to-decision",
] as const
export type DiagramId = (typeof DIAGRAM_IDS)[number]

function get(id: string): DiagramData {
  const d = DIAGRAMS.get(id)
  if (!d)
    throw new Error(
      `Unknown diagram "${id}". Known: ${[...DIAGRAMS.keys()].join(", ")}`
    )
  return d
}

/** The caption under the square and the diagram's full-sentence text alternative. */
export function diagramText(id: string): { caption: string; alt: string } {
  const d = get(id)
  return { caption: d.caption, alt: d.alt }
}

function Body({ d }: { d: DiagramData }) {
  switch (d.form) {
    case "loop":
      return <Loop d={d} />
    case "flow":
      return <Flow d={d} />
    case "pipeline":
      return <Pipeline d={d} />
    case "search":
      return <Search d={d} />
    case "count":
      return <Count d={d} />
    case "before-after":
      return <BeforeAfter d={d} />
    case "confluence":
      return <Confluence d={d} />
    case "track":
      return <Track d={d} />
  }
}

/**
 * A group named by the diagram's title. Its first child is the text
 * alternative (visually hidden); the inner structure (lists, a table, a
 * description list) follows, with every decorative part `aria-hidden`.
 */
export function Diagram({ id, accent }: { id: string; accent?: string }) {
  const d = get(id)
  return (
    <div
      className="dg"
      data-dg={id}
      data-form={d.form}
      role="group"
      aria-label={d.title}
      style={accentVars(accent) as React.CSSProperties}
    >
      <div className="dg-in">
        <p className="dg-sr">{d.alt}</p>
        <Body d={d} />
      </div>
      <Walk />
    </div>
  )
}
