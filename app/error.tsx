"use client"

import Link from "next/link"

import { ERROR_PAGE as copy } from "@/content/pages/error"

import { Button } from "./components/primitives/Button"
import { Container } from "./components/primitives/Container"

/**
 * A page that failed to render, in the 404's language: a mono label, one
 * serif line, a sentence, Try again and the links. Error boundaries are
 * client components, so this cannot use `PageFrame` (server, reads content
 * through `lib/content`); it renders its own `<main id="main">` for the skip
 * link and imports the plain copy object from `content/pages/error.ts`
 * (validated at build time in `lib/content/index.ts`).
 *
 * Islands that fail on their own (Ask, the list preview, a story clip) do
 * not reach this page: `IslandBoundary` degrades them in place.
 */
export default function ErrorPage({
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  return (
    <main id="main" tabIndex={-1} data-page-main="" className="py-16">
      <Container className="flex flex-col gap-[18px]">
        <p className="m-0 font-mono text-label uppercase text-muted">
          {copy.label}
        </p>
        <h1 className="m-0 font-display text-(length:--text-headline-size) leading-[1.04] font-normal tracking-[-0.01em]">
          {copy.title}
        </h1>
        <p className="m-0 text-ink-soft">{copy.line}</p>
        <p className="m-0 flex flex-wrap gap-x-6">
          <Button size="compact" onClick={() => retry()}>
            {copy.retryLabel}
          </Button>
          {copy.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center underline decoration-underline hover:decoration-current"
            >
              {link.label}
            </Link>
          ))}
        </p>
      </Container>
    </main>
  )
}
