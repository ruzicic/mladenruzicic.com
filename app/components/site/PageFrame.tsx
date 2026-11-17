import type { ReactNode } from "react"

import { getAbout, getMentoring } from "@/lib/content"

import "../../styles/site.css"

import { PageTransition } from "../primitives/PageTransition"
import { PageMain } from "./PageMain"
import { SiteFooter } from "./SiteFooter"
import { TopBlock } from "./TopBlock"

/** Pages whose top-block line comes from their content (`section`). */
export type FramePage = "mentoring" | "about"

export interface PageFrameProps {
  children: ReactNode
  /**
   * `mentoring` or `about`: the label under the name (`section`) comes from
   * that page's content, as on the boards. `topLine` still wins when given.
   */
  page?: FramePage
  /** The muted line under the name. Defaults to `getSite().line`. */
  topLine?: string
  /**
   * The landing: the name is the page's identity, not a link home, and the
   * sheet keeps the landing's longer foot (every other page has the boards'
   * shorter one, `app/styles/shell.css`).
   */
  home?: boolean
  /**
   * A header of the page's own in place of the top block: a case study's bar
   * (`StoryBar`, 16 Nov 2026), which lies over the page's cover, so the
   * sheet then starts at the very top (`data-cover`, `app/styles/story.css`).
   */
  bar?: ReactNode
  /**
   * `sheet`: the page sets its own measure (`--sheet-w`, in its area CSS)
   * and the top block, the page and the footer all take it instead of the
   * text column, wider than 820px (`app/styles/shell.css`). The CV, whose
   * screen page is its A4 sheet enlarged (17 Nov 2026).
   */
  measure?: "sheet"
  /**
   * The top row's two ends in place of the name and Ask (`TopBlock`): the
   * CV's close control and its Download PDF (17 Nov 2026).
   */
  start?: ReactNode
  end?: ReactNode
  /**
   * `false`: no site footer; the page ends with its own sheet, on paper to
   * the bottom (the CV: "everything below this is actually my cv").
   */
  footer?: boolean
}

/**
 * The structure every board shares, in one place: the paper sheet (top block,
 * then `<main>`) over the dark footer, the same footer on every page. Pages render through this; the root
 * layout only provides `<html>`, `<body>`, the skip link and analytics.
 *
 * `<main id="main" tabIndex={-1}>` lives here so the skip link lands on the
 * page content and the header and footer stay outside the main landmark.
 * `tabIndex={-1}` makes the skip link move focus (and a screen reader's
 * cursor); `:focus-visible` keeps a programmatic focus from painting a ring.
 *
 * The page body is wrapped in `PageTransition`, so the chrome stays put while
 * the content crossfades between routes. `PageMain` (the `<main>` itself)
 * starts focus over at the top after a client navigation.
 */
export function PageFrame({
  children,
  page,
  topLine,
  home = false,
  bar,
  measure,
  start,
  end,
  footer = true,
}: PageFrameProps) {
  const line =
    topLine ??
    (page === "mentoring"
      ? getMentoring().section
      : page === "about"
        ? getAbout().section
        : undefined)

  return (
    <div
      data-page-frame=""
      data-measure={measure}
      data-footer={footer ? undefined : "none"}
    >
      <div
        data-page-sheet=""
        data-home={home ? "" : undefined}
        data-cover={bar ? "" : undefined}
      >
        {bar ?? <TopBlock line={line} home={home} start={start} end={end} />}
        <PageMain>
          <PageTransition>
            <div className="flex flex-col">{children}</div>
          </PageTransition>
        </PageMain>
      </div>
      {footer ? <SiteFooter /> : null}
    </div>
  )
}
