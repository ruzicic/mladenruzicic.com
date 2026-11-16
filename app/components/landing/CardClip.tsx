"use client"

import {
  useLazyClip,
  type ClipGate,
} from "@/app/components/primitives/use-lazy-clip"

import { useMedia } from "./use-client-only"

interface ClipSources {
  webm: string
  mp4: string
}

export interface CardClipProps extends ClipSources {
  /** The phone take, used at the strip's phone width instead. */
  narrow?: ClipSources
}

/** Where the strip switches to its phone layout (landing.css). */
const NARROW = "(max-width: 720px)"

const card = (video: HTMLVideoElement) => video.closest("[data-card]")
const inFocus = (video: HTMLVideoElement) =>
  card(video)?.hasAttribute("data-on") === true
const motionPaused = () => document.documentElement.dataset.motion === "paused"

/**
 * A strip card runs its clip only while it is the card in focus (the
 * `data-on` flag StripRail writes to the card) and while the page's motion
 * is not paused (`html[data-motion="paused"]`, the headline's pause button,
 * the landing's one stop control for continuous motion, WCAG 2.2.2). Coming
 * into focus, the clip starts again from its first frame.
 */
const CARD_GATE: ClipGate = {
  open: (video) => inFocus(video) && !motionPaused(),
  subscribe(video, onChange) {
    let focused = inFocus(video)
    const mo = new MutationObserver(() => {
      const now = inFocus(video)
      if (now && !focused && video.readyState > 0) video.currentTime = 0
      focused = now
      onChange()
    })
    const el = card(video)
    if (el) mo.observe(el, { attributes: true, attributeFilter: ["data-on"] })
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    })
    return () => mo.disconnect()
  },
}

/**
 * A strip card's product clip: muted, looping, inline, no controls. It sits
 * over its poster (drawn by `Strip` with the card's other images, so the
 * poster is what paints first, and all there is without JavaScript) and stays
 * transparent until it is playing, so a card out of focus shows its poster.
 *
 * A card may carry a second, `narrow` take for phones; only the take for the
 * current viewport is ever requested (the poster picks the same way, through
 * `<picture>` in `Strip`).
 *
 * The loading rules are the story clips' (`useLazyClip`): no `<source>`
 * and no request until the card is near the viewport and in focus, nothing by
 * itself under reduced motion or Save-Data. The poster carries the text
 * alternative; the `<video>` repeats it and is hidden from assistive tech.
 */
export function CardClip({ webm, mp4, narrow }: CardClipProps) {
  // One take per viewport, chosen before any source exists, so the other
  // take is never requested. Crossing the breakpoint later swaps and
  // reloads (the window changes shape with it, in CSS).
  const phone = useMedia(NARROW)
  const take = narrow && phone ? narrow : { webm, mp4 }
  const { ref, attached, ready, playing } = useLazyClip(CARD_GATE, take.webm)
  return (
    <video
      ref={ref}
      className="lc-clip-video"
      data-ready={ready ? "" : undefined}
      data-playing={playing ? "" : undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      disablePictureInPicture
    >
      {attached ? (
        <>
          <source src={take.webm} type="video/webm" />
          <source src={take.mp4} type="video/mp4" />
        </>
      ) : null}
    </video>
  )
}
