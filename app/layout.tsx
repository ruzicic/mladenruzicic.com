import { Suspense, type ReactNode } from "react"
import { SpeedInsights } from "@vercel/speed-insights/next"

import FathomAnalytics from "./components/FathomAnalytics"
import { SkipLink } from "./components/primitives/SkipLink"
import { fontVariables } from "./fonts"

import "./globals.css"
import "./styles/shell.css"

export {
  baseMetadata as metadata,
  baseViewport as viewport,
} from "@/lib/seo/metadata"

/**
 * Root layout: `<html>`, `<body>`, fonts, the skip link and analytics.
 * Structured data is per page (`app/components/seo/JsonLd.tsx`): each page's
 * graph carries the Person and WebSite nodes itself.
 *
 * The visible chrome (top block, `<main>`, footer) is rendered by each page
 * through `app/components/site/PageFrame.tsx`, so the three boards' shared
 * structure lives in one component and the page transition wraps only the
 * page body.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // `data-scroll-behavior="smooth"` tells the Next router to force
    // `scroll-behavior: auto` while it resets the scroll position on a route
    // change, so `html { scroll-behavior: smooth }` never animates a new page
    // up from the old page's offset. Hash links keep their smooth scroll.
    <html lang="en" className={fontVariables} data-scroll-behavior="smooth">
      <body>
        <SkipLink />

        {children}

        <Suspense fallback={null}>
          <FathomAnalytics />
        </Suspense>
        {process.env.VERCEL ? <SpeedInsights sampleRate={0.3} /> : null}
      </body>
    </html>
  )
}
