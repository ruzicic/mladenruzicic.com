"use client"

import { useRef, useState } from "react"

import { Button } from "../primitives/Button"
import { Icon } from "../primitives/Icon"

export interface LedgerToggleProps {
  showAll: string
  showFewer: string
  /** Space-separated ids of the collapsed lists. */
  controls: string
}

/**
 * "Show all <n>" / "Show fewer" under the landing's list (both labels from
 * `content/pages/home.ts`, the number counted from content). The collapsed rows
 * are server-rendered; this button only flips `data-open` on the list's
 * section, and `app/styles/work.css` opens the rows in place (grid rows 0fr
 * to 1fr, 320ms, as on the board). Hidden when scripting is off, where the
 * list is complete.
 */
export function LedgerToggle({
  showAll,
  showFewer,
  controls,
}: LedgerToggleProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    ref.current?.closest("[data-ledger]")?.toggleAttribute("data-open", next)
  }

  return (
    <Button
      ref={ref}
      size="compact"
      className="ledger-toggle"
      aria-expanded={open}
      aria-controls={controls}
      onClick={toggle}
    >
      {open ? showFewer : showAll}
      {/* Down, turning up once the list is open (`aria-expanded`). */}
      <Icon name="arrow-down-up" />
    </Button>
  )
}
