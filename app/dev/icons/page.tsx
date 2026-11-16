import type { CSSProperties, ReactNode } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import "../../styles/ask.css"
import "../../styles/site.css"
import "../../styles/landing.css"
import "../../styles/story.css"

import { AskFace } from "@/app/components/ask/AskFace"
import { ProjectActions } from "@/app/components/landing/ProjectActions"
import { Button } from "@/app/components/primitives/Button"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import {
  Icon,
  ICON_NAMES,
  type IconName,
} from "@/app/components/primitives/Icon"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

/**
 * Specimen sheet for the icon set (`app/components/primitives/Icon.tsx`),
 * the page the owner judges the set on: every icon at 12, 16, 20 and 24px,
 * on the paper and on the footer's night, at rest, held in its hover state
 * (`data-ico-hold`) and live (hover the cells), the toggles in both states,
 * and each icon once inside its real control.
 *
 * Development only, like /dev/diagrams: a 404 in a production build, not in
 * the sitemap, and robots.txt disallows `/dev/`.
 */

export const metadata: Metadata = {
  title: "Icons (dev)",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

const SIZES = [12, 16, 20, 24] as const
const TOGGLES: IconName[] = [
  "plus-close",
  "plus-minus",
  "arrow-down-up",
  "play-pause",
  "copy-check",
]

const label: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "inherit",
  opacity: 0.6,
}

function Cell({
  name,
  size,
  on,
  hold,
}: {
  name: IconName
  size: number
  on?: boolean
  hold?: boolean
}) {
  return (
    <span
      data-ico-host=""
      data-ico-hold={hold ? "" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
      }}
    >
      <Icon name={name} size={size} on={on} />
    </span>
  )
}

function Grid({ night }: { night?: boolean }) {
  const ground: CSSProperties = night
    ? {
        background: "var(--color-night)",
        color: "var(--color-night-ink)",
      }
    : { background: "var(--color-paper)", color: "var(--color-ink)" }
  return (
    <section
      data-ground={night ? "night" : "paper"}
      style={{ ...ground, padding: 32, borderRadius: 12 }}
    >
      <p style={label}>
        {night ? "On the night" : "On the paper"}: 12, 16, 20, 24 at rest · 24
        held in hover · 24 live (hover it)
      </p>
      <table style={{ borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          {ICON_NAMES.map((name) => (
            <tr key={name} data-specimen={name}>
              <td style={{ ...label, paddingRight: 24, whiteSpace: "nowrap" }}>
                {name}
              </td>
              {SIZES.map((size) => (
                <td key={size}>
                  <Cell name={name} size={size} />
                </td>
              ))}
              <td style={{ paddingLeft: 16 }}>
                <Cell name={name} size={24} hold />
              </td>
              <td>
                <Cell name={name} size={24} />
              </td>
              {TOGGLES.includes(name) ? (
                <>
                  <td style={{ ...label, paddingLeft: 16 }}>on</td>
                  <td>
                    <Cell name={name} size={24} on />
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Control({
  title,
  children,
  wide,
}: {
  title: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <figure
      style={{
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: wide ? "stretch" : "flex-start",
      }}
    >
      <figcaption style={label}>{title}</figcaption>
      {children}
    </figure>
  )
}

export default function IconSpecimen() {
  if (process.env.NODE_ENV === "production") notFound()
  return (
    <main
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 48,
        background: "var(--color-paper)",
        color: "var(--color-ink)",
      }}
    >
      <h1 style={label}>Icons</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <Grid />
        <Grid night />
      </div>

      <section
        data-ground="controls"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 40,
        }}
      >
        <Control title="Header back">
          <span className="site-top__namewrap" style={{ margin: 0 }}>
            <TransitionLink href="/" className="site-top__name" data-back="">
              <Icon name="arrow-left" className="site-top__arrow" />
              <span>Mladen Ružičić</span>
            </TransitionLink>
          </span>
        </Control>
        <Control title="Case study and Website">
          <ProjectActions
            links={{
              caseStudy: {
                href: "/work/tenderlift",
                label: "Case study",
                name: "TenderLift case study",
                rowName: "TenderLift, case study",
              },
              website: {
                href: "https://tenderlift.ch",
                label: "Website",
                domain: "tenderlift.ch",
                name: "TenderLift website, tenderlift.ch, opens in a new tab",
                rowName: "TenderLift, website, opens in a new tab",
              },
            }}
            className="lk-pop-acts"
            linkClassName="lk-pop-link"
          />
        </Control>
        <Control title="An outgoing link">
          <ExternalLink href="https://github.com/ruzicic">GitHub</ExternalLink>
        </Control>
        <Control title="Ask, closed and open">
          <div style={{ display: "flex", gap: 12 }}>
            <Button effect="cells" className="ask-btn" aria-label="Ask">
              <AskFace label="Ask" closeLabel="Close" />
            </Button>
            <Button
              effect="cells"
              className="ask-btn"
              data-on=""
              aria-label="Close"
            >
              <AskFace label="Ask" closeLabel="Close" />
            </Button>
          </div>
        </Control>
        <Control title="Close">
          <Button size="icon" aria-label="Close">
            <Icon name="close" size={16} />
          </Button>
        </Control>
        <Control title="Carousel">
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="icon" aria-label="Previous">
              <Icon name="arrow-left" size={16} />
            </Button>
            <Button size="icon" aria-label="Next">
              <Icon name="arrow-right" size={16} />
            </Button>
          </div>
        </Control>
        <Control title="Play and pause">
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="icon" aria-label="Play">
              <Icon name="play-pause" size={16} />
            </Button>
            <Button size="icon" aria-label="Pause">
              <Icon name="play-pause" size={16} on />
            </Button>
          </div>
        </Control>
        <Control title="Show all, collapsed and expanded">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button size="compact" aria-expanded={false}>
              Show all 16
              <Icon name="arrow-down-up" />
            </Button>
            <Button size="compact" aria-expanded>
              Show fewer
              <Icon name="arrow-down-up" />
            </Button>
          </div>
        </Control>
        <Control title="Roles accordion" wide>
          <ol className="cs-roles" style={{ width: "100%", maxWidth: 360 }}>
            {[false, true].map((open) => (
              <li key={String(open)} className="cs-role">
                <details open={open}>
                  <summary className="cs-role-sum">
                    <span className="cs-role-head">
                      <span className="cs-role-dates">Jan to Jun 2024</span>
                      <span className="cs-role-title">
                        UI platform engineer
                      </span>
                    </span>
                    <Icon
                      name="plus-minus"
                      size={12}
                      className="cs-role-chev"
                    />
                  </summary>
                  <div className="cs-role-body">
                    <p className="cs-role-text">What happened.</p>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </Control>
        <Control title="Download my CV">
          <Button as="a" href="/cv.pdf" download="">
            <Icon name="download" size={16} />
            <span>Download my CV</span>
          </Button>
        </Control>
        <Control title="Copy, then copied">
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="compact">
              <Icon name="copy-check" size={16} />
              Copy
            </Button>
            <Button size="compact">
              <Icon name="copy-check" size={16} on />
              Copied
            </Button>
          </div>
        </Control>
      </section>
    </main>
  )
}
