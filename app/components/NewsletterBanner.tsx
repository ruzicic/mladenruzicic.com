"use client"

import { FormEventHandler, useCallback, useRef, useState } from "react"
import { trackGoal } from "fathom-client"

import { Button } from "./Button"

// Fire a custom event to track newsletter subs in Fathom Analytics
const FATHOM_NEWSLETTER_SUB_ID = "YQXZJQZL"

type FormState = "initial" | "loading" | "success" | "error"
type Form = {
  state: FormState
  message?: string
}

export default function NewsletterBanner() {
  const [form, setForm] = useState<Form>({ state: "initial" })
  const nameInputEl = useRef<any>(null)
  const emailInputEl = useRef<any>(null)

  const onSubmit: FormEventHandler = useCallback(async (event) => {
    event.preventDefault()
    setForm({ state: "loading" })

    const target = event.target as HTMLFormElement
    const data = new FormData(target)
    const email = data.get("email")
    const name = data.get("name")

    const body = JSON.stringify({
      name,
      email,
    })

    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
    })

    console.log("Sending this: ", { body })

    try {
      const response = await fetch(`/api/subscribe`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        headers,
        body,
      })
      const { error } = await response.json()
      if (error) {
        setForm({
          state: "error",
          message: error?.message ?? "Something went wrong. Please try again.",
        })
        return
      }

      if (process.env.NODE_ENV === "production") {
        trackGoal(FATHOM_NEWSLETTER_SUB_ID, 0)
      }

      setForm({
        state: "success",
        message: `Hooray! You're in ${nameInputEl.current.value}. Please check your inbox now to confirm your email address.`,
      })
      nameInputEl.current.value = ""
      emailInputEl.current.value = ""
    } catch (error) {
      setForm({
        state: "error",
        message: "Something went wrong. Please try again.",
      })
    }
  }, [])

  return (
    <section className="flex h-full w-full flex-col bg-accent p-8 md:p-6 lg:p-8 xl:p-16">
      <p className="my-4 text-3xl font-normal tracking-tight text-primary md:text-5xl lg:text-6xl">
        Subscribe to my Newsletter
      </p>

      <p className="my-1 max-w-4xl text-lg text-gray-800">
        Valuable insights, innovative ideas, and resources to help you improve
        your software development skills and advance your career. Expect to
        receive some business, marketing, and personal growth content.
      </p>
      <p className="my-1 max-w-4xl text-lg text-gray-800">
        No spam, unsubscribe at any time.
      </p>
      <form
        className="relative my-4 grid max-w-xl grid-cols-1 gap-4 md:grid-cols-3"
        onSubmit={onSubmit}
      >
        <input
          ref={nameInputEl}
          type="text"
          name="name"
          aria-label="First name"
          placeholder="First Name"
          autoComplete="given-name"
          className="rounded-full border border-gray-800   bg-accent px-5 py-3 text-gray-900 placeholder:text-gray-600 focus:outline-black"
          disabled={form.state === "loading"}
        />
        <input
          ref={emailInputEl}
          aria-label="Email for newsletter"
          placeholder="you@example.com"
          type="email"
          name="email"
          autoComplete="email"
          required
          className="rounded-full border border-gray-800 bg-accent px-5 py-3 text-gray-900 placeholder:text-gray-600 focus:outline-black"
          disabled={form.state === "loading"}
        />
        <Button
          type="submit"
          disabled={form.state === "loading"}
          renderAs="button"
          aria-label="Subscribe to newsletter"
        >
          {form.state === "loading" ? <LoadingSpinner /> : "Subscribe"}
        </Button>
      </form>

      {form.state === "error" ? (
        <ErrorMessage>{form.message}</ErrorMessage>
      ) : form.state === "success" ? (
        <SuccessMessage>{form.message}</SuccessMessage>
      ) : null}
    </section>
  )
}

function ErrorMessage({ children }: any) {
  return (
    <p className="flex items-center text-sm font-bold text-red-800 ">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mr-2 h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </p>
  )
}

function SuccessMessage({ children }: any) {
  return (
    <p className="flex items-center text-sm font-bold text-green-700 ">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mr-2 h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </p>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-gray-100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
