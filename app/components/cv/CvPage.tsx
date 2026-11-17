import { Fragment, type ReactNode } from "react"
import Image from "next/image"

// The column and the page title are About's (`.ab-col`, `.ab-h1`).
import "@/app/styles/about.css"
import "@/app/styles/cv.css"

import { linkEvent } from "@/lib/analytics"
import { getCv, getMedia, getSite } from "@/lib/content"
import type { CvEntry, CvJob } from "@/lib/content/schema"
import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"

import { CloseCv } from "./CloseCv"

/**
 * `/cv`, and through its print stylesheet (`app/styles/cv.css`, `@media
 * print`) the PDF at `/cv.pdf` (`scripts/cv-pdf.ts`): one markup for both.
 * Owner, 17 Nov 2026: Geist Serif for the name and the section headings,
 * one ink, one muted grey, one weight change; no rules, icons, italics or
 * capitals in the CV itself.
 *
 * Reading order is the order a text extractor (an applicant-tracking
 * parser) needs: the name, the contact line, the summary; each title line
 * before its date, the date in the same row; bullets as real list items.
 * Everything comes from `getCv()` (`content/pages/cv.ts`).
 *
 * The page's two controls are in the top row (`CvClose`, `CvDownload`,
 * through `PageFrame start`/`end`): the CV itself has none.
 *
 * The portrait sits at the top, so it loads eagerly at low priority, as
 * About's does: not the page's largest paint.
 */
/** The top row's right end, where Ask is elsewhere: the PDF, saved under his name. */
export function CvDownload() {
  const cv = getCv()
  return (
    <Button
      as="a"
      href={cv.download.href}
      download={getSite().links.cvFilename}
      data-track={linkEvent(cv.download.href)}
    >
      <Icon name="download" size={16} />
      <span>{cv.download.label}</span>
    </Button>
  )
}

/** The top row's left end: close the CV. */
export function CvClose() {
  const { close } = getCv()
  return <CloseCv label={close.label} href={close.href} />
}

export function CvPage() {
  const cv = getCv()
  const media = getMedia(cv.headshot.src)

  return (
    <article className="ab-col cv" data-cv="">
      <header className="cv-head">
        <h1 className="ab-h1 cv-name">{cv.name}</h1>
        {media ? (
          <Image
            src={cv.headshot.src}
            alt={cv.headshot.alt}
            width={media.width}
            height={media.height}
            sizes="(max-width: 820px) 128px, 140px"
            loading="eager"
            fetchPriority="low"
            placeholder="blur"
            blurDataURL={media.blurDataURL}
            className="cv-photo"
          />
        ) : null}
        <p className="cv-headline">
          <span className="cv-headline__role">{cv.headline.role}</span>
          <span className="cv-headline__place">{cv.headline.location}</span>
        </p>
        <p className="cv-contact">
          {cv.contact.map((c, i) => (
            <Fragment key={c.href}>
              {i > 0 ? " · " : null}
              <a href={c.href} data-track={linkEvent(c.href)}>
                {c.text}
              </a>
            </Fragment>
          ))}
        </p>
        <div className="cv-summary">
          {cv.summary.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </header>

      <section className="cv-sec" aria-labelledby="cv-experience">
        <h2 id="cv-experience" className="cv-h2">
          {cv.experience.title}
        </h2>
        {cv.experience.jobs.map((job) => (
          <Job key={job.ref} job={job} />
        ))}
      </section>

      <section className="cv-sec" aria-labelledby="cv-projects">
        <h2 id="cv-projects" className="cv-h2">
          {cv.projects.title}
        </h2>
        {cv.projects.items.map((item) => (
          <Entry key={item.name} item={item} />
        ))}
      </section>

      <section className="cv-sec" aria-labelledby="cv-mentoring">
        <h2 id="cv-mentoring" className="cv-h2">
          {cv.mentoring.title}
        </h2>
        {cv.mentoring.items.map((item) => (
          <Entry key={item.name} item={item} />
        ))}
      </section>

      <section className="cv-sec" aria-labelledby="cv-skills">
        <h2 id="cv-skills" className="cv-h2">
          {cv.skills.title}
        </h2>
        <p className="cv-skills">{cv.skills.items.join(" · ")}</p>
      </section>
    </article>
  )
}

/**
 * Every line that carries a date is one row (owner, 17 Nov 2026): the title
 * at the left at the title weight, the date at the right end in the muted
 * mono, one column of dates down the page. Title first in the DOM, so a
 * text extractor reads "Shopify · Senior Software Engineer Apr 2021 to May
 * 2023". Where the two do not fit on one line, the date drops under the
 * title, whole.
 */
function Row({
  as: Heading,
  dates,
  children,
}: {
  as: "h3" | "h4"
  dates: string
  children: ReactNode
}) {
  return (
    <div className="cv-row">
      <Heading className="cv-title">{children}</Heading>
      <p className="cv-date">{dates}</p>
    </div>
  )
}

/**
 * A job: "Company · Role" and its dates, then its bullets. A job with
 * several roles (ZF) has the company and its dates, the progression line,
 * then its roles as a small tree (owner, 17 Nov 2026: "it should be
 * obvious all those are sub-roles"): a list indented under the company,
 * a spine down its left and a node on each role's title row, drawn by CSS
 * alone (`.cv-roles`), so a text extractor reads nothing extra.
 */
/**
 * A title's parts ("Shopify", "Senior Software Engineer"), joined by " · ".
 * Each part keeps together where it fits: a narrow screen breaks a title
 * after its dot, never inside "Senior Full Stack Developer". The dot stays
 * with the part before it. `last` is a final part of another weight (a
 * project's domain), after a dot of its weight.
 */
function Parts({ parts, last }: { parts: string[]; last?: ReactNode }) {
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={part}>
          {i > 0 ? " " : null}
          <span className="cv-part">
            {part}
            {i < parts.length - 1 ? " ·" : null}
            {i === parts.length - 1 && last ? (
              <span className="cv-title__link"> ·</span>
            ) : null}
          </span>
        </Fragment>
      ))}
      {last ? (
        <>
          {" "}
          <span className="cv-part cv-title__link">{last}</span>
        </>
      ) : null}
    </>
  )
}

function Job({ job }: { job: CvJob }) {
  return (
    <div className={job.roles ? "cv-job cv-job--roles" : "cv-job"}>
      <Row as="h3" dates={job.dates}>
        <Parts parts={job.role ? [job.company, job.role] : [job.company]} />
      </Row>
      {job.line ? <p className="cv-line">{job.line}</p> : null}
      {job.bullets ? <Bullets items={job.bullets} /> : null}
      {job.roles ? (
        <ul className="cv-roles">
          {job.roles.map((role) => (
            <li key={role.title} className="cv-role">
              <Row as="h4" dates={role.dates}>
                <Parts parts={[role.title]} />
              </Row>
              <Bullets items={role.bullets} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="cv-list">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  )
}

/**
 * A project, or the mentoring entry: "Name · Role · domain" (the name and
 * role at the title weight, the domain a regular link to the site) and the
 * dates at the right, then its sentence.
 */
function Entry({ item }: { item: CvEntry }) {
  return (
    <div className="cv-entry">
      <Row as="h3" dates={item.dates}>
        <Parts
          parts={[item.name, item.role].filter((p): p is string => !!p)}
          last={
            <a href={item.href} data-track={linkEvent(item.href)}>
              {item.domain}
            </a>
          }
        />
      </Row>
      <p className="cv-text">{item.text}</p>
    </div>
  )
}
