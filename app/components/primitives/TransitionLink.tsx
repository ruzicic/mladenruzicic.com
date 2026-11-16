"use client"

import type { ComponentProps } from "react"
import Link from "next/link"

import { NAV_FORWARD } from "./PageTransition"

export type TransitionLinkProps = ComponentProps<typeof Link>

/**
 * `next/link` that tags its navigation as `nav-forward` so `PageTransition`
 * picks the forward enter/exit classes. Browser back/forward is handled by the
 * router itself, which fires the `nav-back` type.
 */
export function TransitionLink({
  transitionTypes = [NAV_FORWARD],
  ...props
}: TransitionLinkProps) {
  return <Link transitionTypes={transitionTypes} {...props} />
}
