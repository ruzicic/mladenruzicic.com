import { Suspense, type ReactNode } from "react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { getCompanies, getHome, getSite } from "@/lib/content"
import { jsonLdScript, personJsonLd } from "@/lib/seo/jsonld"

import FathomAnalytics from "./components/FathomAnalytics"
import { Preloader } from "./components/preloader/Preloader"
import { SkipLink } from "./components/primitives/SkipLink"
import { Footer, Header, MobilePill, ScrollHairline } from "./components/site"
import type { PillCompany } from "./components/site"
import { nowFraction } from "./components/site/now"
import { resolveTo } from "./components/timeline/span"
import { fontVariables } from "./fonts"

import "./globals.css"
import "./styles/shell.css"
import "./styles/hero.css"

export { baseMetadata as metadata } from "@/lib/seo/metadata"

/**
 * Runs before first paint. If this session has already seen the preloader we
 * stamp `data-preloader="off"` on `<html>` and shell.css hides the overlay, so
 * it never flashes on a reload. `suppressHydrationWarning` covers the attribute
 * the script adds. See docs/v3-redesign-plan.md §5.4.
 */
const PRELOADER_BOOTSTRAP =
  "try{if(sessionStorage.getItem('mr:preloaded')){document.documentElement.setAttribute('data-preloader','off')}}catch(e){}"

/** Same guard for a visitor with JavaScript disabled: never a black screen. */
const PRELOADER_NOSCRIPT = '[data-testid="preloader"]{display:none!important}'

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const site = getSite()
  const home = getHome()
  const now = await nowFraction()

  // The mobile sheet's employer colour scrubber: one segment per band, sized in
  // years. Only these fields cross into the client bundle.
  const pillCompanies: PillCompany[] = getCompanies().map((company) => ({
    id: company.id,
    short: company.short,
    color: company.color,
    yearsLabel: company.yearsLabel,
    years: Number((resolveTo(company.to, now) - company.from).toFixed(2)),
  }))

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRELOADER_BOOTSTRAP }} />
      </head>
      <body>
        <SkipLink />

        <Preloader
          verbs={home.preloader.verbs}
          finalVerb={home.preloader.finalVerb}
        />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: PRELOADER_NOSCRIPT }} />
        </noscript>

        <Header siteName={site.name} />

        <main id="main">{children}</main>

        <Footer />
        <MobilePill companies={pillCompanies} />
        <ScrollHairline />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(personJsonLd())}
        />

        <Suspense fallback={null}>
          <FathomAnalytics />
        </Suspense>
        <SpeedInsights sampleRate={0.3} />
      </body>
    </html>
  )
}
