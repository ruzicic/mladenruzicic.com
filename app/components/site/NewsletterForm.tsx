"use client"

import {
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react"
import { trackGoal } from "fathom-client"

import type { Site } from "@/lib/content/schema"
import { haptic } from "@/lib/haptics"
import {
  NEWSLETTER_TURNSTILE_ACTION,
  TURNSTILE_FIELD,
} from "@/lib/newsletter/protocol"
import type { SubscribeState } from "@/lib/newsletter/subscribe"

import { Button } from "../primitives/Button"
import { subscribe } from "./subscribe"

/** The live site's Fathom goal for a newsletter sign-up. */
const FATHOM_GOAL = "YQXZJQZL"

const INITIAL: SubscribeState = { status: "idle" }

/**
 * A Turnstile token is good for 300 seconds (Siteverify); one older than
 * this is not sent, a new one is asked for.
 */
const TOKEN_FRESH_MS = 270_000

export interface NewsletterFormProps {
  copy: Omit<Site["newsletter"], "enabled">
  /**
   * Turnstile's site key while the check is on (both of its variables set,
   * `lib/newsletter/turnstile.ts`), else `null`: no widget, no script, no
   * extra field, the form exactly as it was before the check.
   */
  turnstileSiteKey?: string | null
}

/**
 * For the end-to-end tests only (`tests/newsletter.spec.ts`): one of
 * Cloudflare's published test site keys in
 * `window.__newsletterTurnstileSiteKey` turns the client side of the check on
 * against a stubbed script. Nothing else is taken from the window, and a
 * test key's dummy token never verifies against a real secret.
 */
function testSiteKey(): string | null {
  const key = (window as { __newsletterTurnstileSiteKey?: unknown })
    .__newsletterTurnstileSiteKey
  return typeof key === "string" && /^[123]x0{20}(AA|AB|BB|FF)$/.test(key)
    ? key
    : null
}
const noSubscribe = () => () => {}
const noTestKey = () => null

/**
 * The landing footer's sign-up line (`Landing.dc.html` and
 * `Landing-Mobile.dc.html`, the `newsletter` block). It posts to the
 * `subscribe` Server Action through `useActionState`, so it also works
 * before hydration and without JavaScript.
 *
 * The form and the thanks line share one grid cell, and the status row under
 * the field always keeps its line, so neither an error nor the subscribed
 * state moves anything below it. One `role="status"` element carries both
 * the error and the thanks.
 *
 * With a Turnstile site key (owner, 2026-11-16: "add the same invisible
 * check Ask uses"), the visitor's first focus or keystroke in the field
 * loads Ask's Turnstile module and script (`../ask/turnstile`), never page
 * load, and runs the managed, interaction-only widget for the action
 * `newsletter` while the address is typed. Its token goes with the form in a
 * hidden field, once: each send uses a fresh one. A send before the token is
 * ready waits for it; if the check fails, the form posts without one and the
 * action answers with the generic "did not go through" line. The widget only
 * takes room under the field when Turnstile asks for a tick. Without a key
 * none of this exists.
 */
export function NewsletterForm({
  copy,
  turnstileSiteKey = null,
}: NewsletterFormProps) {
  const [state, action, pending] = useActionState(subscribe, INITIAL)
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const done = state.status === "ok"

  const testKey = useSyncExternalStore(noSubscribe, testSiteKey, noTestKey)
  const siteKey = turnstileSiteKey ?? testKey
  const tokenFieldRef = useRef<HTMLInputElement>(null)
  const challengeRef = useRef<HTMLDivElement>(null)
  const token = useRef<{ value: string; at: number } | null>(null)
  const fetching = useRef<Promise<void> | null>(null)
  const challengeFailed = useRef(false)
  const resubmitting = useRef(false)
  const [checking, setChecking] = useState(false)
  const [interactive, setInteractive] = useState(false)
  const busy = pending || checking

  useEffect(() => {
    if (state.status === "ok") {
      // The form hides, so focus moves to the line that replaced it.
      statusRef.current?.focus({ preventScroll: true })
      // Only once Kit has confirmed. It follows the submit by a network round
      // trip, so where the platform needs the gesture still active (iOS) a
      // slow reply may go without the tick.
      haptic("success")
      if (process.env.NODE_ENV === "production") trackGoal(FATHOM_GOAL, 0)
    } else if (state.status === "error") {
      inputRef.current?.focus({ preventScroll: true })
    }
  }, [state])

  function freshToken(): string | null {
    const t = token.current
    return t && Date.now() - t.at < TOKEN_FRESH_MS ? t.value : null
  }

  /** One token in hand, or the attempt to get one; never rejects. */
  function fetchToken(): Promise<void> {
    if (freshToken()) return Promise.resolve()
    if (fetching.current) return fetching.current
    const host = challengeRef.current
    if (!siteKey || !host) return Promise.resolve()
    const run = import("../ask/turnstile")
      .then(({ getTurnstileToken }) =>
        getTurnstileToken({
          siteKey,
          action: NEWSLETTER_TURNSTILE_ACTION,
          host,
          onInteractive: setInteractive,
        })
      )
      .then(
        (value) => {
          token.current = { value, at: Date.now() }
          challengeFailed.current = false
        },
        () => {
          token.current = null
          challengeFailed.current = true
        }
      )
      .finally(() => {
        fetching.current = null
      })
    fetching.current = run
    return run
  }

  /**
   * The first focus or keystroke starts the check while the address is
   * typed. An error answer puts focus back in the field (above), which
   * starts the next check at once, so a retry finds its token ready. After a
   * failed check only a send tries again, so a blocked script is not
   * requested on every key.
   */
  function warm() {
    if (!challengeFailed.current) void fetchToken()
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const field = tokenFieldRef.current
    // The second pass, below: the token (or nothing) is already in place.
    if (!field || resubmitting.current) return
    const value = freshToken()
    if (value) {
      // Read from the form after this handler; single-use, so dropped here.
      field.value = value
      token.current = null
      return
    }
    // No token yet: hold the send until the check has answered.
    event.preventDefault()
    const form = event.currentTarget
    setChecking(true)
    void fetchToken().then(() => {
      setChecking(false)
      // Without a token the form still posts, and the action answers with
      // the generic error line.
      field.value = freshToken() ?? ""
      token.current = null
      // `requestSubmit` dispatches `submit` synchronously.
      resubmitting.current = true
      try {
        form.requestSubmit()
      } finally {
        resubmitting.current = false
      }
    })
  }

  const message =
    state.status === "ok"
      ? copy.thanks
      : state.status === "error"
        ? copy.errors[state.code]
        : ""

  return (
    <div className="news" data-state={state.status}>
      <form
        action={action}
        onSubmit={siteKey ? onSubmit : undefined}
        className="news__form"
        inert={done}
        aria-hidden={done || undefined}
      >
        <p className="news__line">{copy.line}</p>
        <div className="news__field">
          {/* Named for screen readers only (owner, 16 Nov 2026: the
              placeholder says enough on screen). */}
          <label htmlFor={`${id}-email`} className="sr-only">
            {copy.inputLabel}
          </label>
          <div className="news__row">
            <input
              ref={inputRef}
              id={`${id}-email`}
              className="news__input"
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              placeholder={copy.placeholder}
              defaultValue={state.status === "error" ? state.email : undefined}
              aria-invalid={state.status === "error" || undefined}
              aria-describedby={
                state.status === "error" ? `${id}-status` : undefined
              }
              onFocus={siteKey ? warm : undefined}
              onInput={siteKey ? warm : undefined}
            />
            <Button
              type="submit"
              tone="dark"
              className="news__submit"
              disabled={busy}
              aria-busy={busy || undefined}
            >
              {copy.submitLabel}
            </Button>
          </div>
          {siteKey ? (
            <>
              <input
                ref={tokenFieldRef}
                type="hidden"
                name={TURNSTILE_FIELD}
                defaultValue=""
              />
              {/* Where Turnstile renders; collapsed unless it asks for a tick. */}
              <div
                ref={challengeRef}
                className="news__challenge"
                data-on={interactive ? "" : undefined}
              />
            </>
          ) : null}
          {/* The honeypot: off screen, out of the tab order, unannounced. */}
          <div className="news__hp" aria-hidden="true">
            <label htmlFor={`${id}-website`}>{copy.honeypotLabel}</label>
            <input
              id={`${id}-website`}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </div>
        </div>
      </form>
      <p
        ref={statusRef}
        id={`${id}-status`}
        role="status"
        tabIndex={-1}
        className="news__status"
      >
        {message}
      </p>
    </div>
  )
}
