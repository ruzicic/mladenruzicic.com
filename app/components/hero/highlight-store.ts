"use client"

import { useSyncExternalStore } from "react"

import type { CompanyId } from "@/lib/content/schema"

/**
 * The one channel between the hero canvas and the timeline — §5.1.
 *
 * Hovering a logo shard highlights the matching band; clicking one asks the
 * timeline to expand it. Deliberately a plain module store (no context, no
 * dependency) so the timeline can subscribe without the hero being an ancestor,
 * and so `Scene.tsx` can write to it from inside the R3F frame loop.
 *
 * The store is write-anywhere / read-anywhere: the hero writes, the timeline
 * reads. Keyboard parity lives in the timeline (its bands are real buttons), so
 * nothing here is the only route to a piece of content.
 */

export interface ExpandRequest {
  id: CompanyId
  /** Bumped on every request so repeat clicks on the same band still fire. */
  nonce: number
}

export interface HeroHighlightState {
  highlight: CompanyId | null
  expandRequest: ExpandRequest | null
}

const EMPTY: HeroHighlightState = { highlight: null, expandRequest: null }

let state: HeroHighlightState = EMPTY
let nonce = 0

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Subscribe to every state change. Returns the unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Current snapshot. Stable reference between changes (safe for `useSyncExternalStore`). */
export function getHeroHighlightSnapshot(): HeroHighlightState {
  return state
}

/** Highlight a timeline band, or clear it with `null`. */
export function setHighlight(id: CompanyId | null): void {
  if (state.highlight === id) return
  state = { ...state, highlight: id }
  emit()
}

/** Ask the timeline to expand a band. Always emits, even for the same id. */
export function requestExpand(id: CompanyId): void {
  nonce += 1
  state = { ...state, expandRequest: { id, nonce } }
  emit()
}

/** Test/StrictMode escape hatch. Not used in the app. */
export function resetHeroHighlight(): void {
  state = EMPTY
  nonce = 0
  emit()
}

/** Read the store from a client component. Server snapshot is always empty. */
export function useHeroHighlight(): HeroHighlightState {
  return useSyncExternalStore(subscribe, getHeroHighlightSnapshot, () => EMPTY)
}
