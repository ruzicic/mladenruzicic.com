import type { ReactNode } from "react"

import "@/app/styles/about.css"

import { linkEvent } from "@/lib/analytics"
import { getAbout, getProductMark } from "@/lib/content"
import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { ProductTile } from "@/app/components/primitives/ProductTile"

/**
 * The CV (`Landing-About.dc.html` `#ab-cv`): one entry per employer, newest
 * first, as an ordered list, at every width the same (owner, 15 Nov 2026:
 * role names, no third column): the years above, then the tile, the company
 * and its role (the entry's heading), then the description. Years are
 * `<time>` elements; "now" stays a word.
 *
 * Under the list, the download button (a link) to `/cv.pdf`.
 */
export function AboutCV() {
  const { cv } = getAbout()

  return (
    <section aria-labelledby="ab-cv" className="ab-col ab-sec">
      <h2 id="ab-cv" className="ab-h2">
        {cv.title}
      </h2>
      <ol className="ab-rules">
        {cv.rows.map((row) => {
          const mark = getProductMark(row.ref)
          if (!mark) throw new Error(`about cv: no product "${row.ref}"`)
          return (
            <li key={row.ref} className="ab-cv">
              <span className="ab-cv__years">
                <Years text={row.year} />
              </span>
              <h3 className="ab-cv__line">
                <span className="ab-cv__name">
                  <ProductTile mark={mark} />
                  {mark.name}
                </span>{" "}
                <span className="ab-cv__role">{row.role}</span>
              </h3>
              <p className="ab-cv__text">{row.text}</p>
            </li>
          )
        })}
      </ol>
      <div className="ab-cv__foot">
        <Button
          as="a"
          href={cv.download.href}
          download=""
          data-track={linkEvent(cv.download.href)}
        >
          <Icon name="download" size={16} />
          <span>{cv.download.label}</span>
        </Button>
      </div>
    </section>
  )
}

/** "2021 to 2023" with each year in a `<time>`; anything else verbatim. */
function Years({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(/(\b\d{4}\b)/).map((part, i) =>
    /^\d{4}$/.test(part) ? (
      <time key={i} dateTime={part}>
        {part}
      </time>
    ) : (
      part
    )
  )
  return <>{parts}</>
}
