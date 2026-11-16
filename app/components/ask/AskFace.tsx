import type { CSSProperties } from "react"

import { Icon } from "../primitives/Icon"
import { BUTTON_CELLS, fillCellStyle } from "./cells"

/**
 * The inside of the Ask button: 128 fill cells (no paper marker cell since
 * 15 Nov 2026: the filled button is solid black), and
 * the two stacked labels ("Ask" and a plus at rest, "Close" while open,
 * where the same plus has turned 45° into the close: both labels carry
 * the one `plus-close` glyph, which turns with the button's `data-on`
 * while the labels cross over). Shared by
 * the real button and the copy of it that sits above the glass while the
 * panel is open. Decorative; the button carries the accessible name.
 */
export function AskFace({
  label,
  closeLabel,
}: {
  label: string
  closeLabel: string
}) {
  return (
    <>
      <span className="ask-btn__cells" aria-hidden="true">
        {BUTTON_CELLS.map((cell, i) => (
          <span
            key={i}
            className="ask-bc"
            style={fillCellStyle(cell) as CSSProperties}
          />
        ))}
      </span>
      {/* The words are generated content (`attr(data-text)`, ask.css). They
          paint through `mix-blend-mode: difference`, which no contrast
          checker models: axe reads the raw #ebebe9 and reports 1.16:1 for
          what reaches the screen as ink on paper (about 18:1). The button's
          aria-label carries the name, so nothing is lost. */}
      <span
        className="ask-lbl ask-lbl--ask"
        data-text={label}
        aria-hidden="true"
      >
        <Icon name="plus-close" size={13} />
      </span>
      <span
        className="ask-lbl ask-lbl--close"
        data-text={closeLabel}
        aria-hidden="true"
      >
        <Icon name="plus-close" size={13} />
      </span>
    </>
  )
}

/**
 * The send button's up arrow. The button is a plain `Button` (icon size,
 * the shared fill): only the Ask button itself has cells.
 */
export function SendIcon() {
  return <Icon name="arrow-up" size={16} />
}
