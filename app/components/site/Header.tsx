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
 * Difference only reads well against a backdrop that is decisively dark or
 * decisively light: against the accent yellow (#F5DF4D) the off-white ink turns
 * into a saturated blue, and against a mid-tone employer band it very nearly
 * disappears. `.header-scrim` (shell.css) is the fix that keeps the blend mode:
 * a fixed, page-background gradient painted *under* the header (z-40, so it is
 * part of the header's backdrop) which is invisible over the dark ground and
 * only asserts itself when bright content scrolls into the header zone.
 *
 * `view-transition-name: site-header` plus `animation: none` in shell.css keeps
 * it perfectly still across navigations; the scrim carries its own name for the
 * same reason.
 *
 * Below 720px the nav is hidden and `MobilePill` takes over; the monogram stays.
 */
export function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname()
  const onHome = pathname === "/"

  return (
    <>
      <div
        aria-hidden
        data-site-header-scrim
        className="header-scrim"
        style={{ viewTransitionName: "site-header-scrim" }}
      />
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
        <a href="#top" data-hover className="flex items-center gap-3">
          <span className="font-display text-[22px] normal-case leading-none tracking-[-0.04em]">
            MR
          </span>
          <span className="opacity-70">{siteName}</span>
        </a>

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
    </>
  )
}
