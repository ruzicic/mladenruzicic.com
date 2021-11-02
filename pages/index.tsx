import Image from 'next/image'
import Link from 'next/link'

import Container from 'components/Container'
import ShopifyLogo from 'components/ShopifyLogo'
import React from 'react'
import NewsletterBanner from 'components/NewsletterBanner'
import ProjectCardMini from 'components/ProjectCardMini'

export default function Home() {
  return (
    <Container>
      <div className="flex flex-col justify-center items-start max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pb-16">
        <div className="flex flex-col-reverse sm:flex-row items-start">
          <div className="flex flex-col pr-8">
            <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-1 text-black dark:text-white">
              Mladen Ružičić
            </h1>
            <h2 className="text-gray-700 dark:text-gray-200 mb-4">
              Senior Frontend Developer at <ShopifyLogo />
              <span className="font-semibold">Shopify</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-16">
              Based in Switzerland. Infinitely curious and passionate about software. Crypto enthusiast. Girl dad.
            </p>
          </div>
          <div className="w-[80px] sm:w-[176px] relative mb-8 sm:mb-0 mr-auto">
            <Image
              alt="Mladen Ruzicic"
              height={176}
              width={176}
              src="/mladen-ruzicic.jpg"
              className="rounded-full filter grayscale"
            />
          </div>
        </div>
        <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-6 text-black dark:text-white">
          Recent Projects
        </h3>
        <div className="w-full flex gap-3 md:gap-6 flex-col md:flex-row">
          <ProjectCardMini src="/static/images/shop.svg" title="Shop.app" href="https://shop.app"/>
          <ProjectCardMini src="/static/images/hegias.svg" title="HEGIAS CMS" href="https://hegias.com"/>
          <ProjectCardMini src="/static/images/panciona.svg" title="Panciona" href="https://panciona.com"/>
        </div>
        <Link href="/projects">
          <a className="flex mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6">
            See all projects
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 ml-1"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
              />
            </svg>
          </a>
        </Link>
        {/* <h3 className="font-bold text-2xl md:text-4xl tracking-tight mb-4 mt-16 text-black dark:text-white">
          Digital Garden
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          An open collection of notes, resources, and explorations I have
          stumbled across or have engaged with.
        </p>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.youtube.com/playlist?list=PL6bwFJ82M6FXgctyoWXqj7H0GK8_YIeF1"
          className="flex mt-8 text-gray-600 dark:text-gray-400 leading-7 rounded-lg hover:text-gray-800 dark:hover:text-gray-200 transition-all h-6"
        >
          Read more posts
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 ml-1"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.5 12h-15m11.667-4l3.333 4-3.333-4zm3.333 4l-3.333 4 3.333-4z"
            />
          </svg>
        </a> */}
        <span className="h-16" />
        <NewsletterBanner />
      </div>
    </Container>
  )
}
