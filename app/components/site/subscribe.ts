"use server"

import { headers } from "next/headers"

import { runSubscribe, type SubscribeState } from "@/lib/newsletter/subscribe"

/**
 * The newsletter sign-up, as a Server Action (used through `useActionState`
 * in `NewsletterForm`, so the form also posts without JavaScript). What it
 * does, the honeypot and the Turnstile check included, is in
 * `lib/newsletter/subscribe.ts`; this file only hands it the environment and
 * the request's headers.
 *
 * The Turnstile check runs only while both `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
 * and `TURNSTILE_SECRET_KEY` are set. With either unset (local dev, CI, and
 * production until the secret is added) the sign-up behaves exactly as it
 * did before the check existed.
 *
 * Framework guards (Next's Server Actions guide): the Origin must match the
 * Host, and the body is capped at 1 MB. On top of that the email is capped at
 * 254 characters, nothing from the request is logged, and the keys never
 * leave the server: the client only ever sees a status code.
 */
export async function subscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  return runSubscribe(formData, { env: process.env, headers: await headers() })
}
