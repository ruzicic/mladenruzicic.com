import { useRef, useState } from 'react'

type FormState = 'initial' | 'loading' | 'success' | 'error'
type Form = {
  state: FormState
  message?: string
}

export default function NewsletterBanner() {
  const [form, setForm] = useState<Form>({ state: 'initial' })
  const inputEl = useRef<any>(null)

  const subscribe = async (e: any) => {
    e.preventDefault()
    setForm({ state: 'loading' })

    const res = await fetch('/api/subscribe', {
      body: JSON.stringify({
        email: inputEl.current.value,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const { error } = await res.json()
    if (error) {
      setForm({
        state: 'error',
        message: error,
      })
      return
    }

    // trackGoal('JYFUFMSF', 0)
    inputEl.current.value = ''
    setForm({
      state: 'success',
      message: `Hooray! You're now on the list.`,
    })
  }

  return (
    <>
      <section className="w-full rounded-2xl bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#FECACA] p-1">
        <div className="p-5 md:p-7 h-full rounded-2xl bg-white dark:bg-black flex flex-col">
          <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Join the newsletter
          </h3>
          <p className="my-1 text-gray-800 dark:text-gray-200">For weekly notes and moments</p>
          <form className="relative my-4" onSubmit={subscribe}>
            <input
              ref={inputEl}
              aria-label="Email for newsletter"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
              className="w-full  rounded-xl p-4 focus:outline-black bg-banner dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={form.state === 'loading'}
            />
            <button
              className="flex items-center justify-center absolute right-2 top-2 px-4 font-medium h-10 bg-gray-700 text-gray-100 rounded-lg w-28"
              type="submit"
              disabled={form.state === 'loading'}
            >
              {form.state === 'loading' ? <LoadingSpinner /> : 'Subscribe'}
            </button>
          </form>
          {form.state === 'error' ? (
            <ErrorMessage>{form.message}</ErrorMessage>
          ) : form.state === 'success' ? (
            <SuccessMessage>{form.message}</SuccessMessage>
          ) : null}
        </div>
      </section>
    </>
  )
}

function ErrorMessage({ children }: any) {
  return (
    <p className="flex items-center text-sm font-bold text-red-800 dark:text-red-400">
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
    <p className="flex items-center text-sm font-bold text-green-700 dark:text-green-400">
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
      className="animate-spin h-5 w-5 text-gray-100"
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
