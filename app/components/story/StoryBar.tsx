import "@/app/styles/story.css"

import { ViewTransition, type CSSProperties } from "react"

import { getProductMark, getWorkPage } from "@/lib/content"
import type { Story } from "@/lib/content/schema"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { AskSlot } from "@/app/components/site/TopBlock"

import { STORY_LABELS } from "./labels"
import { StoryBack } from "./StoryBack"

/**
 * A case study's one header (owner, 16 Nov 2026, "N4"; no site header on a
 * story): "← All work" at the left, Ask at the right. It lies over the
 * cover, in the plate; once the cover's big name has gone under it, it
 * stays at the top on the paper ground, its label becomes the project's
 * name, its arrow turns up and it leads to the top of the page (owner, 16
 * Nov 2026: "the latter should link to top of the page"), `StoryBack`.
 *
 * Its row is the site header's row (`.site-top`, `app/styles/site.css`):
 * the same top, the same height, the same type, and up to 1100px the same
 * column, so going from any page to a story on a phone or a tablet (owner,
 * 16 Nov 2026: "header position height is not the same across
 * homepage+case study page") neither end moves. Its ends line up like the
 * site header's: the arrow's tip on the row's edge, as Ask's edge is on
 * the other side, the link's target reaching into the gutter. Wider, where
 * the story has its wide frame, the row is that frame (`story.css`), so the
 * ends sit on the cover's edges and travel sideways there. The left end is
 * the top block's shared element (`site-name`), the right end the Ask
 * button's (`site-ask`).
 *
 * Past the cover the name comes with the product's tile (owner, 16 Nov
 * 2026: "on scroll, instead of just name, morph logo + name in that
 * header"): the cover's tile, the same `ProductTile`, drawn here at 20px.
 * It is rendered on the server with the rest of the row, so it takes its
 * place before anything scrolls.
 */
export function StoryBar({ story }: { story: Story }) {
  const all = getWorkPage().seo.title
  const mark = getProductMark(story.slug)
  return (
    <div
      className="cs-bar"
      data-cs-bar=""
      // The story's plate, a colour from content: the bar's ground on the
      // cover.
      style={{ "--cs-plate": story.panel.plate } as CSSProperties}
    >
      <header id="top" className="site-top cs-bar-row">
        <ViewTransition name="site-name" share="vt-travel" default="none">
          <div className="site-top__id cs-bar-id" data-top-id="">
            <div className="site-top__namewrap">
              <StoryBack
                key={story.slug}
                all={all}
                title={story.title}
                tile={
                  mark ? (
                    <ProductTile mark={mark} className="cs-back-tile" />
                  ) : undefined
                }
                toTop={STORY_LABELS.toTop.replaceAll("{name}", story.title)}
              />
            </div>
          </div>
        </ViewTransition>
        <AskSlot />
      </header>
    </div>
  )
}
