import type { DiagramOf } from "@/lib/content/schema-diagrams"

import { Head, Lead } from "./parts"

const nf = new Intl.NumberFormat("en-US")

/**
 * The Count (DIAGRAMS.md, "Count"): one figure, then up to six proportional
 * bars as ledger rows. It is a table: label, value, and the bar as a
 * decorative cell.
 */
export function Count({ d }: { d: DiagramOf<"count"> }) {
  const max = Math.max(...d.bars.map((b) => b.value))
  return (
    <div className="dg-body ct">
      <Head d={d} />
      <Lead d={d} />
      <p className="ct-fig">
        <span className="dg-f">{nf.format(d.figure)}</span>
        <span className="dg-l">{d.figureLabel}</span>
      </p>
      <table className="ct-t">
        <caption className="dg-sr">{d.figureLabel}</caption>
        <thead className="dg-sr">
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Documents</th>
          </tr>
        </thead>
        <tbody>
          {d.bars.map((b) => (
            <tr key={b.label}>
              <th scope="row" className="dg-l ct-lb">
                {b.label}
              </th>
              <td className="ct-bt" aria-hidden="true">
                <span
                  className="ct-bar"
                  data-acc={b.accent ? "" : undefined}
                  style={{ width: `${((b.value / max) * 100).toFixed(2)}%` }}
                />
              </td>
              <td className="ct-v">{nf.format(b.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Before and after (DIAGRAMS.md, "Before and after"): two figures side by
 * side, a hairline between, then the supporting pair. A description list.
 */
export function BeforeAfter({ d }: { d: DiagramOf<"before-after"> }) {
  return (
    <div className="dg-body ba">
      <Head d={d} />
      <Lead d={d} />
      <dl className="dg-ba">
        {d.pair.map((p, i) => (
          <div
            key={p.label}
            className="dg-bac"
            data-second={i ? "" : undefined}
          >
            <dt className="dg-l">{p.label}</dt>
            <dd className="dg-f">{p.figure}</dd>
          </div>
        ))}
      </dl>
      <p className="dg-t ba-line">{d.line}</p>
      <div className="ba-sub">
        <p className="dg-l">{d.sub.label}</p>
        <dl className="dg-ba">
          {d.sub.pair.map((q, i) => (
            <div
              key={q.value}
              className="dg-bac"
              data-second={i ? "" : undefined}
            >
              <dt className="dg-sr">{i ? d.pair[1].label : d.pair[0].label}</dt>
              <dd className="dg-t">{q.value}</dd>
              {q.note && <dd className="dg-n">{q.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
