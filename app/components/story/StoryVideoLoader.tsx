"use client"

import dynamic from "next/dynamic"

import { IslandBoundary } from "../primitives/IslandBoundary"
import type { StoryVideoProps } from "./StoryVideo"

/**
 * The clip island behind a dynamic import. All nine stories share one route,
 * so a static import would put `StoryVideo` in that route's client bundle
 * for every story (and a `next/dynamic` call in a Server Component does not
 * split client code). Through this loader only a page that renders a clip
 * fetches the `StoryVideo` chunk; the others ship this stub alone.
 *
 * `ssr` stays on: the `<video>` and its poster are in the HTML, so the frame
 * never shifts when the chunk arrives.
 */
const StoryVideoIsland = dynamic(() =>
  import("./StoryVideo").then((m) => m.StoryVideo)
)

/**
 * If the chunk fails, the clip degrades to what it is without JavaScript: a
 * plain `<video>` with its poster and the browser's own controls (which
 * include pause), so it never autoplays and never takes the page down.
 */
export function StoryVideoLoader({
  poster,
  ...props
}: StoryVideoProps & { poster?: string }) {
  return (
    <IslandBoundary
      fallback={
        <video
          poster={poster}
          aria-label={props.label}
          width={props.width}
          height={props.height}
          className="story-video"
          data-ready=""
          muted
          loop
          playsInline
          controls
          preload="none"
        >
          {props.sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      }
    >
      <StoryVideoIsland {...props} />
    </IslandBoundary>
  )
}
