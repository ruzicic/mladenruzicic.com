"use client"

import { useRef, useState } from "react"
import { trackGoal } from "fathom-client"

import { Button } from "./Button"

type FormState = "initial" | "loading" | "success" | "error"
type Form = {
  state: FormState
  message?: string
}

export default function NewsletterBanner() {
  const [form, setForm] = useState<Form>({ state: "initial" })
  const nameInputEl = useRef<any>(null)
  const emailInputEl = useRef<any>(null)

  const subscribe = async (e: any) => {
    e.preventDefault()
    setForm({ state: "loading" })

    // const res = await fetch('/api/subscribe', {
    //   body: JSON.stringify({
    //     email: inputEl.current.value,
    //   }),
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   method: 'POST',
    // })

    // const { error } = await res.json()
    // if (error) {
    //   setForm({
    //     state: 'error',
    //     message: error,
    //   })
    //   return
    // }

    // trackGoal('SWSM6DKP', 0)

    setForm({
      state: "success",
      message: `Hooray! You're in ${nameInputEl.current.value}. Please check your inbox now to confirm your email address.`,
    })
    nameInputEl.current.value = ""
    emailInputEl.current.value = ""
  }

  return (
    <section className="w-full rounded-2xl bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#FECACA] p-1">
      <div className="flex h-full flex-col rounded-2xl bg-white p-5  md:p-7">
        <h6 className="text-xl font-light md:text-2xl">Join my newsletter</h6>

        <p className="my-1 text-gray-500">
          Sharing valuable insights, innovative ideas, and resources to help you
          improve your software development skills and advance your career in
          tech.
        </p>
        <form className="relative my-4 flex gap-2" onSubmit={subscribe}>
          <input
            ref={nameInputEl}
            type="text"
            aria-label="First name"
            placeholder="First Name"
            autoComplete="given-name"
            className="w-full rounded-full border   border-gray-800 p-4 text-gray-900 focus:outline-black"
            disabled={form.state === "loading"}
          />
          <input
            ref={emailInputEl}
            aria-label="Email for newsletter"
            placeholder="you@example.com"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-full border border-gray-800 p-4 text-gray-900 focus:outline-black"
            disabled={form.state === "loading"}
          />
          <Button
            type="submit"
            disabled={form.state === "loading"}
            renderAs="button"
          >
            {form.state === "loading" ? <LoadingSpinner /> : "Subscribe"}
          </Button>
        </form>

        {form.state === "error" ? (
          <ErrorMessage>{form.message}</ErrorMessage>
        ) : form.state === "success" ? (
          <SuccessMessage>{form.message}</SuccessMessage>
        ) : null}
      </div>
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
