"use client"

/**
 * Web Audio blips — docs/v3-redesign-plan.md §5.8, decision §10.
 *
 * Off by default, opt-in, persisted in `localStorage`. The `AudioContext` is
 * created lazily on the first toggle, never at import time, so a visitor who
 * never turns sound on never constructs one.
 *
 * Framework-free on purpose: the Pong loop and the timeline call `play()`
 * dozens of times a second and must not touch React state.
 */

export const SOUND_KEY = "mr:sound"

/** Frequency (Hz) and gain for every blip in the design. */
export const BLIPS = {
  toggle: [660, 0.04],
  hover: [880, 0.02],
  expand: [520, 0.04],
  pongWall: [440, 0.03],
  pongFloor: [220, 0.05],
  pongPaddle: [990, 0.03],
} as const

export type BlipName = keyof typeof BLIPS

/* -------------------------------------------------------------------------- */
/* Audio                                                                      */
/* -------------------------------------------------------------------------- */

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (context) return context
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
  } catch {
    context = null
  }
  return context
}

/** A 120 ms sine blip. Silent unless the toggle is on. */
export function play(name: BlipName): void {
  if (!enabled) return
  const [frequency, gain] = BLIPS[name]
  const ac = getContext()
  if (!ac) return
  try {
    if (ac.state === "suspended") void ac.resume()
    const osc = ac.createOscillator()
    const amp = ac.createGain()
    osc.type = "sine"
    osc.frequency.value = frequency
    amp.gain.value = gain
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12)
    osc.connect(amp).connect(ac.destination)
    osc.start()
    osc.stop(ac.currentTime + 0.12)
  } catch {
    /* An AudioContext blocked by autoplay policy is not an error worth showing. */
  }
}

/* -------------------------------------------------------------------------- */
/* Hover blips                                                                */
/* -------------------------------------------------------------------------- */

let hoverBound = false

function onPointerOver(event: PointerEvent) {
  const target = event.target
  if (target instanceof Element && target.closest("[data-hover]")) play("hover")
}

function bindHover() {
  if (hoverBound || typeof document === "undefined") return
  hoverBound = true
  document.addEventListener("pointerover", onPointerOver)
}

function unbindHover() {
  if (!hoverBound || typeof document === "undefined") return
  hoverBound = false
  document.removeEventListener("pointerover", onPointerOver)
}

/* -------------------------------------------------------------------------- */
/* Preference store                                                           */
/* -------------------------------------------------------------------------- */

let enabled = false
let hydrated = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSoundSnapshot(): boolean {
  return enabled
}

/**
 * Always `false` on the server. The stored preference is applied in an effect
 * after hydration instead of in the snapshot, so the server HTML and the first
 * client render always agree.
 */
export function getSoundServerSnapshot(): boolean {
  return false
}

export function isSoundOn(): boolean {
  return enabled
}

export function setSound(next: boolean): void {
  if (enabled === next) return
  enabled = next
  try {
    localStorage.setItem(SOUND_KEY, next ? "on" : "off")
  } catch {
    /* Private mode. The preference just does not persist. */
  }
  if (next) bindHover()
  else unbindHover()
  emit()
}

/** Flips the preference and, when turning on, plays the confirmation blip. */
export function toggleSound(): void {
  const next = !enabled
  setSound(next)
  if (next) play("toggle")
}

/** Reads the stored preference once, after hydration. Idempotent. */
export function hydrateSound(): void {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    if (localStorage.getItem(SOUND_KEY) === "on") setSound(true)
  } catch {
    /* ignore */
  }
}
