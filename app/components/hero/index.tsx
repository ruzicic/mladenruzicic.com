import { Fragment, type ReactNode } from "react"

import { ACCENT } from "@/lib/color"
import { getCompanies, getHeroLogos, getHome } from "@/lib/content"
import type { CompanyId } from "@/lib/content/schema"

/*
 * Direct module paths, not the `../primitives` barrel: the barrel also
 * re-exports `Dialog` and `Popover`, and Next collects every `"use client"`
 * module reachable from a page's server graph into that page's client bundle.
 * Importing it here put the dialog chunk on the homepage, which never opens
 * one — see the note in `tests/budgets.spec.ts`.
 */
import { Container } from "../primitives/Container"
import { Display } from "../primitives/Display"
import { Eyebrow } from "../primitives/Eyebrow"
import { HeroCanvas } from "./HeroCanvas"
import { ExpandChip, LinkChip } from "./LedeChip"
import type { HeroLogoShard } from "./types"

/**
 * The homepage hero — docs/v3-redesign-plan.md §5.1.
 *
 * A Server Component. Every word here is server-rendered, selectable HTML: the
 * eyebrow, the H1 (the LCP element), the lede with its inline brand chips and
 * the scroll cue. The canvas is a decorative layer *underneath* it that mounts
 * later and can fail without taking any content with it.
 */

/**
 * The highlight store is deliberately NOT re-exported here: this module reads
 * the filesystem, so a client component must import it from its own path,
 * `@/app/components/hero/highlight-store`.
 */
export type { HeroLogoShard } from "./types"

/** Non-company tokens the lede may reference. */
const EXTRA_TOKENS: Record<
  string,
  { label: string; mark: string; color: string; href: string }
> = {
  tenderlift: {
    label: "TenderLift",
    mark: "TL",
    // The hex, not `var(--color-accent)`: `LedeChip` runs it through `inkOn`.
    color: ACCENT,
    href: "#project-tenderlift",
  },
}

export function Hero() {
  const { hero } = getHome()
  const companies = getCompanies()
  const heroLogos = getHeroLogos()

  const byId = new Map(companies.map((company) => [company.id, company]))

  /* Everything the canvas island needs, resolved on the server. */
  const logos: HeroLogoShard[] = heroLogos.flatMap((logo) => {
    const band = byId.get(logo.bandId)
    if (!band) return []
    return [
      {
        id: logo.id,
        bandId: logo.bandId,
        name: logo.label,
        years: band.yearsLabel,
        color: band.color,
        mark: logo.mark,
        markSrc: `/static/logos/mono/${logo.id}.svg`,
      },
    ]
  })

  /*
   * `[[slug]]` → inline brand chip. `split` with a capture group alternates
   * text / token / text …, so odd indices are the tokens. Unknown tokens
   * degrade to their own text rather than throwing — content is never fatal.
   */
  const lede: ReactNode[] = hero.lede
    .split(/\[\[([a-z0-9-]+)\]\]/)
    .map((part, i) => {
      if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>

      const company = byId.get(part as CompanyId)
      if (company) {
        return (
          <ExpandChip
            key={i}
            id={company.id}
            label={company.name}
            mark={company.mark ?? company.short.slice(0, 2).toUpperCase()}
            color={company.color}
          />
        )
      }

      const extra = EXTRA_TOKENS[part]
      if (extra) {
        return (
          <LinkChip
            key={i}
            href={extra.href}
            label={extra.label}
            mark={extra.mark}
            color={extra.color}
          />
        )
      }

      return <Fragment key={i}>{part}</Fragment>
    })

  return (
    <section
      id="top"
      data-section="Intro"
      data-testid="hero"
      className="relative flex h-[100svh] min-h-[640px] items-end overflow-hidden"
    >
      <HeroCanvas logos={logos} />

      {/* Vignette that lifts the copy off the shards. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 100%, rgba(11,11,12,.9), rgba(11,11,12,0) 70%)",
        }}
      />

      <Container className="relative z-[2] grid gap-7 pb-14" id="hero-content">
        <Eyebrow items={[...hero.eyebrow]} />

        <Display as="h1" size="hero">
          {hero.h1}
        </Display>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="m-0 max-w-[48ch] text-[20px] leading-[1.45] text-dim">
            {lede}
          </p>
          <p className="m-0 flex items-center gap-[10px] font-mono text-[11px] uppercase leading-none tracking-[0.1em] text-muted">
            <span aria-hidden className="hero-scroll-line" />
            {hero.scrollCue}
          </p>
        </div>
      </Container>
    </section>
  )
}
