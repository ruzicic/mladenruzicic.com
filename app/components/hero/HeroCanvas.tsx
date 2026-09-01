"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { HeroStill } from "./HeroStill"
import { Poster } from "./Poster"
import type { TooltipInfo } from "./Scene"
import type { HeroLogoShard } from "./types"

/**
 * The gate in front of the three.js scene — docs/v3-redesign-plan.md §5.1
 * "Loading" and "Fallbacks".
 *
 * `next/dynamic({ ssr: false })` is declared at module scope but the chunk is
 * only requested when `<Scene>` actually renders, which happens after
 *   1. fonts are ready (so the canvas never competes with the LCP headline),
 *   2. the main thread goes idle,
 *   3. the visitor has not asked for reduced motion, and
 *   4. a WebGL2 context probes clean.
 *
 * Under reduced motion we render the seeded SVG still instead and three.js is
 * never fetched. With no WebGL2 the gradient poster simply stays.
 */
const Scene = dynamic(() => import("./Scene"), { ssr: false })

type Phase = "poster" | "still" | "loading" | "live"

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/** One-shot WebGL2 probe. Contexts are scarce, so we release it immediately. */
function hasWebGL2(): boolean {
  if (typeof document === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2")
    if (!gl) return false
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

/** `requestIdleCallback` with the `setTimeout` fallback Safari still needs. */
function onIdle(callback: () => void, timeout = 1200): () => void {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }
  ).requestIdleCallback
  if (typeof ric === "function") {
    const handle = ric(callback, { timeout })
    return () => {
      ;(
        window as unknown as { cancelIdleCallback?: (h: number) => void }
      ).cancelIdleCallback?.(handle)
    }
  }
  const handle = window.setTimeout(callback, 300)
  return () => window.clearTimeout(handle)
}

export function HeroCanvas({ logos }: { logos: HeroLogoShard[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  /*
   * The hero <section> owns R3F's events (`eventSource`), so the copy above the
   * canvas stays selectable. A ref rather than state: the scene only ever reads
   * it from effects, which run after this one on every commit that can matter.
   */
  const sectionRef = useRef<HTMLElement | null>(null)
  const [phase, setPhase] = useState<Phase>("poster")
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)

  useEffect(() => {
    sectionRef.current = wrapperRef.current?.closest("section") ?? null
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    let cancelled = false
    let cancelIdle: (() => void) | undefined

    const start = () => {
      if (prefersReducedMotion()) {
        setPhase("still")
        return
      }
      if (!hasWebGL2()) {
        setPhase("poster")
        return
      }
      const fonts = document.fonts?.ready ?? Promise.resolve()
      fonts
        .catch(() => undefined)
        .then(() => {
          if (cancelled || prefersReducedMotion()) return
          cancelIdle = onIdle(() => {
            if (!cancelled) setPhase("loading")
          })
        })
    }

    start()

    const onChange = () => {
      cancelled = false
      cancelIdle?.()
      if (media.matches) {
        setPhase("still")
        setTooltip(null)
      } else {
        setPhase("poster")
        start()
      }
    }
    media.addEventListener("change", onChange)

    return () => {
      cancelled = true
      cancelIdle?.()
      media.removeEventListener("change", onChange)
    }
  }, [])

  const handleFirstFrame = useCallback(() => setPhase("live"), [])

  const showScene = phase === "loading" || phase === "live"

  return (
    <div
      ref={wrapperRef}
      data-testid="hero-canvas"
      data-hero-canvas
      data-hero-phase={phase}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {phase === "still" ? (
        <HeroStill logos={logos} />
      ) : (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-reveal"
          style={{ opacity: phase === "live" ? 0 : 1 }}
        >
          <Poster />
        </div>
      )}

      {showScene ? (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-reveal"
          style={{ opacity: phase === "live" ? 1 : 0 }}
        >
          <Scene
            logos={logos}
            sectionRef={sectionRef}
            onFirstFrame={handleFirstFrame}
            onTooltip={setTooltip}
          />
        </div>
      ) : null}

      {tooltip ? (
        <div
          aria-hidden
          data-testid="hero-tooltip"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-xs border border-line bg-surface/90 px-3 py-2 font-mono text-[11px] uppercase leading-none tracking-[0.06em] text-fg backdrop-blur-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            borderBottom: `2px solid ${tooltip.color}`,
          }}
        >
          {tooltip.name}
          <span className="ml-2 text-muted normal-case">{tooltip.years}</span>
        </div>
      ) : null}
    </div>
  )
}
