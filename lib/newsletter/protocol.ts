/**
 * What `NewsletterForm` and the `subscribe` action agree on about the
 * Turnstile check (`lib/newsletter/turnstile.ts`). Constants only, so the
 * client component can import them without pulling in anything server-side.
 */

/** The Turnstile `action` the form's widget sets and the action requires. */
export const NEWSLETTER_TURNSTILE_ACTION = "newsletter"

/** The form field that carries the token. */
export const TURNSTILE_FIELD = "turnstile"
