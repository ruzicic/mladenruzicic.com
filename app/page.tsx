import Image from 'next/image'
import React from 'react'
import NewsletterBanner from 'app/components/NewsletterBanner'
import heroImage from 'public/static/images/hero.webp'
import { Button } from './components/Button'
import { Icons } from './components/icons'
import { Testimonials } from './components/Testimonials'
import { TestimonialsSummary } from './components/TestimonialsSummary'
import { DISCOVERY_SESSION_URL, MENTORSHIP_NEXT_STEPS } from 'lib/constants'

export default function Home() {
  return (
    <div>
      <section className="flex flex-col lg:flex-row w-full justify-between items-start lg:items-end gap-4  mb-8 lg:mb-16 lg:mt-8 xl:mt-16 xl:mb-24 xl:px-8">
        <h1 className="font-normal text-3xl md:text-6xl tracking-tight bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent whitespace-nowrap">
          Hello,
          <br className="hidden lg:block" /> I&apos;m Mladen.
        </h1>

        <h2 className="font-light text-xl md:text-2xl bg-gradient-to-b from-gray-600 to-gray-400 bg-clip-text text-transparent max-w-lg">
          I&apos;m a software developer, mentor, and entrepreneur. Twelve years
          of creating engaging web experiences that connect with customers.
        </h2>
      </section>

      <section>
        <div className="w-full relative">
          <Image
            priority
            alt="Photo of Mladen Ruzicic with family"
            src={heroImage}
            className="rounded-t-xl"
          />

          <div className="bg-noise bg-auto bg-repeat absolute w-full h-full opacity-60 top-0 left-0 right-0 bottom-0"></div>
        </div>

        <div className="w-full bg-[#F2FE93] text-black rounded-b-xl py-4 mb-16">
          <p className="text-center font-mono text-sm px-4">
            None would be possible
            <wbr /> without the biggest support.
          </p>
        </div>
      </section>
      <AboutMeSection />
      <CTASection />
      <MentoringSection />
      <Testimonials />

      {/* <NewsletterBanner /> */}
    </div>
  )
}

const AboutMeSection = () => (
  <section className="w-full my-4 sm:my-8 lg:my-20 grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div>
      <p className="uppercase font-sans tracking-widest font-light">ABOUT ME</p>
    </div>

    <div className="flex flex-col gap-4 text-lg font-light items-start">
      <h3 className="font-normal text-2xl md:text-5xl tracking-tight mb-4 md:mb-6 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">
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
        className="flex flex-nowrap items-center mt-4"
      >
        <span className="mr-2">Read More</span>
        <Icons.externalLink className="h-3 w-3 fill-current" />
      </Button>
    </div>
  </section>
)

const CTASection = () => (
  <section className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-16 gap-6 lg:gap-10 bg-accent text-primary rounded-lg lg:rounded-2xl p-4 md:p-6 lg:p-8 xl:p-16">
    <div className="w-full">
      <div className="flex mb-4 md:mb-20 lg:mb-40">
        <Icons.logo className="h-10 w-10 lg:h-20 lg:w-20 text-primary" />
      </div>

      <p className="uppercase font-sans tracking-widest font-light mb-4">
        CONTACT ME
      </p>
      <p className="font-normal text-2xl md:text-5xl lg:text-6xl tracking-tight text-primary ">
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
    <p className="uppercase font-sans tracking-widest font-light mb-4">
      MENTORING
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 lg:gap-20">
      <div className="flex flex-col items-start gap-4 text-lg font-light">
        <h3 className="font-normal text-2xl md:text-5xl lg:text-6xl tracking-tight bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">
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

        <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center gap-2 mt-4">
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

      <ul className="flex flex-col my-8 md:my-0">
        {MENTORSHIP_NEXT_STEPS.map(({ index, title, description }) => (
          <li
            key={index}
            className="flex gap-8 border-b-[1px] border-gray-300 pb-4"
          >
            <span className="font-mono text-md">{index}</span>
            <div className="flex flex-col">
              <p className="text-xl mb-1">{title}</p>
              <p className="text-lg font-light text-gray-500">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
)
