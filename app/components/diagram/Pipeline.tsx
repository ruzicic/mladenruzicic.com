import type { CSSProperties } from "react"

import type { ChainItem, DiagramOf } from "@/lib/content/schema-diagrams"

import { Ledger } from "./Ledger"
import { FileMark, Head, Lead, walk } from "./parts"

/**
 * The Pipeline (DIAGRAMS.md, "Pipeline" and the file-mark amendment): one
 * thing changing form, left to right, with at most one branch; the ledger
 * under it says what each stage does. The drawing is decorative (its words
 * are in the ledger and the text alternative); the ledger is a list. At the
 * phone size the marks shrink, the verbs and stack label drop, and the
 * ledger carries the meaning.
 */
export function Pipeline({ d }: { d: DiagramOf<"pipeline"> }) {
  // Walk order: marks and arrows alternate, the branch lights after its mark.
  const steps = d.chain.map((item, i) => ({ item, k: i * 2 }))
  // A longer chain overlaps its stack tighter, so every stage keeps its arrow.
  const long = d.chain.length > 7
  const style = {
    "--ov": long ? "34px" : "22px",
    "--ov-n": long ? "24px" : "12px",
  } as CSSProperties
  return (
    <div className="dg-body pp" style={style} data-long={long ? "" : undefined}>
      <Head d={d} />
      {d.showLead && <Lead d={d} />}
      <div className="pp-row" aria-hidden="true">
        {steps.map(({ item, k }, i) => (
          <ChainPart
            key={i}
            item={item}
            k={k}
            branch={d.branch?.at === i ? d.branch : undefined}
          />
        ))}
      </div>
      <Ledger rows={d.ledger} />
    </div>
  )
}

function ChainPart({
  item,
  k,
  branch,
}: {
  item: ChainItem
  k: number
  branch?: DiagramOf<"pipeline">["branch"]
}) {
  if (item.kind === "arrow") {
    return (
      <span className="pp-ar">
        <span className="dg-l pp-verb">{item.verb}</span>
        <span className="pp-arl">
          <span className="pp-af" style={walk("x", k)} />
        </span>
      </span>
    )
  }
  const lit = <span className="pp-lit" style={walk("n", k)} />
  const br = branch && <Branch branch={branch} k={k + 1} />
  switch (item.kind) {
    case "stack": {
      const n = item.tabs.length
      return (
        <span className="pp-c" data-k="stack" data-n={n}>
          <span className="pp-stk">
            {item.back && (
              <FileMark
                className="pp-back"
                style={{ "--lift": n } as CSSProperties}
              />
            )}
            {item.tabs.map((tab, i) => (
              <FileMark
                key={i}
                tab={tab}
                style={{ "--lift": n - 1 - i } as CSSProperties}
              />
            ))}
            {lit}
          </span>
          <span className="dg-l pp-lb">{item.label}</span>
          {br}
        </span>
      )
    }
    case "file":
      return (
        <span className="pp-c">
          <span className="pp-mk">
            <FileMark tab={item.tab} page={item.page} />
            {lit}
          </span>
          {br}
        </span>
      )
    case "cell":
      return (
        <span className="pp-c" data-k="cell">
          <span className="pp-box">
            <span className="pp-cell" />
            {lit}
          </span>
          <span className="dg-l pp-lb pp-ink">{item.label}</span>
          {item.sub && <span className="dg-l pp-lb">{item.sub}</span>}
          {br}
        </span>
      )
    case "window":
      return (
        <span className="pp-c" data-k="win">
          <span className="pp-box">
            <span className="pp-bw">
              <span className="pp-bwb">
                <span>{item.label}</span>
              </span>
              <span className="pp-bwl">
                <span className="dg-ln" style={{ width: "100%" }} />
                <span className="dg-ln" style={{ width: "76%" }} />
                <span className="dg-ln" style={{ width: "88%" }} />
              </span>
              {lit}
            </span>
          </span>
          {br}
        </span>
      )
    case "headset":
      return (
        <span className="pp-c" data-k="hs">
          <span className="pp-box">
            <span className="pp-hs">
              <span />
              <span />
              {lit}
            </span>
          </span>
          <span className="dg-l pp-lb">{item.label}</span>
          {br}
        </span>
      )
  }
}

function Branch({
  branch,
  k,
}: {
  branch: NonNullable<DiagramOf<"pipeline">["branch"]>
  k: number
}) {
  return (
    <span className="pp-br" data-kind={branch.kind}>
      <span className="pp-bdn">
        <span className="pp-bdf" style={walk("y", k)} />
        {branch.verb && <span className="dg-l pp-bverb">{branch.verb}</span>}
      </span>
      {branch.kind === "index" ? (
        <span className="pp-bcl">
          <span className="pp-lit" style={walk("n", k + 1)} />
        </span>
      ) : (
        <svg className="pp-tog" viewBox="0 0 40 22" fill="none">
          <path d="M10 16L20 6L30 16Z" />
          <circle cx="10" cy="16" r="4.5" />
          <circle cx="20" cy="6" r="4.5" />
          <circle cx="30" cy="16" r="4.5" />
        </svg>
      )}
      <span className="dg-l pp-blb">{branch.label}</span>
    </span>
  )
}
