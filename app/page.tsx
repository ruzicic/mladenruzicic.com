import React from "react"
import Image from "next/image"
import { DISCOVERY_SESSION_URL, MENTORSHIP_NEXT_STEPS } from "lib/constants"
import heroImage from "public/static/images/hero.webp"

import { Button } from "./components/Button"
import { Icons } from "./components/icons"
import { Testimonials } from "./components/Testimonials"
import { TestimonialsSummary } from "./components/TestimonialsSummary"

export default function Home() {
  return (
    <div>
      <section className="mb-8 flex w-full flex-col items-start justify-between gap-4 lg:mb-16  lg:mt-8 lg:flex-row lg:items-end xl:mb-24 xl:mt-16 xl:px-8">
        <h1 className="whitespace-nowrap bg-gradient-to-b from-black to-gray-400 bg-clip-text text-3xl font-normal tracking-tight text-transparent md:text-6xl">
          Hello,
          <br className="hidden lg:block" /> I&apos;m Mladen.
        </h1>

        <h2 className="max-w-lg bg-gradient-to-b from-gray-600 to-gray-400 bg-clip-text text-xl font-light text-transparent md:text-2xl">
          I&apos;m a software developer, mentor, and entrepreneur. Twelve years
          of creating engaging web experiences that connect with customers.
        </h2>
      </section>

      <section>
        <div className="relative w-full">
          <Image
            priority
            alt="Photo of Mladen Ruzicic with family"
            src={heroImage}
            className="rounded-t-xl"
          />

          <div className="absolute inset-0 h-full w-full bg-noise bg-auto bg-repeat opacity-60"></div>
        </div>

        <div className="mb-16 w-full rounded-b-xl bg-[#F2FE93] py-4 text-black">
          <p className="px-4 text-center font-mono text-sm">
            None would be possible without the biggest support.
          </p>
        </div>
      </section>
      <AboutMeSection />
      <CTASection />
      <MentoringSection />
      <Testimonials />
    </div>
  )
}

const AboutMeSection = () => (
  <section className="my-4 grid w-full grid-cols-1 gap-4 sm:my-8 lg:my-20 lg:grid-cols-2">
    <div>
      <p className="font-sans font-light uppercase tracking-widest">ABOUT ME</p>
    </div>

    <div className="flex flex-col items-start gap-4 text-lg font-light">
      <h3 className="mb-4 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-normal tracking-tight text-transparent md:mb-6 md:text-5xl">
        I build products.
      </h3>

      <p>
        I&apos;ve always been obsessed with perfecting the Developer Experience.
        From optimizing workflows to simplifying code, I love making life easier
        for myself and fellow developers.
      </p>

      <p>
        On the other hand, my business-oriented self has been keenly focused on
        delivering exceptional User Experiences.
      </p>

      <p>
        Somewhere along the way, I discovered my knack for unraveling complex
        tech concepts and transforming them into understandable language,
        naturally leading me to embrace the mentor role and to start this blog.
      </p>

      <p>
        Throughout my journey, I have consistently pursued my passion by
        creating side projects, fostering my creativity, and bringing ideas to
        life.
      </p>

      <Button
        href="/about"
        variant="link"
        size="auto"
        className="mt-4 flex flex-nowrap items-center"
      >
        <span className="mr-2">Read More</span>
        <Icons.externalLink className="h-3 w-3 fill-current" />
      </Button>
    </div>
  </section>
)

const CTASection = () => (
  <section className="mb-8 flex w-full flex-col items-start justify-between gap-6 rounded-lg bg-accent p-4 text-primary md:p-6 lg:mb-16 lg:flex-row lg:items-end lg:gap-10 lg:rounded-2xl lg:p-8 xl:p-16">
    <div className="w-full">
      <div className="mb-4 flex md:mb-20 lg:mb-40">
        <Icons.logo className="h-10 w-10 text-primary lg:h-20 lg:w-20" />
      </div>

      <p className="mb-4 font-sans font-light uppercase tracking-widest">
        CONTACT ME
      </p>
      <p className="text-2xl font-normal tracking-tight text-primary md:text-5xl lg:text-6xl ">
        Let’s create your next
        <br className="hidden md:block" /> big project together.
      </p>
    </div>

    <Button href={DISCOVERY_SESSION_URL} target="_blank" variant="outline">
      <span className="whitespace-nowrap">Get in Touch</span>
    </Button>
  </section>
)

const MentoringSection = () => (
  <section className="mb-8 md:mb-16">
    <p className="mb-4 font-sans font-light uppercase tracking-widest">
      MENTORING
    </p>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10 lg:gap-20">
      <div className="flex flex-col items-start gap-4 text-lg font-light">
        <h3 className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-normal tracking-tight text-transparent md:text-5xl lg:text-6xl">
          Expert mentorship is one click away.
        </h3>
        <p>
          Master your craft with a strong mentor at your side. Take the next
          step in your career on your terms for a flat monthly price. Each
          session is $120, and the goal is to give you x10 in value.
        </p>
        <p>
          Whether you are a developer stuck in your career, or a startup wanting
          a second pair of eyes on a new feature, I can help. It all starts with
          a 15-min Discovery Session where we get to know each other and discuss
          your goals.
        </p>

        <div className="mt-4 flex flex-col items-start gap-2 2xl:flex-row 2xl:items-center">
          <Button
            href={DISCOVERY_SESSION_URL}
            target="_blank"
            variant="default"
          >
            <span className="whitespace-nowrap">
              Schedule a Discovery Session
            </span>
          </Button>
          <TestimonialsSummary />
        </div>
      </div>

      <ul className="my-8 flex flex-col space-y-4 md:my-0">
        {MENTORSHIP_NEXT_STEPS.map(({ index, title, description }) => (
          <li
            key={index}
            className="flex gap-8 border-b-[1px] border-gray-300 pb-4"
          >
            <span className="font-mono">{index}</span>
            <div className="flex flex-col">
              <p className="mb-1 text-xl">{title}</p>
              <p className="text-lg font-light text-gray-500">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
)
