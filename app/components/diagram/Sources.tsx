import { Fragment, type CSSProperties } from "react"

import type { DiagramOf } from "@/lib/content/schema-diagrams"

import { Ledger } from "./Ledger"
import { FileMark, Head, Lead, walk } from "./parts"

/** The tender card both TenderLift diagrams end in: two title lines, a deadline, the grade. */
function Card({ deadline, badge }: { deadline: string; badge: string }) {
  return (
    <span className="tc-card">
      <span className="tc-ct" />
      <span className="tc-ct" style={{ width: "58%" }} />
      <span className="tc-dl">{deadline}</span>
      <span className="tc-b">{badge}</span>
    </span>
  )
}

/**
 * Many sources, one feed: a confluence. Each source row runs a line right
 * and the lines merge into one heavier accent line that ends in one tender
 * card. The sources are a list; the lines and the card are decorative.
 * At the phone size the examples drop.
 */
export function Confluence({ d }: { d: DiagramOf<"confluence"> }) {
  // The fan-in: rows nearest the middle join first.
  const n = d.sources.length
  const mid = (n - 1) / 2
  return (
    <div className="dg-body cf-w">
      <Head d={d} />
      <Lead d={d} />
      <div className="cf" style={{ "--rows": n } as CSSProperties}>
        <ul className="cf-rows">
          {d.sources.map((s, i) => (
            <li key={s.label} className="cf-r" data-role={s.role}>
              <span className="cf-lb">
                {s.label}
                {s.role === "read" && (
                  <span className="dg-sr">, {d.readNote.toLowerCase()}</span>
                )}
              </span>
              {s.example && <span className="cf-ex">{s.example}</span>}
              {s.tabs && (
                <span className="cf-stk" aria-hidden="true">
                  {s.tabs.map((t, j) => (
                    <FileMark key={j} tab={t} lines={0} className="cf-fm" />
                  ))}
                </span>
              )}
              <span
                className="cf-ln"
                aria-hidden="true"
                data-role={s.role}
                style={
                  {
                    "--i": i,
                    "--j": Math.round(Math.abs(i - mid) - 0.5),
                    "--down": i < mid ? 1 : 0,
                  } as CSSProperties
                }
              >
                <span className="cf-h">
                  <span className="cf-lit" style={walk("h", i)} />
                </span>
                <span className="cf-v">
                  <span className="cf-lit" style={walk("h", i)} />
                </span>
              </span>
            </li>
          ))}
        </ul>
        <span className="cf-m" aria-hidden="true" />
        <span className="cf-note dg-l" aria-hidden="true">
          {d.readNote}
        </span>
        <span className="cf-cardw" aria-hidden="true">
          <Card {...d.card} />
        </span>
        <p className="dg-l cf-ml">
          {d.feed.map((f, i) => (
            <Fragment key={f}>
              {i > 0 && " \u00b7 "}
              <span className="cf-mi">{f}</span>
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  )
}

const CHECK = (
  <svg
    aria-hidden="true"
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="square"
  >
    <path d="M1.5 5.5L4 8L8.5 2" />
  </svg>
)

/**
 * The Track: stations on one line, the tender card hanging from the station
 * that grades it, three plain reasons beside the card, and the ledger under
 * it. At the phone size the station names drop and the ledger carries them.
 */
export function Track({ d }: { d: DiagramOf<"track"> }) {
  const n = d.stations.length
  return (
    <div className="dg-body tk-w">
      <Head d={d} />
      <Lead d={d} />
      <div
        className="tk"
        style={{ "--n": n, "--at": d.cardAt } as CSSProperties}
      >
        <span className="tk-line" aria-hidden="true">
          {d.stations.slice(1).map((_, i) => (
            <span
              key={i}
              className="tk-f"
              style={{ ...walk("x", i * 2 + 1), "--i": i } as CSSProperties}
            />
          ))}
        </span>
        <ol className="tk-st" aria-hidden="true">
          {d.stations.map((s, i) => (
            <li key={s.name} className="tk-s">
              <span className="dg-l tk-no">{i + 1}</span>
              <span className="tk-bx" data-k={s.kind}>
                <span className="tk-lit" style={walk("n", i * 2)} />
                {s.kind !== "plain" && <span className="tk-cell" />}
              </span>
              <span className="tk-nm">{s.name}</span>
            </li>
          ))}
        </ol>
        <span className="tk-hl" aria-hidden="true" />
        <span className="tk-cardw" aria-hidden="true">
          <Card {...d.card} />
        </span>
        <ul className="tk-rs" aria-label={d.reasonsLabel}>
          {d.reasons.map((r) => (
            <li key={r}>
              {CHECK}
              {r}
            </li>
          ))}
        </ul>
      </div>
      <Ledger rows={d.ledger} />
    </div>
  )
}
