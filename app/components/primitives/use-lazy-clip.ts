"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean }
}

/**
 * A condition besides "near the viewport" that a clip needs before it runs:
 * the strip card being the one in focus, the page's motion not paused.
 * Keep the object stable (a module constant): the hook subscribes once.
 */
export interface ClipGate {
  /** May the clip run now? */
  open(video: HTMLVideoElement): boolean
  /** Calls `onChange` whenever `open` may have changed; returns the cleanup. */
  subscribe(video: HTMLVideoElement, onChange: () => void): () => void
}

/**
 * When a clip counts as seen. Keep the object stable (a module constant).
 * Without one, a clip runs from 200px before it reaches the viewport (the
 * strip's cards, which are gated by focus as well).
 */
export interface ClipView {
  /**
   * The share of the clip, or of the viewport's height for a clip taller
   * than half of it, that must be on screen for the clip to load and run.
   */
  share: number
}

/** Story squares (owner, 16 Nov 2026: "videos on case study should start
 * playing when they get in viewport, no need before that"): half in view. */
export const IN_VIEW: ClipView = { share: 0.5 }

const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]

/**
 * The loading and playing rules every clip on the site follows (the story
 * clips in `StoryVideo`, the strip cards in `CardClip`):
 *
 * - Nothing downloads until the clip is near the viewport, or in it with a
 *   `view` (and its `gate`, if any, is open): until then `attached` is
 *   false, so the component renders no `<source>`, and the `<video>` carries
 *   `preload="none"`.
 * - Then it plays; off screen, or with the gate shut, it pauses.
 * - Under `prefers-reduced-motion: reduce` or Save-Data it never starts by
 *   itself; only `toggle` (a reader's press) plays it.
 * - A reader's `toggle` sticks: the viewport no longer decides after it.
 *
 * `ready` turns true once the clip has a frame of its own (until then the
 * poster under it shows), `playing` follows the element's play and pause.
 * `sourceKey` names the sources the component renders; when it changes
 * after they are attached, the clip reloads.
 */
export function useLazyClip(
  gate?: ClipGate,
  sourceKey?: string,
  view?: ClipView
) {
  const ref = useRef<HTMLVideoElement>(null)
  const [attached, setAttached] = useState(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  // Set once the reader has pressed a control: their choice wins over the
  // viewport from then on.
  const chose = useRef(false)
  // Whether the clip should be running once its sources are in.
  const want = useRef(false)

  // The sources went in, or changed (`sourceKey`: a card switching between
  // its wide and narrow take): load them, and start if that is what was asked.
  useEffect(() => {
    const video = ref.current
    if (!attached || !video) return
    video.load()
    if (want.current) video.play().catch(() => setPlaying(false))
  }, [attached, sourceKey])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const saveData =
      (navigator as NavigatorWithConnection).connection?.saveData === true
    const auto = () => !reduce.matches && !saveData

    let visible = false
    const sync = () => {
      if (chose.current) return
      if (visible && auto() && (!gate || gate.open(video))) {
        want.current = true
        if (video.querySelector("source")) {
          video.play().catch(() => setPlaying(false))
        } else {
          setAttached(true)
        }
      } else {
        want.current = false
        if (!video.paused) video.pause()
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (view) {
          // Half of the clip, or half of a window it more than fills.
          const shown = entry.intersectionRect.height
          const room = entry.rootBounds?.height ?? window.innerHeight
          visible =
            entry.isIntersecting &&
            (entry.intersectionRatio >= view.share - 0.005 ||
              shown >= room * view.share)
        } else {
          visible = entry.isIntersecting
        }
        sync()
      },
      view ? { threshold: STEPS } : { rootMargin: "200px 0px", threshold: 0.25 }
    )
    io.observe(video)
    reduce.addEventListener("change", sync)
    const unsubscribe = gate?.subscribe(video, sync)

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onReady = () => setReady(true)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("loadeddata", onReady)

    return () => {
      io.disconnect()
      reduce.removeEventListener("change", sync)
      unsubscribe?.()
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("loadeddata", onReady)
    }
  }, [gate, view])

  /** A reader's play or pause; from then on the viewport does not decide. */
  const toggle = useCallback(() => {
    const video = ref.current
    if (!video) return
    chose.current = true
    if (video.paused) {
      want.current = true
      if (video.querySelector("source")) {
        video.play().catch(() => setPlaying(false))
      } else {
        setAttached(true)
      }
    } else {
      want.current = false
      video.pause()
    }
  }, [])

  return { ref, attached, ready, playing, toggle }
}
