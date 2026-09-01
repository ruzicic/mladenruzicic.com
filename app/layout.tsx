import { Suspense, type ReactNode } from "react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import { HOME } from "@/content/pages/home"
import { SITE } from "@/content/site"
import { jsonLdScript, personJsonLd } from "@/lib/seo/jsonld"

import FathomAnalytics from "./components/FathomAnalytics"
import { Container, SkipLink } from "./components/primitives"
import { NavPending } from "./components/primitives/NavPending"
import { TransitionLink } from "./components/primitives/TransitionLink"
import { fontVariables } from "./fonts"

import "./globals.css"

export { baseMetadata as metadata } from "@/lib/seo/metadata"

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/mentoring", label: "Mentoring" },
  { href: "/about", label: "About" },
] as const

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <SkipLink />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(personJsonLd())}
        />

        {/* TEMPORARY shell. Owned by the site-shell agent:
            app/components/site/** replaces this header and footer. */}
        <header className="border-b border-line-soft">
          <Container className="flex items-center justify-between gap-6 py-5">
            <TransitionLink
              href="/"
              className="font-display text-[22px] leading-none tracking-[-0.04em]"
            >
              MR
              <NavPending />
            </TransitionLink>
            <nav
              aria-label="Primary"
              className="flex items-center gap-7 font-mono text-[12px] uppercase tracking-[0.06em]"
            >
              {NAV.map((item) => (
                <TransitionLink key={item.href} href={item.href}>
                  {item.label}
                  <NavPending />
                </TransitionLink>
              ))}
            </nav>
          </Container>
        </header>

        {children}

        <footer className="border-t border-line-soft">
          <Container className="flex flex-wrap items-center justify-between gap-4 py-10 font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
            <p className="m-0">{HOME.footer.copyright}</p>
            <ul className="m-0 flex list-none flex-wrap gap-6 p-0">
              <li>
                <a href={SITE.links.github} rel="noreferrer noopener">
                  GitHub
                </a>
              </li>
              <li>
                <a href={SITE.links.linkedin} rel="noreferrer noopener">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={SITE.links.mentorcruise} rel="noreferrer noopener">
                  MentorCruise
                </a>
              </li>
              <li>
                <TransitionLink href="/uses">Uses</TransitionLink>
              </li>
              <li>
                <a href={SITE.links.cv}>CV</a>
              </li>
            </ul>
          </Container>
        </footer>

        <Suspense fallback={null}>
          <FathomAnalytics />
        </Suspense>
        <SpeedInsights sampleRate={0.3} />
      </body>
    </html>
  )
}
