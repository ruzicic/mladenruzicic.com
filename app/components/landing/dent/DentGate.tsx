"use client"

import { useEffect } from "react"

/**
 * Where the dent may exist at all: a mouse that hovers, a window wider than
 * 1024px, and no reduced-motion preference (WebGPU is checked as well).
 */
const GATE =
  "(hover: hover) and (pointer: fine) and (min-width: 1025px) and (prefers-reduced-motion: no-preference)"

/** The one piece of WebGPU the gate needs (the full types ship with vgpu). */
type WebGpu = { requestAdapter(): Promise<object | null> }

/** Resolves after the window's `load` event. */
function afterLoad(): Promise<void> {
  if (document.readyState === "complete") return Promise.resolve()
  return new Promise((resolve) =>
    window.addEventListener("load", () => resolve(), { once: true })
  )
}

/** Resolves on the first real mouse movement. */
function firstMouseMove(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return
      window.removeEventListener("pointermove", onMove)
      resolve()
    }
    window.addEventListener("pointermove", onMove, { passive: true, signal })
  })
}

/** Resolves when the browser is idle (Safari has no requestIdleCallback). */
function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window.requestIdleCallback === "function")
      window.requestIdleCallback(() => resolve(), { timeout: 2000 })
    else setTimeout(resolve, 200)
  })
}

/**
 * The homepage dent's gate (`HOME.dent`). Renders nothing. Only where
 * `GATE` matches and the browser offers a WebGPU adapter, and only after the
 * page has loaded and a mouse has moved, it imports the effect (`./runtime`,
 * which holds vgpu and the shaders) in idle time. Crawlers and tools that
 * never move a mouse download none of it. It follows `GATE`: turning on
 * reduced motion, or narrowing the window, tears the effect down and
 * releases the GPU. If WebGPU cannot start, it stays off for the visit.
 */
export function DentGate() {
  useEffect(() => {
    const webgpu = (navigator as Navigator & { gpu?: WebGpu }).gpu
    if (!webgpu) return
    const sheet = document.querySelector<HTMLElement>("[data-page-sheet]")
    if (!sheet) return
    const query = window.matchMedia(GATE)
    let run = new AbortController()
    let stop: (() => void) | undefined
    let failed = false

    const arm = async (signal: AbortSignal) => {
      await afterLoad()
      await firstMouseMove(signal)
      if (signal.aborted) return
      await idle()
      if (signal.aborted) return
      try {
        // A browser can expose WebGPU and still have no adapter (no GPU,
        // or one it refuses): then nothing more is downloaded.
        if (!(await webgpu.requestAdapter())) {
          failed = true
          return
        }
        if (signal.aborted) return
        const { startDent } = await import("./runtime")
        if (signal.aborted) return
        const teardown = await startDent(sheet)
        if (signal.aborted) teardown()
        else stop = teardown
      } catch (err) {
        failed = true
        console.debug("dent: off", err)
      }
    }

    const sync = () => {
      run.abort()
      stop?.()
      stop = undefined
      run = new AbortController()
      if (query.matches && !failed) void arm(run.signal)
    }

    sync()
    query.addEventListener("change", sync)
    return () => {
      query.removeEventListener("change", sync)
      run.abort()
      stop?.()
    }
  }, [])

  return null
}
