"use client"

import type { MouseEvent } from "react"

import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

interface NavigationEntry {
  url: string | null
  index: number
}
interface NavigationLike {
  canGoBack?: boolean
  currentEntry?: NavigationEntry | null
  entries?: () => NavigationEntry[]
}

/** Was the page before this one in the tab's history a page of this site? */
function cameFromSite(): boolean {
  const nav = (window as { navigation?: NavigationLike }).navigation
  if (nav?.entries && nav.currentEntry) {
    if (!nav.canGoBack) return false
    const prev = nav.entries()[nav.currentEntry.index - 1]
    return !!prev?.url && new URL(prev.url).origin === location.origin
  }
  // No Navigation API (older Safari, Firefox): the referrer of the load,
  // when this page was opened from the site.
  try {
    return (
      history.length > 1 &&
      !!document.referrer &&
      new URL(document.referrer).origin === location.origin
    )
  } catch {
    return false
  }
}

/**
 * The CV's top-left control (owner, 17 Nov 2026: "my header becomes just
 * 'x'"): back to the page the visitor came from when that was a page of
 * this site, else to `/about`. Without JavaScript it is the plain link to
 * `/about` it renders as.
 */
export function CloseCv({ label, href }: { label: string; href: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
      return
    if (!cameFromSite()) return
    e.preventDefault()
    history.back()
  }
  return (
    <Button
      as={TransitionLink}
      href={href}
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="site-top__close"
    >
      <Icon name="close" size={16} />
    </Button>
  )
}
