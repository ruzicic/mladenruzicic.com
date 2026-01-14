import { Metadata } from "next"
import Image from "next/image"

import { CalFloatingButton } from "../components/CalFloatingButton"
import { Icons } from "../components/icons"
import { TESTIMONIALS } from "../components/Testimonials"
import { TestimonialsSummary } from "../components/TestimonialsSummary"

export const metadata: Metadata = {
  title: "Mentoring | Mladen Ruzicic",
  description:
    "Mentoring for senior engineers and early leaders on staff-level impact, platform work, and career inflection points.",
}

const CREDIBILITY_STATS = [
  { value: "Top 2%", label: "Mentors on MentorCruise" },
  { value: "5+", label: "Years mentoring" },
  { value: "60+", label: "Engineers mentored" },
  { value: "5.0", label: "Average rating" },
]

const WHO_ITS_FOR = [
  "Senior engineers eyeing Staff+ roles",
  "New engineering managers finding their footing",
  "Platform and infra owners scaling impact",
  "Engineers navigating scope, visibility, or politics",
]

const WHO_ITS_NOT_FOR = [
  "Complete beginners learning to code",
  'Generic "tell me what to learn" requests',
  "Purely mock interview drills",
  "Quick resume reviews without context",
]

const TOPICS = [
  "Staff-level impact and scope",
  "Platform and design system strategy",
  "Cross-team influence and stakeholder alignment",
  "Execution systems: roadmaps, docs, RFCs",
  "Career moves: role shaping, negotiation, narrative",
  "Artifact feedback: PRDs, RFCs, architecture docs",
]

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Let's connect!",
    description:
      "It's on the house. Get started with a Discovery Session.",
  },
  {
    step: "02",
    title: "Get matched",
    description:
      "I'll follow up with a proposal based on our conversation.",
  },
  {
    step: "03",
    title: "Start working",
    description:
      "If all looks good, payment is requested, and we get to work!",
  },
]

// Card styling - alternating colors for visual variety
const CARD_STYLES = [
  "bg-primary text-white", // 0: Maciek
  "bg-white", // 1: Bruno
  "bg-[#E8BFE4]", // 2: Juliana
  "bg-primary text-white", // 3: Andy
  "bg-[#DFE8C0]", // 4: Monikka
  "bg-white", // 5: Adam
  "bg-white", // 6: Jobany
  "bg-[#FFEDE0]", // 7: Eyal
  "bg-primary text-white", // 8: Richard
]

// Column distribution for masonry layout (3 columns)
// Distribute testimonials to balance visual weight
const COLUMN_DISTRIBUTION = [
  [0, 4, 6], // Column 1: Maciek, Monikka, Jobany
  [1, 2, 7], // Column 2: Bruno, Juliana, Eyal
  [3, 5, 8], // Column 3: Andy, Adam, Richard
]

const TestimonialCard = ({
  testimonial,
  style,
}: {
  testimonial: (typeof TESTIMONIALS)[0]
  style: string
}) => {
  const isWhiteText = style.includes("text-white")

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl p-5 transition-all hover:shadow-lg ${style} border border-gray-100`}
    >
      <p
        className={`text-sm leading-relaxed ${isWhiteText ? "text-white" : "text-gray-700"}`}
      >
        {testimonial.text}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {testimonial.avatar ? (
          <Image
            height={32}
            width={32}
            alt={testimonial.customer || ""}
            src={testimonial.avatar}
            className="rounded-full"
          />
        ) : (
          <div
            className={`flex size-8 items-center justify-center rounded-full ${isWhiteText ? "bg-white/20" : "bg-gray-100"}`}
          >
            <Icons.user
              className={`size-4 ${isWhiteText ? "text-white/70" : "text-gray-400"}`}
            />
          </div>
        )}
        <div>
          <p className={`text-sm font-medium ${isWhiteText ? "text-white" : ""}`}>
            {testimonial.customer}
          </p>
          <p
            className={`text-xs ${isWhiteText ? "text-white/60" : "text-gray-400"}`}
          >
            MentorCruise
          </p>
        </div>
      </div>
    </article>
  )
}

export default function MentoringPage() {
  return (
    <>
      <CalFloatingButton
        calLink="ruzicic/15m-discovery-session"
        buttonText="Book a Discovery Call"
        buttonColor="1E1E1E"
        textColor="ffffff"
      />

      <main>
        {/* Hero Section */}
        <section className="pb-16 pt-12 md:pb-24 md:pt-20">
          <h1 className="max-w-3xl bg-gradient-to-b from-black to-gray-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent md:text-4xl lg:text-5xl">
            Mentoring for engineers who want leverage, not just growth.
          </h1>
          <p className="mt-6 max-w-2xl bg-gradient-to-b from-gray-600 to-gray-400 bg-clip-text text-lg font-light text-transparent md:text-xl">
            I mentor senior engineers and early leaders on staff-level impact,
            platform work, and career inflection points. Direct, pragmatic,
            heavy on decisions and artifacts.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              data-cal-link="ruzicic/15m-discovery-session"
              data-cal-namespace="15m-discovery-session"
              data-cal-config='{"layout":"month_view"}'
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Book a Discovery Call
            </button>
            <a
              href="#topics"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
            >
              See what we work on
            </a>
          </div>
        </section>

        {/* Credibility Strip - Card style */}
        <section className="py-16 md:py-24">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CREDIBILITY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-6 py-5"
              >
                <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Who It's For / Not For */}
        <section className="py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="mb-6 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-xl font-semibold text-transparent md:text-2xl">
                Who it's for
              </h2>
              <ul className="space-y-4">
                {WHO_ITS_FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Icons.check className="size-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-6 bg-gradient-to-b from-gray-600 to-gray-400 bg-clip-text text-xl font-semibold text-transparent md:text-2xl">
                Not a fit if
              </h2>
              <ul className="space-y-4">
                {WHO_ITS_NOT_FOR.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Icons.x className="size-3 text-gray-400" />
                    </div>
                    <span className="text-gray-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Topics / Outcomes */}
        <section id="topics" className="py-16 md:py-24">
          <h2 className="mb-8 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-xl font-semibold text-transparent md:text-2xl">
            What we work on
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => (
              <div
                key={topic}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="text-gray-700">{topic}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials - Masonry Layout */}
        <section className="py-16 md:py-24">
          <h2 className="mb-8 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-xl font-semibold text-transparent md:text-2xl">
            What mentees say
          </h2>

          {/* Masonry: 3 columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {COLUMN_DISTRIBUTION.map((columnIndices, colIdx) => (
              <div key={colIdx} className="flex flex-1 flex-col gap-3">
                {columnIndices.map((testimonialIdx) => (
                  <TestimonialCard
                    key={TESTIMONIALS[testimonialIdx].customer}
                    testimonial={TESTIMONIALS[testimonialIdx]}
                    style={CARD_STYLES[testimonialIdx]}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://mentorcruise.com/mentor/mladenruzicic/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 underline-offset-4 hover:underline"
            >
              More reviews on MentorCruise
            </a>
          </div>
        </section>

        {/* How It Works - Two column layout */}
        <section className="py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {/* Left column - Heading + CTA */}
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Mentoring
              </p>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
                Expert mentorship is one click away.
              </h2>
              <p className="mb-6 text-gray-500">
                Master your craft with a strong mentor at your side. Take the
                next step in your career on your terms for a flat monthly price.
                Each session is $120, and the goal is to give you x10 in value.
              </p>
              <p className="mb-8 text-gray-500">
                Whether you are a developer stuck in your career, or a startup
                wanting a second pair of eyes on a new feature, I can help. It
                all starts with a 15-min Discovery Session where we get to know
                each other and discuss your goals.
              </p>
              <div className="flex flex-col items-start gap-4 xl:flex-row xl:items-center">
                <button
                  data-cal-link="ruzicic/15m-discovery-session"
                  data-cal-namespace="15m-discovery-session"
                  data-cal-config='{"layout":"month_view"}'
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  Book a Discovery Call
                </button>
                <TestimonialsSummary />
              </div>
            </div>

            {/* Right column - Steps */}
            <div className="divide-y divide-gray-200">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="flex gap-6 py-6 first:pt-0 last:pb-0"
                >
                  <span className="text-sm text-gray-400">{item.step}</span>
                  <div>
                    <h3 className="mb-1 font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-gray-200 py-16 md:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="mb-4 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-semibold text-transparent md:text-3xl">
              Ready to start?
            </h2>
            <p className="mb-8 text-gray-600">
              Book a free 15-minute discovery call. No pitch, just a
              conversation to see if we&apos;re a fit.
            </p>
            <button
              data-cal-link="ruzicic/15m-discovery-session"
              data-cal-namespace="15m-discovery-session"
              data-cal-config='{"layout":"month_view"}'
              className="inline-flex cursor-pointer items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Book a Discovery Call
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
