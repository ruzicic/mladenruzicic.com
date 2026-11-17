import Image from "next/image"

// The column, heading, hairline-list and fact rules are About's.
import "@/app/styles/about.css"
import "@/app/styles/press.css"

import { getMedia, getPress } from "@/lib/content"
import { FactList } from "@/app/components/about/FactList"
import { Icon } from "@/app/components/primitives/Icon"
import { VisuallyHidden } from "@/app/components/primitives/VisuallyHidden"

import { CopyButton } from "./CopyButton"

/**
 * `/press`, made for copying. No board exists, so it uses the About board's
 * language: the text column, a serif `<h1>`, sections under mono labels,
 * hairline lists. Everything comes from `getPress()`.
 *
 * Every block of text is plain, selectable text; the Copy buttons are an
 * enhancement that confirms in place and announces politely.
 */
export function PressIntro() {
  const { title } = getPress()
  return (
    <div className="ab-col pr-intro">
      <h1 className="ab-h1">{title}</h1>
    </div>
  )
}

export function PressBios() {
  const { shortBio, longBio, menu, copy } = getPress()
  return (
    <>
      <section aria-labelledby="pr-short" className="ab-col pr-sec">
        <h2 id="pr-short" className="pr-label">
          {shortBio.label}
        </h2>
        <p id="pr-short-text" className="pr-bio">
          {shortBio.text}
        </p>
        <div className="pr-actions">
          <CopyButton
            target="pr-short-text"
            label={menu.copyLabel}
            copiedLabel={copy.copiedLabel}
            failedLabel={copy.failedLabel}
          />
        </div>
      </section>

      {longBio ? (
        <section aria-labelledby="pr-long" className="ab-col pr-sec">
          <h2 id="pr-long" className="pr-label">
            {longBio.label}
          </h2>
          <p className="pr-bio">{longBio.text}</p>
        </section>
      ) : null}
    </>
  )
}

export function PressOneLiners() {
  const { oneLiners, copy } = getPress()
  return (
    <section aria-labelledby="pr-lines" className="ab-col pr-sec">
      <h2 id="pr-lines" className="pr-label">
        {oneLiners.label}
      </h2>
      <ul className="ab-rules">
        {oneLiners.items.map((line, i) => (
          <li key={line} className="pr-line">
            <p id={`pr-line-${i}`} className="pr-line__text">
              {line}
            </p>
            <CopyButton
              target={`pr-line-${i}`}
              label={copy.label}
              copiedLabel={copy.copiedLabel}
              failedLabel={copy.failedLabel}
              describe
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PressHeadshot() {
  const { headshot, menu } = getPress()
  const media = getMedia(headshot.image.src)
  const files = headshot.variants.map((src) => {
    const m = getMedia(src)
    const raw = src.split(".").pop()?.toLowerCase() ?? ""
    const ext = raw === "webp" ? "WebP" : raw.toUpperCase()
    const filename =
      src === headshot.download.href
        ? headshot.download.filename
        : (src.split("/").pop() ?? src)
    return { src, ext, filename, size: m ? `${m.width} × ${m.height}` : "" }
  })

  return (
    <section aria-labelledby="pr-headshot" className="ab-col pr-sec">
      <h2 id="pr-headshot" className="pr-label">
        {headshot.label}
      </h2>
      <div className="pr-shot">
        {media ? (
          <Image
            src={headshot.image.src}
            alt={headshot.image.alt}
            width={media.width}
            height={media.height}
            sizes="160px"
            placeholder="blur"
            blurDataURL={media.blurDataURL}
            className="pr-shot__img"
          />
        ) : null}
        <div>
          <ul className="pr-files" aria-label={menu.downloadLabel}>
            {files.map((f) => (
              <li key={f.src}>
                <a className="pr-file" href={f.src} download={f.filename}>
                  <Icon name="download" size={16} />
                  <VisuallyHidden>{menu.downloadLabel}, </VisuallyHidden>
                  <span className="pr-file__ext">{f.ext}</span>
                  <span className="pr-file__size">{f.size}</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="pr-terms">{headshot.terms}</p>
        </div>
      </div>
    </section>
  )
}

export function PressFacts() {
  const { facts } = getPress()
  return (
    <section aria-labelledby="pr-facts" className="ab-col pr-sec">
      <h2 id="pr-facts" className="pr-label">
        {facts.label}
      </h2>
      <FactList items={facts.items} />
    </section>
  )
}
