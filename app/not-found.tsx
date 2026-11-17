import type { Metadata } from "next"

import { getNotFound } from "@/lib/content"

// Direct module paths, not the barrel: `not-found` is part of every route's
// server graph, and the barrel re-exports client primitives.
import { Container } from "./components/primitives/Container"
import { TransitionLink } from "./components/primitives/TransitionLink"
import { PageFrame } from "./components/site/PageFrame"

const copy = getNotFound()

export const metadata: Metadata = {
  title: copy.seo.title,
  description: copy.seo.description,
  alternates: { canonical: null },
  robots: { index: false, follow: true },
}

/**
 * 404, in the 2027 language: the shared frame, one serif line, a muted
 * sentence, the links. Copy from `content/pages/not-found.ts`.
 *
 * The links are `TransitionLink` with no transition types (the same
 * navigation as a bare `next/link`), never `next/link` imported here. Every
 * page carries this component in its payload (the root not-found
 * boundary), and a server component that imports `next/link` itself gets a
 * client chunk of its own, with copies of the header's islands, which every
 * page then loaded up front (about 20 KB raw, 17 Nov 2026). `TransitionLink`
 * is already in each page's chunks.
 */
export default function NotFound() {
  return (
    <PageFrame>
      <Container className="mt-12 flex flex-col gap-[18px] min-[721px]:mt-16">
        <p className="m-0 font-mono text-label uppercase text-muted">
          {copy.label}
        </p>
        <h1 className="m-0 font-display text-(length:--text-headline-size) leading-[1.04] font-normal tracking-[-0.01em]">
          {copy.title}
        </h1>
        <p className="m-0 text-ink-soft">{copy.line}</p>
        <p className="m-0 flex flex-wrap gap-x-6">
          {copy.links.map((link) => (
            <TransitionLink
              key={link.href}
              href={link.href}
              transitionTypes={[]}
              className="inline-flex min-h-11 items-center underline decoration-underline hover:decoration-current"
            >
              {link.label}
            </TransitionLink>
          ))}
        </p>
      </Container>
    </PageFrame>
  )
}
