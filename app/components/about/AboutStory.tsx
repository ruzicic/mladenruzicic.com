import { Fragment, type CSSProperties } from "react"
import Image from "next/image"

import "@/app/styles/about.css"
import "@/app/styles/brand-link.css"

import { getAbout, getMedia, getProductMark } from "@/lib/content"
import type { RichText } from "@/lib/content/schema"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { mapRich } from "@/app/components/primitives/rich-text"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { AboutEarly } from "./AboutEarly"

/**
 * The top of `/about` (`Landing-About.dc.html`): the 96px portrait, the page's
 * one `<h1>` ("The longer story.") and the story's paragraphs, with the
 * product tiles as links into their stories, and the early projects'
 * carousel after the paragraph that ends on the early line (`early.after`,
 * owner, 15 Nov 2026: layout B). Bracketed text such as `[YEAR]` is the
 * board's own placeholder and renders as written.
 *
 * The portrait is 96px and sits above the fold, so it loads eagerly; it is
 * not the page's largest paint (the heading and the paragraphs are), so it is
 * not preloaded.
 */
export function AboutStory() {
  const { headshot, title, paragraphs, early } = getAbout()
  const media = getMedia(headshot.src)

  return (
    <div className="ab-col ab-intro">
      {media ? (
        <Image
          src={headshot.src}
          alt={headshot.alt}
          width={media.width}
          height={media.height}
          sizes="96px"
          loading="eager"
          placeholder="blur"
          blurDataURL={media.blurDataURL}
          className="ab-portrait"
        />
      ) : null}
      <h1 className="ab-h1">{title}</h1>
      {paragraphs.map((p, i) => (
        <Fragment key={i}>
          {i === early.after ? <AboutEarly /> : null}
          <p className="ab-para">
            <Rich text={p} />
          </p>
        </Fragment>
      ))}
    </div>
  )
}

/** Words, links, and products as tile + underlined name. */
function Rich({ text }: { text: RichText }) {
  return (
    <>
      {mapRich(text, (seg, i) => {
        if (seg.kind === "text") return seg.text
        if (seg.kind === "link") {
          return seg.external ? (
            <ExternalLink
              key={i}
              href={seg.href}
              rel={seg.me ? "me" : undefined}
            >
              {seg.text}
            </ExternalLink>
          ) : seg.href.startsWith("/") ? (
            <TransitionLink key={i} href={seg.href}>
              {seg.text}
            </TransitionLink>
          ) : (
            // `mailto:`: the site's ordinary inline link (the base styles
            // underline a classless link in running text).
            <a key={i} href={seg.href}>
              {seg.text}
            </a>
          )
        }
        const mark = getProductMark(seg.ref)
        if (!mark) throw new Error(`about: no product "${seg.ref}"`)
        const face = (
          <>
            <ProductTile mark={mark} />
            <span className="blk-w">{seg.text}</span>
          </>
        )
        return seg.href ? (
          <TransitionLink
            key={i}
            href={seg.href}
            className="ab-lk blk"
            style={{ "--brand": mark.brand } as CSSProperties}
          >
            {face}
          </TransitionLink>
        ) : (
          <span key={i} className="whitespace-nowrap">
            <ProductTile mark={mark} />
            {seg.text}
          </span>
        )
      })}
    </>
  )
}
