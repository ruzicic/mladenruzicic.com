"use client"

import { useEffect, useRef, useState } from "react"

/**
 * First-visit-per-session preloader — docs/v3-redesign-plan.md §5.4,
 * decision §10.7.
 *
 * The hero paints underneath at `opacity: 1`, so LCP fires when the headline
 * paints, not when this overlay lifts. It is `aria-hidden`, never takes pointer
 * events, and is skipped entirely under `prefers-reduced-motion`.
 *
 * VISIBILITY IS DECIDED BEFORE PAINT, NOT BY REACT:
 * - the inline `<script>` in `<head>` stamps `data-preloader="off"` on `<html>`
 *   when the session key already exists;
 * - `shell.css` hides it under reduced motion;
 * - a `<noscript><style>` in the layout hides it when JavaScript is off.
 *
 * The overlay is therefore always server-rendered and the first client render
 * matches it exactly — no hydration mismatch, and no black screen for a visitor
 * without JavaScript. The lazy `useState` initialiser below only decides
 * whether the counter *runs*.
 */

export const PRELOADER_KEY = "mr:preloaded"

const MIN_MS = 600
const MAX_MS = 1000
const VERB_MS = 220
const FADE_MS = 500

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return true
    return sessionStorage.getItem(PRELOADER_KEY) === "1"
  } catch {
    return false
  }
}

export interface PreloaderProps {
  /** `HOME.preloader.verbs` — the curated Claude Code status verbs. */
  verbs: readonly string[]
  /** `HOME.preloader.finalVerb` — always the last one shown ("Shipping"). */
  finalVerb: string
}

export function Preloader({ verbs, finalVerb }: PreloaderProps) {
  // Matches the server output on the first client render.
  const [mounted, setMounted] = useState(true)
  const [skip] = useState(shouldSkip)

  const rootRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const start = performance.now()
    let fontsAt = Number.POSITIVE_INFINITY
    let frame = 0
    let fadeTimer = 0
    let finished = false

    if (skip) {
      // Already hidden by CSS before paint; just take it out of the DOM after
      // this commit, so nothing renders synchronously from inside the effect.
      fadeTimer = window.setTimeout(() => setMounted(false), 0)
      return () => window.clearTimeout(fadeTimer)
    }

    document.fonts?.ready
      .then(() => {
        fontsAt = performance.now() - start
      })
      .catch(() => {
        /* ignore */
      })

    const cycle = window.setInterval(() => {
      const verb = verbs[Math.floor(Math.random() * verbs.length)]
      if (statusRef.current) statusRef.current.textContent = `${verb}…`
    }, VERB_MS)

    const finish = () => {
      if (finished) return
      finished = true
      window.clearInterval(cycle)
      if (counterRef.current) counterRef.current.textContent = "100"
      if (statusRef.current) statusRef.current.textContent = `${finalVerb}…`
      try {
        sessionStorage.setItem(PRELOADER_KEY, "1")
      } catch {
        /* ignore */
      }
      rootRef.current?.setAttribute("data-phase", "out")
      fadeTimer = window.setTimeout(() => setMounted(false), FADE_MS)
    }

    const tick = () => {
      const elapsed = performance.now() - start
      // Ends at max(600ms, fonts.ready) but never later than 1000ms.
      const target = Math.min(
        MAX_MS,
        Math.max(MIN_MS, Number.isFinite(fontsAt) ? fontsAt : MAX_MS)
      )
      const progress = Math.min(1, elapsed / target)
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(progress * 100))
      }
      if (progress >= 1) {
        finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(cycle)
      window.clearTimeout(fadeTimer)
    }
  }, [skip, verbs, finalVerb])

  if (!mounted) return null

  return (
    <div
      ref={rootRef}
      data-testid="preloader"
      aria-hidden
      className={[
        "pointer-events-none fixed inset-0 z-100 bg-bg",
        "flex items-end justify-between gap-6",
        "px-[var(--gutter)] py-8",
      ].join(" ")}
    >
      <span
        ref={statusRef}
        className="font-mono text-[12px] uppercase leading-none tracking-[0.08em] text-muted"
      >
        {verbs[0]}…
      </span>
      <span
        ref={counterRef}
        className="font-display text-[clamp(96px,18vw,240px)] leading-[0.8] tracking-[-0.04em] text-fg tabular-nums"
      >
        0
      </span>
    </div>
  )
}
