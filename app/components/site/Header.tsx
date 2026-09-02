"use client"

import { usePathname } from "next/navigation"

import { NavPending } from "../primitives/NavPending"
import { TransitionLink } from "../primitives/TransitionLink"
import { SoundToggle } from "../sound/SoundToggle"

/**
 * Fixed header — kept on `mix-blend-mode: difference` (decision §10.6), so it
 * inverts over the hero, the yellow testimonial bubbles and the accent bands
 * without a second copy of itself.
 *
 * `view-transition-name: site-header` plus `animation: none` in shell.css keeps
 * it perfectly still across navigations.
 *
 * Below 720px the nav is hidden and `MobilePill` takes over; the monogram stays.
 */
export function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname()
  const onHome = pathname === "/"

  return (
    <header
      data-site-header
      style={{ viewTransitionName: "site-header" }}
      className={[
        "fixed inset-x-0 top-0 z-50 mix-blend-difference",
        "flex items-center justify-between gap-6",
        "px-[var(--gutter)] py-[22px]",
        "font-mono text-[12px] uppercase tracking-[0.06em] text-fg",
      ].join(" ")}
    >
      {/* `id="top"` only exists on the homepage, so off-home the monogram has
          to be a real link back to `/` rather than a dead fragment. */}
      {onHome ? (
        <a href="#top" data-hover className="flex items-center gap-3">
          <Monogram siteName={siteName} />
        </a>
      ) : (
        <TransitionLink
          href="/"
          aria-label={`${siteName} — home`}
          data-hover
          className="flex items-center gap-3"
        >
          <Monogram siteName={siteName} />
          <NavPending />
        </TransitionLink>
      )}

      <nav
        aria-label="Primary"
        className="hidden items-center gap-7 min-[720px]:flex"
      >
        {onHome ? (
          <a href="#work" data-hover>
            Work
          </a>
        ) : (
          <TransitionLink href="/work" data-hover>
            Work
            <NavPending />
          </TransitionLink>
        )}
        <TransitionLink href="/mentoring" data-hover>
          Mentoring
          <NavPending />
        </TransitionLink>
        <TransitionLink href="/about" data-hover>
          About
          <NavPending />
        </TransitionLink>
        <SoundToggle />
      </nav>
    </header>
  )
}

function Monogram({ siteName }: { siteName: string }) {
  return (
    <>
      <span className="font-display text-[22px] normal-case leading-none tracking-[-0.04em]">
        MR
      </span>
      <span className="opacity-70">{siteName}</span>
    </>
  )
}
