import type { DiagramOf } from "@/lib/content/schema-diagrams"

import { Head, walk } from "./parts"

/**
 * The Loop (DIAGRAMS.md, "Start with the whole"): the rail closed into a
 * rounded rectangle, five stations on it, the point in the middle. Stations
 * are an ordered list; the ring is decorative. At the phone size the ring
 * sits on top with numbered corners and the stations become a numbered list
 * under it.
 */
export function Loop({ d }: { d: DiagramOf<"loop"> }) {
  return (
    <div className="dg-body lp">
      <Head d={d} />
      <div className="lp-w">
        <div className="lp-box">
          <span className="lp-ring" aria-hidden="true">
            <span className="lp-r" />
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="lp-f"
                data-s={s}
                style={walk(s === 2 || s === 5 ? "y" : "x", s * 2 - 1)}
              />
            ))}
            {d.stations.map((st, i) => (
              <span key={i} className="lp-mk" data-s={i + 1} data-who={st.who}>
                <span className="lp-pl" style={walk("n", i * 2)} />
              </span>
            ))}
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="lp-no" data-s={s}>
                {s}
              </span>
            ))}
          </span>
          <p className="lp-c">
            <span className="lp-ct">{d.lead}</span>
            <span className="dg-n">{d.leadNote}</span>
          </p>
        </div>
        <ol className="lp-ol">
          {d.stations.map((st, i) => (
            <li key={i} className="lp-s" data-s={i + 1}>
              <span className="lp-who" data-who={st.who}>
                {st.whoLabel}
              </span>
              <span className="dg-t lp-t">{st.title}</span>
              {st.note && <span className="dg-l lp-note">{st.note}</span>}
            </li>
          ))}
        </ol>
      </div>
      <p className="dg-n lp-aside">
        <b>{d.aside.label}</b> {d.aside.text}
      </p>
    </div>
  )
}
