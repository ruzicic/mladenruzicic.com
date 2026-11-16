import "@/app/styles/about.css"
import "@/app/styles/rail.css"

import Image from "next/image"

import { getAbout, getMedia } from "@/lib/content"
import { MediaSlot } from "@/app/components/primitives/MediaSlot"
import { railCounter } from "@/app/components/primitives/rail-counter"

import { EarlyCarousel } from "./EarlyCarousel"

/**
 * The early projects, inside the story (owner, 15 Nov 2026: layout B, "the
 * picture beside the words"; it replaced the "Where it started" section).
 * Each slide is the 4:3 picture in a `MediaSlot` frame (165 by 124 on
 * desktop, 228 by 171 on a phone, served at twice that from the existing
 * files) and, beside it or under it, the mono caption (name and year) and
 * the line of context. A frame without `src` (or whose still is not in
 * `content/media.ts`) stays the empty labelled slot.
 *
 * All slides are one height at every width: they sit in one horizontal
 * scroller, which is as tall as its tallest slide, so stepping through them
 * never moves the page below.
 */
export function AboutEarly() {
  const { early } = getAbout()
  const total = early.frames.length

  return (
    <EarlyCarousel
      label={early.label}
      counterFormat={early.counterFormat}
      prevLabel={early.prevLabel}
      nextLabel={early.nextLabel}
      total={total}
    >
      {early.frames.map((frame, i) => {
        const info = frame.src ? getMedia(frame.src) : undefined
        return (
          <div
            key={i}
            className="ab-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={railCounter(early.slideLabelFormat, i, total)}
            data-on={i === 0 ? "" : undefined}
          >
            <figure className="ab-slide__fig">
              <MediaSlot
                ratio={frame.ratio.replace(":", " / ")}
                label={frame.label}
                align="center"
                className="ab-slide__pic"
              >
                {frame.src && info ? (
                  <Image
                    src={frame.src}
                    alt={frame.alt ?? ""}
                    width={info.width}
                    height={info.height}
                    placeholder="blur"
                    blurDataURL={info.blurDataURL}
                    sizes="(max-width: 720px) 228px, 165px"
                    draggable={false}
                  />
                ) : undefined}
              </MediaSlot>
              <figcaption className="ab-slide__words">
                <span className="ab-mono">{frame.caption}</span>
                <span className="ab-slide__text">{frame.text}</span>
              </figcaption>
            </figure>
          </div>
        )
      })}
    </EarlyCarousel>
  )
}
