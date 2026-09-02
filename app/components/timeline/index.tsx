import { getCompanies, getHome, getPeople, getWork } from "@/lib/content"

import { Container } from "../primitives/Container"
import { SectionHeader } from "../primitives/Section"
import { nowFraction } from "../site/now"
import { TimelineRail, type TimelineMarker } from "./Timeline"

/**
 * "Work history" — the server half of the rail.
 *
 * It resolves the content, computes the current-year fraction for ZF's
 * `to: "now"` (on the server, so the value is identical at hydration) and hands
 * everything to the client island.
 *
 * The "Independent" markers are the featured products that are mine to talk
 * about freely — `confidentiality: "public"` is exactly the set the design
 * shows (studenti.rs, FontAlternatives, TenderLift, Amada) and excludes
 * employer work such as EVO Touch.
 */
export async function Timeline() {
  const home = getHome()
  const companies = getCompanies()
  const people = getPeople()

  const markers: TimelineMarker[] = getWork()
    .filter(
      (entry) =>
        entry.featured &&
        entry.kind === "product" &&
        entry.confidentiality === "public"
    )
    .map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      accent: entry.accent,
      year: Number(entry.period.from.slice(0, 4)),
    }))
    .sort((a, b) => a.year - b.year)

  return (
    <section
      id="history"
      data-section="History"
      data-testid="timeline"
      aria-labelledby="history-heading"
      // scroll-mt: the header is fixed at 70px, so #history would otherwise
      // land the heading behind it.
      className="relative scroll-mt-[80px] border-t border-line-soft pb-20 pt-24"
    >
      <Container>
        <SectionHeader
          id="history-heading"
          title={home.history.eyebrow}
          meta={home.history.rangeLabel}
          className="mb-10"
        />
      </Container>

      <TimelineRail
        companies={companies}
        people={people}
        markers={markers}
        nowFraction={await nowFraction()}
        labels={home.history}
      />
    </section>
  )
}
