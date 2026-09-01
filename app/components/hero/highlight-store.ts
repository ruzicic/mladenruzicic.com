"use client"

import { useSyncExternalStore } from "react"

import type { CompanyId } from "@/lib/content/schema"

/**
 * STUB owned by the site-shell agent — replaced by the hero agent at merge.
 * Keep the exported API identical.
 *
 * The one channel between the hero's logo shards and the work-history rail
 * (docs/v3-redesign-plan.md §5.1). Deliberately framework-free so a WebGL
 * frame loop can call `setHighlight` on every pointer move without React
 * re-rendering anything but the rail.
 *
 * - `highlight`     — the band that should glow right now, or null.
 * - `expandRequest` — a one-shot "open this band and scroll to it". The `nonce`
 *                     makes repeat requests for the same id distinguishable.
 */

export interface HeroHighlightState {
  highlight: CompanyId | null
  expandRequest: { id: CompanyId; nonce: number } | null
}

const INITIAL: HeroHighlightState = { highlight: null, expandRequest: null }

let state: HeroHighlightState = INITIAL
let nonce = 0

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setHighlight(id: CompanyId | null): void {
  if (state.highlight === id) return
  state = { ...state, highlight: id }
  emit()
}

export function requestExpand(id: CompanyId): void {
  nonce += 1
  state = { ...state, expandRequest: { id, nonce } }
  emit()
}

function getSnapshot(): HeroHighlightState {
  return state
}

/** Constant across the whole server render, as `useSyncExternalStore` requires. */
function getServerSnapshot(): HeroHighlightState {
  return INITIAL
}

export function useHeroHighlight(): HeroHighlightState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
