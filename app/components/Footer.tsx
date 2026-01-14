import Link from "next/link"

import { Icons } from "./icons"

// Configuration - easy to update
const EMAIL = "ruzicic@gmail.com"
const LINKEDIN_URL = "https://www.linkedin.com/in/ruzicic/"
const GITHUB_URL = "https://github.com/ruzicic"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mx-4 border-t border-gray-200 sm:mx-8 lg:mx-16 xl:mx-20">
      {/* Two-card CTA section */}
      <section className="py-14 md:py-20">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            Next conversation
          </p>
          <h2 className="mb-2 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
            Let's connect
          </h2>
          <p className="text-gray-500">
            For collaboration, mentoring, or platform-level work.
          </p>
        </div>

        {/* Two-card layout */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {/* Left card: Direct contact */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-500">
                Direct contact
              </h3>
              <a
                href={`mailto:${EMAIL}`}
                className="mb-4 block text-xl font-semibold transition-colors hover:text-gray-600 md:text-2xl"
              >
                {EMAIL}
              </a>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">
                If you're exploring collaboration, platform work, or advisory
                support, send a short note with context and constraints. I
                usually reply within a working day.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                  Remote · Europe-friendly
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
                  Response &lt;24h
                </span>
              </div>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                Email Mladen
                <Icons.arrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Right card: Other paths */}
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
            <div>
              <h3 className="mb-4 text-sm font-medium text-gray-500">
                Other paths
              </h3>
              <p className="mb-6 text-gray-700">
                Prefer a structured format or mentoring?
              </p>
              <ul className="mb-6 space-y-3">
                <li>
                  <Link
                    href="/mentoring"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                  >
                    <Icons.arrowRight className="h-4 w-4" />
                    Mentoring
                  </Link>
                </li>
                <li>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                  >
                    <Icons.linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                  >
                    <Icons.github className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <Link
              href="/mentoring"
              className="inline-flex w-fit items-center gap-1 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
            >
              Mentoring & working sessions
              <Icons.arrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Copyright bar */}
      <div className="flex items-center justify-center border-t border-gray-200 py-6">
        <p className="text-sm text-gray-400">© {currentYear} Mladen Ruzicic</p>
      </div>
    </footer>
  )
}
