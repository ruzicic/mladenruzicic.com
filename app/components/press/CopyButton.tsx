"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"

import { Button } from "../primitives/Button"
import { Icon } from "../primitives/Icon"

const noop = () => () => {}

export interface CopyButtonProps {
  /** `id` of the element whose text is copied. */
  target: string
  /** Visible label, and the button's name. */
  label: string
  /** Shown in place and announced after a copy. */
  copiedLabel: string
  /** Shown and announced when the clipboard refuses. */
  failedLabel: string
  /**
   * Set when several buttons share one label ("Copy"): the copied text then
   * describes the button, so a screen reader can tell them apart.
   */
  describe?: boolean
}

/** VoiceOver skips a message identical to the last one; see `report()`. */
let lastMessage = ""

/**
 * A copy button for a block of text on `/press`. It confirms in place (the
 * label turns to `copiedLabel` and the icon to a check for two seconds) and
 * announces the result through a polite `role="status"` sibling (a live
 * region inside a button is not reliably announced).
 *
 * Hidden (but still taking its space) until hydrated, so without JavaScript
 * there is no button that does nothing; the text itself is plain and
 * selectable either way.
 */
export function CopyButton({
  target,
  label,
  copiedLabel,
  failedLabel,
  describe,
}: CopyButtonProps) {
  // False during SSR and hydration, true once the client has taken over.
  const ready = useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const [message, setMessage] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function report(ok: boolean) {
    clearTimeout(timer.current)
    setState(ok ? "copied" : "failed")
    let next = ok ? copiedLabel : failedLabel
    if (next === lastMessage) next += " "
    lastMessage = next
    setMessage("")
    requestAnimationFrame(() => setMessage(next))
    timer.current = setTimeout(() => {
      setState("idle")
      setMessage("")
    }, 2000)
  }

  async function copy() {
    const el = document.getElementById(target)
    const text = el?.innerText.trim()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      report(true)
    } catch {
      // Leave the text selected so Cmd/Ctrl+C still works.
      if (el) window.getSelection()?.selectAllChildren(el)
      report(false)
    }
  }

  return (
    <span className="pr-copy">
      <Button
        size="compact"
        className="pr-copy__btn"
        data-ready={ready ? "" : undefined}
        data-state={state}
        aria-describedby={describe ? target : undefined}
        onClick={copy}
      >
        {/* Copy, then the check draws itself until the button resets. */}
        <Icon name="copy-check" size={16} on={state === "copied"} />
        <span
          className="pr-copy__label"
          data-on={state === "idle" ? "" : undefined}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className="pr-copy__label"
          data-on={state !== "idle" ? "" : undefined}
        >
          {state === "failed" ? failedLabel : copiedLabel}
        </span>
      </Button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </span>
  )
}
