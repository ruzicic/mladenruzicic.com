import { ViewTransition } from "react"
import Image from "next/image"

import type { WorkEntry } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

import { StaticAccentGradient } from "../shaders"
import { MORPH_CLASS, workArtTransitionName } from "./transitions"

/** `media[0]` may carry a build-time blur placeholder; the schema does not
 *  require one yet, so we read it defensively rather than widening the schema. */
type Media = NonNullable<WorkEntry["media"]>[number] & {
  blurDataURL?: string
}

export interface WorkArtProps {
  entry: WorkEntry
  /** Responsive `sizes`. Required — there is no sensible default. */
  sizes: string
  /** Only the case-study header image should preload. */
  preload?: boolean
  className?: string
}

/**
 * The 16:10 art tile, wrapped in the shared-element `ViewTransition` so it
 * morphs from `/` and `/work` into the case-study header.
 *
 * No screenshots exist yet, so the default is the accent-tinted static shader.
 * The moment `media[0]` lands the tile switches to `next/image` with no other
 * change: same aspect ratio, same transition name, same morph.
 *
 * `default="none"` keeps the tile out of in-page updates (the `/work` filter),
 * where the card wrapper animates instead; `share="vt-morph"` is what pairs it
 * across a navigation.
 */
export function WorkArt({ entry, sizes, preload, className }: WorkArtProps) {
  const media = entry.media?.[0] as Media | undefined

  return (
    <ViewTransition
      name={workArtTransitionName(entry.slug)}
      share={MORPH_CLASS}
      default="none"
    >
      <div className={cn("work-card__art", className)}>
        {media && media.kind === "image" ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            sizes={sizes}
            preload={preload}
            placeholder={media.blurDataURL ? "blur" : "empty"}
            blurDataURL={media.blurDataURL}
            className="h-full w-full object-cover"
          />
        ) : (
          <StaticAccentGradient accent={entry.accent} />
        )}
      </div>
    </ViewTransition>
  )
}
