import "@/app/styles/work.css"

import { getImageProps } from "next/image"

import {
  getBuiltList,
  getMedia,
  getProduct,
  getProductMark,
  getProjectLinks,
} from "@/lib/content"
import type { ListRow, ProjectLinks } from "@/lib/content/schema"
import { Container } from "@/app/components/primitives/Container"
import { Icon } from "@/app/components/primitives/Icon"
import { IslandBoundary } from "@/app/components/primitives/IslandBoundary"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { LedgerPreview } from "./LedgerPreview"
import { LedgerToggle } from "./LedgerToggle"
import {
  CARD_VISIBLE,
  CARD_W,
  type PreviewItem,
  type PreviewShot,
} from "./preview-types"

export interface LedgerProps {
  /**
   * `false` (default, the landing): each group shows the board's first rows
   * and the rest open in place under "Show all". Without JavaScript the
   * list is complete anyway.
   * `true` (`/work`): every row, no toggle, each `<li>` carries its product
   * slug as `id` so `/work#<slug>` lands on it.
   */
  complete?: boolean
  /**
   * The id of a heading outside the list that names it (`/work` uses the
   * page's `<h1>`). Given, the list renders no `<h2>` of its own and its
   * group headings move up a level.
   */
  labelledBy?: string
}

function shot(src: string, stop = 1): PreviewShot | undefined {
  const media = getMedia(src)
  if (!media) return undefined
  const height = Math.round(((CARD_W * media.height) / media.width) * 100) / 100
  const { props } = getImageProps({
    src,
    width: CARD_W,
    height: Math.round(height),
    alt: "",
  })
  return {
    src: props.src,
    srcSet: props.srcSet,
    height,
    end: Math.max(0, Math.round((height * stop - CARD_VISIBLE) * 10) / 10),
  }
}

function previewFor(row: ListRow): PreviewItem {
  const product = getProduct(row.ref)
  const mark = getProductMark(row.ref)
  const bg = product?.bg ?? "#111111"
  const fg = product?.fg ?? "#FCFCFA"
  const p = row.preview

  let still: PreviewShot | undefined
  let capture: PreviewShot | undefined
  if (p.image && p.scroll) {
    capture = shot(p.image, p.stopAt ?? 1)
    // The still is the desktop screenshot beside the capture, where one exists.
    still = shot(`/static/work/${row.ref}/1440x1000.webp`) ?? capture
    if (still === capture) capture = undefined
  } else if (p.image) {
    still = shot(p.image)
  }

  const letters =
    p.letters ?? (mark?.mark.kind === "letters" ? mark.mark.text : undefined)
  const tone: PreviewItem["tone"] = still
    ? "image"
    : letters
      ? "letters"
      : "mark"

  return {
    slug: row.ref,
    caption: p.caption,
    tone,
    bg,
    fg,
    mark: letters
      ? { kind: "letters", text: letters }
      : mark?.mark.kind === "art"
        ? { kind: "art", src: mark.mark.src }
        : (mark?.mark ?? { kind: "letters", text: row.name.slice(0, 1) }),
    still,
    capture,
  }
}

/**
 * A row's explicit actions (owner, 13 Nov 2026: "explicit actions only"),
 * on `/` and `/work` alike: "Case study" and the right arrow for its page
 * here, the bare domain and the up-right arrow for its own site (the
 * `Icon` set), both from the product
 * (`getProjectLinks`), each with an accessible name of its own ("TenderLift
 * case study", "TenderLift website, tenderlift.ch, opens in a new tab").
 * One type style for both (owner, 16 Nov 2026: "use the same (as case
 * study). less variations"): mono capitals in the ink, so the domain reads
 * "TENDERLIFT.CH" (`.ledger-to` in work.css).
 * Where the device hovers they fade in on hover and focus; on touch they
 * are always shown (`work.css`). No actions, nothing rendered.
 */
function RowActions({ caseStudy, website }: ProjectLinks) {
  if (!caseStudy && !website) return null
  return (
    <span className="ledger-to">
      {caseStudy ? (
        <TransitionLink
          className="ledger-dest"
          href={caseStudy.href}
          aria-label={caseStudy.name}
        >
          {caseStudy.label}
          <Icon name="arrow-right" className="ledger-dest-ico" />
        </TransitionLink>
      ) : null}
      {website ? (
        <a
          className="ledger-dest"
          href={website.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={website.name}
          data-track={website.track}
        >
          {website.domain}
          <Icon name="arrow-up-right" className="ledger-dest-ico" />
        </a>
      ) : null}
    </span>
  )
}

/**
 * On phones the row itself is the link (owner, 16 Nov 2026: "make all row
 * items clickable entirely. hide case study/website links - the whole row
 * is clickable. this way its more accessible on mobile"): to the case study
 * where there is one (its website is on the story's cover), else to the
 * website in a new tab. One real link per row, stretched over it by CSS
 * (`.ledger-go` in work.css), so nothing is nested in it; its name says the
 * project and where it goes ("TenderLift, case study"), and its only
 * content is the arrow at the row's end: the right arrow for a page here,
 * the up-right one for another site. Shown only at the phone breakpoint,
 * where the two actions are hidden; elsewhere it is `display: none`, so
 * neither size has a second tab stop. A row with neither stays plain.
 */
function RowLink({ caseStudy, website }: ProjectLinks) {
  if (caseStudy)
    return (
      <TransitionLink
        className="ledger-go"
        href={caseStudy.href}
        aria-label={caseStudy.rowName}
      >
        <Icon name="arrow-right" className="ledger-go-ico" />
      </TransitionLink>
    )
  if (website)
    return (
      <a
        className="ledger-go"
        href={website.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={website.rowName}
        data-track={website.track}
      >
        <Icon name="arrow-up-right" className="ledger-go-ico" />
      </a>
    )
  return null
}

/**
 * One row, on `/` and `/work` alike (owner, 13 and 14 Nov 2026,
 * `CopyE.dc.html` E2 option c): the year as a small label above the name
 * (no label when content has no year), the description in the wide column
 * beside it, and where the row goes, in words: "Case study →" for a story
 * here, the bare domain and "↗" for the project's own site. No arrow after
 * the name. On desktop the words sit above the description, clear of the
 * hover preview card.
 *
 * On desktop those words (`RowActions`) are the row's only links; the name
 * and the row are not links. On phones the row is one link instead
 * (`RowLink`) and the words are hidden (`work.css`). On `/work`
 * (`complete`) each `<li>` carries its product slug as `id`, so
 * `/work#<slug>` lands on it.
 */
function Row({
  row,
  index,
  complete,
}: {
  row: ListRow
  index: number
  complete: boolean
}) {
  const mark = getProductMark(row.ref)
  const year = row.year ?? getProduct(row.ref)?.year
  const links = getProjectLinks(row.ref, row.name)

  return (
    <li className="ledger-item" id={complete ? row.ref : undefined}>
      <div
        className="ledger-row"
        data-pv-row={index}
        data-go={links.caseStudy || links.website ? "" : undefined}
      >
        {year ? <span className="ledger-when">{year}</span> : null}
        <span className="ledger-name">
          {mark ? <ProductTile mark={mark} className="ledger-tile" /> : null}
          <span>{row.name}</span>
        </span>
        <span className="ledger-what">{row.what}</span>
        <RowActions {...links} />
        <RowLink {...links} />
      </div>
    </li>
  )
}

/**
 * The list of what he built and what happened to it (`Landing.dc.html`
 * `#everything`), shared by `/` and `/work`.
 *
 * Server-rendered rows grouped as content groups them (PRODUCTS, JOBS), the
 * same `Row` on both pages (year above the name, its two links in words on
 * hover). The row's only links are its actions (`RowActions`), from the
 * product, so the two pages cannot disagree about where a project goes.
 *
 * Two small islands: `LedgerPreview` (the pointer-carried card on desktop,
 * docked beside a keyboard-focused row) and, on the landing, `LedgerToggle`
 * (Show all / Show fewer). Rows past the board's cut collapse only when
 * scripting is enabled (`@media (scripting: enabled)`), so without
 * JavaScript the list is complete.
 */
export function Ledger({ complete = false, labelledBy }: LedgerProps) {
  const list = getBuiltList()
  const titleId = labelledBy ?? "everything-title"
  const Group = labelledBy ? "h2" : "h3"

  let index = 0
  const items: PreviewItem[] = []
  const groups = list.groups.map((group, g) => {
    const rows = group.rows.map((row) => {
      items.push(previewFor(row))
      return { row, index: index++ }
    })
    const cut = complete ? rows.length : group.visible
    return {
      label: group.label,
      first: rows.slice(0, cut),
      rest: rows.slice(cut),
      restId: `everything-more-${g}`,
    }
  })
  const controls = groups
    .filter((g) => g.rest.length > 0)
    .map((g) => g.restId)
    .join(" ")

  const renderRow = ({ row, index: i }: { row: ListRow; index: number }) => (
    <Row key={row.ref} row={row} index={i} complete={complete} />
  )

  const rows = (
    <>
      {groups.map((group) => (
        <div key={group.label} className="ledger-group">
          <Group className="ledger-label">{group.label}</Group>
          <ul className="ledger-rows">{group.first.map(renderRow)}</ul>
          {group.rest.length > 0 ? (
            <div className="ledger-more">
              <ul id={group.restId} className="ledger-rows">
                {group.rest.map(renderRow)}
              </ul>
            </div>
          ) : null}
        </div>
      ))}
    </>
  )

  return (
    <section
      id={list.id}
      aria-labelledby={titleId}
      className="ledger"
      data-ledger=""
      data-complete={complete ? "" : undefined}
    >
      <Container>
        {labelledBy ? null : (
          <h2 id={titleId} className="ledger-title">
            {list.title}
          </h2>
        )}

        {/* If the preview island fails, the rows stay: a plain list of links,
            as without JavaScript. */}
        <IslandBoundary fallback={rows}>
          <LedgerPreview items={items} scrollingTag={list.scrollingTag}>
            {rows}
          </LedgerPreview>
        </IslandBoundary>

        <div className="ledger-foot">
          {controls ? (
            <LedgerToggle
              showAll={list.showAllLabel}
              showFewer={list.showFewerLabel}
              controls={controls}
            />
          ) : null}
        </div>
      </Container>
    </section>
  )
}
