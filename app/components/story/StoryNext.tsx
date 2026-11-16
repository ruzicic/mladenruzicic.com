import { getProductMark, getStories } from "@/lib/content"
import type { Story } from "@/lib/content/schema"
import { Icon } from "@/app/components/primitives/Icon"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { STORY_LABELS } from "./labels"

/**
 * After the last square, across the page: the next of the nine stories
 * (wrapping round), as CaseStudy.dc.html draws it: a mono cue, the tile, the
 * name in Geist Serif and an arrow at the far end.
 */
export function StoryNext({ story }: { story: Story }) {
  const stories = getStories()
  const index = stories.findIndex((s) => s.slug === story.slug)
  const next = stories[(index + 1) % stories.length]
  const mark = getProductMark(next.slug)

  return (
    <nav className="cs-next" aria-label={STORY_LABELS.next}>
      <TransitionLink href={`/work/${next.slug}`} className="cs-next-link">
        <span className="cs-next-cue" aria-hidden="true">
          {STORY_LABELS.nextCue}
        </span>
        {mark ? (
          <span className="cs-next-tile">
            <ProductTile mark={mark} className="cs-tile" />
          </span>
        ) : null}
        <span className="cs-next-name">{next.title}</span>
        <Icon name="arrow-right" size={20} className="cs-next-arrow" />
      </TransitionLink>
    </nav>
  )
}
