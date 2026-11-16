import type { DiagramOf } from "@/lib/content/schema-diagrams"

import { Head, Lead } from "./parts"

/** Rows of the drawn document: `k` ink text, `g` greyed, `b` an accent hit, `u` underlined meaning. */
type Bit = readonly ["k" | "g" | "b", number]
const TITLE: Bit[][] = [
  [
    ["k", 16],
    ["b", 40],
    ["k", 24],
  ],
  [["k", 90]],
]
const BEFORE_BODY: Bit[][] = [100, 94, 98, 90, 100, 95, 72, 97, 64].map((w) => [
  ["g", w],
])
const NOW_BODY: Bit[][] = [
  [["k", 100]],
  [
    ["k", 30],
    ["b", 28],
    ["k", 36],
  ],
  [["k", 98]],
  [
    ["k", 50],
    ["b", 34],
    ["k", 6],
  ],
  [["k", 100]],
  [["k", 95]],
  [["k", 72]],
  [["k", 97]],
  [
    ["k", 6],
    ["b", 22],
    ["k", 36],
  ],
]
/** Diagonal hairlines for the part of the file search never read. */
const HATCH = Array.from({ length: 54 }, (_, i) => i * 6)
/** The row (in NOW_BODY) whose words mean the same thing in other words. */
const MEANING_ROW = 6

function Doc({ body, meaning }: { body: Bit[][]; meaning?: number }) {
  return (
    <span className="se-doc">
      <span className="se-fold" />
      <span className="se-rows">
        {[...TITLE, ...body].map((row, r) => (
          <span key={r} className="se-r" data-gap={r === 1 ? "" : undefined}>
            {row.map(([kind, w], i) => (
              <span
                key={i}
                className={kind === "b" ? "se-b" : "se-k"}
                data-g={kind === "g" ? "" : undefined}
                style={{ width: `${w}%` }}
              />
            ))}
            {meaning !== undefined && r === TITLE.length + meaning && (
              <span className="se-u" style={{ width: "72%" }} />
            )}
          </span>
        ))}
      </span>
    </span>
  )
}

function Query({ text, lang }: { text: string; lang: string }) {
  return (
    <span className="se-q">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="3.75" />
        <path d="M7.9 7.9L10.75 10.75" />
      </svg>
      <span lang={lang}>{text}</span>
    </span>
  )
}

/**
 * Search, before and now: the same query against the same document. Before,
 * only the top of the file was searched; now the whole file is, and a
 * passage that says the same thing in other words is found too. The two
 * notes are the content; the drawings are decorative. The pair of figures
 * (see content/diagrams/studenti-rs.ts) renders only when the data has it,
 * its label only when there is one.
 */
export function Search({ d }: { d: DiagramOf<"search"> }) {
  return (
    <div className="dg-body se-w">
      <Head d={d} />
      <Lead d={d} />
      <div className="se">
        <div className="se-col">
          <p className="dg-l">{d.before.label}</p>
          <span className="se-draw" aria-hidden="true">
            <Query {...d.query} />
            <span className="se-v" data-k="before">
              <Doc body={BEFORE_BODY} />
              <svg
                className="se-hatch"
                viewBox="0 0 160 160"
                preserveAspectRatio="xMinYMin slice"
              >
                {HATCH.map((o) => (
                  <line key={o} x1={o} y1="0" x2={o - 160} y2="160" />
                ))}
              </svg>
              <span className="se-o" data-k="top">
                <span className="dg-l se-lg">{d.before.searched}</span>
              </span>
              <span className="se-brk" />
              <span className="dg-l se-nr">{d.before.unsearched}</span>
            </span>
          </span>
          <p className="dg-n se-note">{d.before.note}</p>
        </div>
        <div className="se-col" data-second="">
          <p className="dg-l">{d.now.label}</p>
          <span className="se-draw" aria-hidden="true">
            <Query {...d.query} />
            <span className="se-v" data-k="now">
              <span className="se-o" data-k="all">
                <span className="dg-l se-lg">{d.now.searched}</span>
              </span>
              <Doc body={NOW_BODY} meaning={MEANING_ROW} />
              <span className="se-c" />
              <span className="se-cl" />
              <span className="dg-l se-ml">{d.now.match}</span>
            </span>
          </span>
          <p className="dg-n se-note">{d.now.note}</p>
        </div>
      </div>
      {d.figures && (
        <div className="se-fig">
          <div className="dg-ba">
            <p className="dg-bac">
              <span className="dg-f">{d.figures.before.figure}</span>
              <span className="dg-n">{d.figures.before.note}</span>
            </p>
            <p className="dg-bac" data-second="">
              <span className="dg-f dg-acc-text">{d.figures.now.figure}</span>
              <span className="dg-n">{d.figures.now.note}</span>
            </p>
          </div>
          {d.figures.label ? <p className="dg-l">{d.figures.label}</p> : null}
        </div>
      )}
    </div>
  )
}
