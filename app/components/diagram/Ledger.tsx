import type { LedgerLine } from "@/lib/content/schema-diagrams"

/**
 * The ledger under a pipeline or a track: one line per stage, rows with a
 * hairline between. At the phone size a row shows its `short` note; the full
 * note stays in the markup, visually hidden, for assistive technology.
 */
export function Ledger({ rows }: { rows: LedgerLine[] }) {
  return (
    <ol className="dg-led">
      {rows.map((row) => (
        <li key={row.name} data-short={row.short ? "" : undefined}>
          <span className="dg-led-name">{row.name}</span>
          <span className="dg-n dg-led-note">{row.note}</span>
          {row.short && (
            <span className="dg-n dg-led-short" aria-hidden="true">
              {row.short}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}
