import { useEffect, useState } from "react"

/**
 * `on`, but only once it has held for `ms`; it drops at once. A pointer
 * crossing a control for a moment must not flip the glyph that shows a hold.
 */
export function useDelayedOn(on: boolean, ms = 120): boolean {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!on) return
    const t = window.setTimeout(() => setSettled(true), ms)
    return () => {
      window.clearTimeout(t)
      setSettled(false)
    }
  }, [on, ms])
  return on && settled
}
