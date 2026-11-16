import { TURNSTILE_ACTION } from "@/lib/ask/protocol"
import { TURNSTILE_ORIGIN } from "@/lib/ask/site-config"

/**
 * Cloudflare Turnstile, loaded on demand: the script is added to the page
 * only when the first typed question of a visit is about to be sent, never
 * on page load and never for the prepared questions. The footer's newsletter
 * sign-up imports this module lazily too (on its first focus or keystroke),
 * with its own `action`; the script is loaded once for both.
 *
 * The widget is rendered explicitly into a container inside the Ask dialog
 * (a modal dialog makes everything outside it inert), in Managed mode with
 * `appearance: "interaction-only"`: most visitors never see it, and the few
 * Turnstile is unsure about get one checkbox, which is keyboard-focusable
 * and labelled by Cloudflare. Each widget is used for one token and removed.
 *
 * Options as documented on 2026-11-12 at
 * developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 * and .../widget-configurations/.
 */

const SCRIPT_SRC = `${TURNSTILE_ORIGIN}/turnstile/v0/api.js?render=explicit`
/** Loading the script. */
const LOAD_MS = 15_000
/** The check when Turnstile runs it without the visitor. */
const SILENT_MS = 20_000
/** The check once it asks the visitor to tick the box. */
const INTERACTIVE_MS = 120_000

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

/** Why there is no token. The panel says the same thing for each. */
export class ChallengeError extends Error {}

let loading: Promise<TurnstileApi> | null = null

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (loading) return loading
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    const timer = window.setTimeout(() => fail(), LOAD_MS)
    const fail = () => {
      window.clearTimeout(timer)
      script.remove()
      loading = null
      reject(new ChallengeError("script"))
    }
    script.onerror = fail
    script.onload = () => {
      window.clearTimeout(timer)
      if (window.turnstile) resolve(window.turnstile)
      else fail()
    }
    document.head.append(script)
  })
  return loading
}

export interface ChallengeOptions {
  siteKey: string
  /**
   * The Turnstile `action` the token is bound to and the verifier checks:
   * `ask` (the default) for Ask, `newsletter` for the footer's sign-up
   * (`app/components/site/NewsletterForm.tsx`).
   */
  action?: string
  /** Where the widget goes, inside the dialog. */
  host: HTMLElement
  /** `true` while Turnstile is asking the visitor to interact. */
  onInteractive: (interactive: boolean) => void
  signal?: AbortSignal
}

/**
 * One Turnstile token for `action` (`ask` unless given). Rejects with
 * `ChallengeError` when the check fails, expires, times out or cannot load,
 * and with the signal's reason when it is aborted. Always removes its widget.
 */
export async function getTurnstileToken({
  siteKey,
  action = TURNSTILE_ACTION,
  host,
  onInteractive,
  signal,
}: ChallengeOptions): Promise<string> {
  const api = await loadScript()
  signal?.throwIfAborted()
  return new Promise<string>((resolve, reject) => {
    let widget: string | null = null
    let timer = 0
    let settled = false
    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      signal?.removeEventListener("abort", onAbort)
      onInteractive(false)
      if (widget !== null) {
        try {
          api.remove(widget)
        } catch {
          // Already gone with the dialog.
        }
        widget = null
      }
      fn()
    }
    const fail = () => settle(() => reject(new ChallengeError("failed")))
    const onAbort = () => settle(() => reject(signal?.reason))
    const wait = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(fail, ms)
    }
    signal?.addEventListener("abort", onAbort, { once: true })
    wait(SILENT_MS)
    try {
      widget = api.render(host, {
        sitekey: siteKey,
        action,
        appearance: "interaction-only",
        theme: "light",
        size: "flexible",
        language: "auto",
        retry: "never",
        "refresh-expired": "never",
        "refresh-timeout": "never",
        "response-field": false,
        "feedback-enabled": false,
        callback: (token: string) => settle(() => resolve(token)),
        "error-callback": () => {
          fail()
          return true
        },
        "expired-callback": fail,
        "timeout-callback": fail,
        "unsupported-callback": fail,
        "before-interactive-callback": () => {
          wait(INTERACTIVE_MS)
          onInteractive(true)
          host.scrollIntoView({ block: "nearest" })
        },
        "after-interactive-callback": () => onInteractive(false),
      })
    } catch {
      fail()
    }
  })
}
