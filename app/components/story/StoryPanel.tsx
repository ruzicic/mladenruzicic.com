import type { CSSProperties } from "react"
import Image from "next/image"

import { getPeopleById } from "@/lib/content"
import type { Story } from "@/lib/content/schema"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { Icon } from "@/app/components/primitives/Icon"

import "../../styles/brand-link.css"

import { STORY_LABELS } from "./labels"
import { StoryProgress } from "./StoryProgress"
import { StoryRoles } from "./StoryRoles"

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * The pinned left half of a case study (CaseStudy.dc.html, `.cs-panel`):
 * three or four paragraphs (or the roles, `StoryRoles`), the links, the
 * people it was made with, and the reading-progress line. The name, the
 * summary, the meta line and the numbers are on the cover (`StoryCover`,
 * 16 Nov 2026), the way back in the bar (`StoryBar`). Everything here is
 * content (`panel` in the story's front matter); the only client code is the
 * progress line, which also keeps a panel taller than the window scrolling
 * with the page (`StoryProgress`).
 */
export function StoryPanel({ story }: { story: Story }) {
  const { panel } = story
  const people = getPeopleById(panel.people ?? [])

  return (
    <aside className="cs-panel" aria-labelledby="cs-title">
      {panel.timeline ? (
        <StoryRoles
          roles={panel.timeline}
          label={STORY_LABELS.roles}
          name={`${story.slug}-roles`}
        />
      ) : (
        <div className="cs-paras">
          {(panel.paragraphs ?? []).map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}

      {panel.links ? (
        <div className="cs-block" data-block="links">
          <p className="cs-block-h" id="cs-links">
            {panel.links.heading}
          </p>
          <ul className="cs-links" aria-labelledby="cs-links">
            {panel.links.items.map((l) => (
              <li key={l.href} className="cs-link">
                {/* The favicon inside the link, so the branded wash covers
                    both; `--brand` is the favicon's colour (`color`). The
                    link is inline, so a wrapped title is washed line by
                    line and the arrow (passed in here, not the primitive's)
                    follows the last word. */}
                <ExternalLink
                  href={l.href}
                  className="cs-link-a blk"
                  lang={l.lang}
                  hideArrow
                  style={{ "--brand": l.color } as CSSProperties}
                >
                  {/* A 32px favicon drawn at 16: nothing for next/image to do. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={l.icon}
                    alt=""
                    width={16}
                    height={16}
                    className="cs-link-icon"
                    loading="lazy"
                    decoding="async"
                  />
                  <LinkTitle title={l.title} />
                </ExternalLink>
                {l.place ? (
                  <span className="cs-link-place">{l.place}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {people.length > 0 ? (
        <div className="cs-block">
          <p className="cs-block-h" id="cs-people">
            {STORY_LABELS.people}
          </p>
          <ul className="cs-people" aria-labelledby="cs-people">
            {people.map((p) => (
              <li key={p.id} className="cs-person">
                {p.avatar ? (
                  <Image
                    src={p.avatar}
                    alt=""
                    width={28}
                    height={28}
                    className="cs-person-img"
                  />
                ) : (
                  <span className="cs-person-img" aria-hidden="true">
                    {initials(p.name)}
                  </span>
                )}
                {p.linkedin ? (
                  <ExternalLink href={p.linkedin} className="cs-link-a">
                    {p.name}
                  </ExternalLink>
                ) : (
                  <span>{p.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <StoryProgress labels={story.column.map((item) => item.short ?? "")} />
    </aside>
  )
}

/**
 * A case-study link's title with its arrow: the last word and the arrow are
 * kept together (`white-space: nowrap`), so the arrow never starts a line on
 * its own, and the underline stops before the arrow.
 */
function LinkTitle({ title }: { title: string }) {
  const at = title.lastIndexOf(" ")
  const head = at < 0 ? "" : title.slice(0, at + 1)
  const last = at < 0 ? title : title.slice(at + 1)
  return (
    <>
      {head ? <span className="blk-w">{head}</span> : null}
      <span className="cs-link-end">
        <span className="blk-w">{last}</span>
        <Icon name="arrow-up-right" className="cs-link-arrow" />
      </span>
    </>
  )
}
