"use client"

import { useEffect, useSyncExternalStore } from "react"

import {
  getSoundServerSnapshot,
  getSoundSnapshot,
  hydrateSound,
  play,
  subscribeSound,
  toggleSound,
  type BlipName,
} from "./sound"

export interface UseSound {
  /** `false` on the server and on the first client render. */
  enabled: boolean
  toggle: () => void
  play: (name: BlipName) => void
}

/** Subscribes a component to the sound preference. */
export function useSound(): UseSound {
  const enabled = useSyncExternalStore(
    subscribeSound,
    getSoundSnapshot,
    getSoundServerSnapshot
  )

  useEffect(() => {
    hydrateSound()
  }, [])

  return { enabled, toggle: toggleSound, play }
}
