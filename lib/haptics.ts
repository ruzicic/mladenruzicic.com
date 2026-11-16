import { WebHaptics } from "web-haptics"

/**
 * A small tick under the finger, for the few interactions that earn one
 * (owner, 2026-11-12: "minimal"). Exactly three callers, each inside a real
 * user gesture: the Ask button opening the panel, a testimonial card sent to
 * the back by the reader (tap, throw or the counter; never autoplay, never a
 * spring-back), and a newsletter subscription Kit has confirmed.
 *
 * `web-haptics` (MIT, no runtime dependencies, about 2.3 KB gzipped, pinned
 * at 0.0.6) wraps the two techniques the web has: `navigator.vibrate` where
 * it exists (Android), and on iOS Safari, which has no Vibration API, a
 * hidden `<input type="checkbox" switch>` whose label it clicks, which makes
 * the system play its switch tick. It is imported statically rather than on
 * demand because the iOS tick only plays inside the gesture: an `await
 * import()` would land after it. The module does nothing at import time;
 * the instance (and the hidden label it appends to `<body>`) is created on
 * the first call.
 *
 * `haptic()` never throws and does nothing on the server, under
 * `prefers-reduced-motion: reduce`, or where neither technique exists.
 */
export type HapticKind = "tap" | "success"

/** The package's presets: a single 15ms "light" tick; a double "success". */
const PRESET = { tap: "light", success: "success" } as const

let instance: WebHaptics | null = null

export function haptic(kind: HapticKind): void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    if (!supported()) return
    instance ??= new WebHaptics()
    instance.trigger(PRESET[kind]).catch(() => {})
  } catch {
    // Feedback is a nicety: never let it break the interaction it decorates.
  }
}

/**
 * `navigator.vibrate`, or WebKit on a touch screen (the switch tick). A
 * desktop browser without either gets nothing, not a hidden label.
 */
function supported(): boolean {
  if (typeof navigator.vibrate === "function") return true
  const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false
  const webkit =
    /AppleWebKit/.test(navigator.userAgent) &&
    !/Chrome|Chromium|Android/.test(navigator.userAgent)
  return touch && webkit
}
