import type { CSSProperties } from "react"
import Image from "next/image"

import { getMedia, getVideoSources } from "@/lib/content"
import type { Story, StoryItem } from "@/lib/content/schema"
import { Diagram, DIAGRAM_IDS, diagramText } from "@/app/components/diagram"

import { STORY_LABELS } from "./labels"
import { StoryVideoLoader as StoryVideo } from "./StoryVideoLoader"

/** The square's width: 752px beside the panel, the page's width below 1100px. */
const SQUARE_SIZES = "(max-width: 1100px) min(752px, calc(100vw - 48px)), 752px"

/**
 * How a picture sits in its square. A square file fills it. Anything else is
 * shown whole, centred on the story's plate, never cropped and never
 * stretched (the fallback until the owner reshoots it square): a phone
 * screen at 40% of the square's width (at most 300px), a wide picture at
 * 87.2%, narrowed so that a nearly square one still fits the height.
 */
function fitOf(width: number, height: number) {
  const ratio = width / height
  if (Math.abs(ratio - 1) < 0.01) return { shape: "square" as const }
  if (ratio < 0.75) return { shape: "phone" as const, percent: 40 }
  return {
    shape: "wide" as const,
    percent: Number((87.2 * Math.min(1, ratio)).toFixed(2)),
  }
}

function mediaInfo(src: string) {
  const info = getMedia(src)
  if (!info) throw new Error(`"${src}" is not in content/media.ts.`)
  return info
}

function sizesFor(percent?: number) {
  if (!percent) return SQUARE_SIZES
  const f = percent / 100
  return `(max-width: 1100px) min(${Math.round(752 * f)}px, calc((100vw - 48px) * ${f})), ${Math.round(752 * f)}px`
}

function MediaSquare({
  item,
  lead,
}: {
  item: Extract<StoryItem, { kind: "image" | "clip" }>
  lead: boolean
}) {
  const still = item.kind === "clip" ? item.poster : item.src
  const info = mediaInfo(still)
  const fit = fitOf(info.width, info.height)
  const box: CSSProperties =
    fit.shape === "square"
      ? {}
      : ({
          width: `${fit.percent}%`,
          aspectRatio: `${info.width} / ${info.height}`,
        } as CSSProperties)

  return (
    <div className="cs-sq-frame" data-shape={fit.shape}>
      <div className="cs-sq-media" style={box}>
        <Image
          src={still}
          alt={item.kind === "clip" ? "" : item.alt}
          width={info.width}
          height={info.height}
          placeholder="blur"
          blurDataURL={info.blurDataURL}
          sizes={sizesFor(fit.shape === "square" ? undefined : fit.percent)}
          // The lead square comes up over the cover's foot, so it is in the
          // first screen: fetched at once, but not ahead of the name, which
          // is the page's largest paint (no `preload`). React's server
          // renderer preloads any `<img>` that is not `lazy` unless its
          // priority is `low`, so `fetchPriority` keeps it out of the head.
          loading={lead ? "eager" : undefined}
          fetchPriority={lead ? "low" : undefined}
        />
        {item.kind === "clip" ? (
          <StoryVideo
            sources={getVideoSources(item.src)}
            poster={item.poster}
            label={item.alt}
            width={info.width}
            height={info.height}
            pauseLabel={STORY_LABELS.pause}
            playLabel={STORY_LABELS.play}
          />
        ) : null}
      </div>
    </div>
  )
}

/** One square and its caption line. */
function Square({
  item,
  index,
  slug,
}: {
  item: StoryItem
  index: number
  slug: string
}) {
  const common = {
    "data-square": "",
    "data-index": index,
    "data-kind": item.kind,
  }

  if (item.kind === "diagram") {
    if (!(DIAGRAM_IDS as readonly string[]).includes(item.id))
      throw new Error(
        `Invalid content in content/work/${slug}.mdx: diagram "${item.id}" is not one of DIAGRAM_IDS.`
      )
    const { caption } = diagramText(item.id)
    return (
      <figure className="cs-sq" {...common}>
        <div className="cs-sq-frame" data-shape="diagram">
          <Diagram id={item.id} />
        </div>
        {caption ? <figcaption className="cs-cap">{caption}</figcaption> : null}
      </figure>
    )
  }

  return (
    <figure
      className="cs-sq"
      {...common}
      data-clip={item.kind === "clip" ? "" : undefined}
    >
      <MediaSquare item={item} lead={index === 0} />
      <figcaption className="cs-cap">
        {item.caption}
        {item.credit ? <span className="cs-credit">{item.credit}</span> : null}
      </figcaption>
    </figure>
  )
}

/**
 * The right half of a case study (CaseStudy.dc.html): a stack of identical
 * squares, each with one caption line (and, for a picture that is not his,
 * a credit line under it), in content order. Clips follow the
 * site's loading rules (`StoryVideo`); diagrams are the diagram builder's
 * components, given the square to fill.
 *
 * In two parts (16 Nov 2026): `lead` is the first square, which comes up
 * over the cover's foot and, in one column, comes before the panel's text;
 * `rest` is the others. Beside the panel they are one column (`story.css`).
 */
export function StoryColumn({
  story,
  part,
}: {
  story: Story
  part: "lead" | "rest"
}) {
  const items = story.column
    .map((item, i) => ({ item, i }))
    .filter(({ i }) => (part === "lead" ? i === 0 : i > 0))
  if (!items.length) return null
  return (
    <div className={part === "lead" ? "cs-lead" : "cs-column"}>
      {items.map(({ item, i }) => (
        <Square key={i} item={item} index={i} slug={story.slug} />
      ))}
    </div>
  )
}
