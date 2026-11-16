"use client"

import { useSyncExternalStore } from "react"

import { Button } from "../primitives/Button"
import { Icon } from "../primitives/Icon"
import {
  IN_VIEW,
  useLazyClip,
  type ClipGate,
} from "../primitives/use-lazy-clip"

export interface StoryVideoSource {
  src: string
  type: string
}

export interface StoryVideoProps {
  /** `.webm` first, then `.mp4`; attached only once the clip is near the viewport. */
  sources: StoryVideoSource[]
  /** Accessible name of the clip (the square's text alternative). */
  label: string
  /** The clip's own size, as `width` and `height` on the `<video>`. */
  width: number
  height: number
  /** Aria labels for the pause/play control. */
  pauseLabel: string
  playLabel: string
}

const noop = () => () => {}

const motionPaused = () => document.documentElement.dataset.motion === "paused"

/**
 * A story clip also stops while the page's motion is paused
 * (`html[data-motion="paused"]`, the site's one stop control for continuous
 * motion), and runs again when it is resumed.
 */
const MOTION_GATE: ClipGate = {
  open: () => !motionPaused(),
  subscribe(_video, onChange) {
    const mo = new MutationObserver(onChange)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    })
    return () => mo.disconnect()
  },
}

/**
 * A clip in one of the story's squares: muted, looping, inline. It renders
 * inside the square's media box, over the poster still that `StoryColumn`
 * draws with `next/image` (so the still is what paints first, with its blur
 * placeholder, and nothing shifts when the clip comes).
 *
 * The loading and playing rules are `useLazyClip`'s, shared with the strip
 * cards (`app/components/landing/CardClip.tsx`):
 *
 * - Nothing downloads until half the square is in view (owner, 16 Nov
 *   2026: "videos on case study should start playing when they get in
 *   viewport, no need before that"), so the first square peeking at the
 *   cover's foot waits for the reader to scroll: no `<source>` is rendered
 *   until then, and `preload="none"`.
 * - In view it plays; once less than half of it shows it pauses; so does
 *   the page's motion pause.
 * - The `<video>` stays transparent until it has a frame, so the poster
 *   shows through until then.
 * - Under `prefers-reduced-motion: reduce` or Save-Data it never starts by
 *   itself: the poster stays and the button plays it on request.
 * - The button pauses and resumes it at any time (WCAG 2.2.2: the clips loop
 *   for longer than five seconds). A choice by the reader sticks. It appears
 *   once the island is running, since without JavaScript nothing moves.
 *
 * Imported only where a story has a clip (`StoryVideoLoader`), so pages
 * without clips ship none of this.
 */
export function StoryVideo({
  sources,
  label,
  width,
  height,
  pauseLabel,
  playLabel,
}: StoryVideoProps) {
  const { ref, attached, ready, playing, toggle } = useLazyClip(
    MOTION_GATE,
    undefined,
    IN_VIEW
  )
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false
  )

  return (
    <>
      <video
        ref={ref}
        className="story-video"
        data-ready={ready ? "" : undefined}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload="none"
        aria-label={label}
        disablePictureInPicture
      >
        {attached
          ? sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)
          : null}
      </video>
      {hydrated ? (
        <Button
          size="icon"
          className="story-video-toggle"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
        >
          <Icon name="play-pause" size={16} on={playing} />
        </Button>
      ) : null}
    </>
  )
}
