import "@/app/styles/story.css"

import type { CSSProperties } from "react"

import type { Story } from "@/lib/content/schema"

import { StoryColumn } from "./StoryColumn"
import { StoryCover } from "./StoryCover"
import { StoryNext } from "./StoryNext"
import { StoryPanel } from "./StoryPanel"

/**
 * One case study (CaseStudy.dc.html and CaseStudy-Mobile.dc.html, 12 Nov
 * 2026; the owner: "the left part fixed, with text, 3 to 4 paragraphs at
 * most, plus highlight numbers; the right part has photos that are all the
 * same square and it scrolls"), opened by a cover (16 Nov 2026, the board's
 * "A · Plate": "each page is fully branded for that case study").
 *
 * First the cover (`StoryCover`): the first screen in the story's plate,
 * with the name and the numbers; the bar (`StoryBar`, rendered by the page
 * through `PageFrame`) lies over its top. The first square comes up over
 * the cover's foot, at the right beside the numbers on the wide page, under
 * them in one column.
 *
 * Then, on the paper: on the wide page (1316px at 1440) the pinned panel
 * (468px) and the column of 752px squares, 40px apart, then the next story
 * across both. Below 1100px one column: the first square, the panel's
 * content, then the other squares.
 *
 * The long story in the `.mdx` body is not shown here; it feeds the markdown
 * mirror, `/llms-full.txt`, `/mcp` and the Ask context.
 */
export function StoryPage({ story }: { story: Story }) {
  return (
    <article
      className="cs"
      data-story={story.slug}
      // The story's plate, a colour from content.
      style={{ "--cs-plate": story.panel.plate } as CSSProperties}
    >
      <StoryCover story={story} />
      <div className="cs-body">
        <div className="cs-cols">
          <StoryColumn story={story} part="lead" />
          <StoryPanel story={story} />
          <StoryColumn story={story} part="rest" />
        </div>
        <StoryNext story={story} />
      </div>
    </article>
  )
}
