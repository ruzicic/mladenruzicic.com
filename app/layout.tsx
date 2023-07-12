import type { Metadata } from "next"
import localFont from "next/font/local"
import FathomAnalytics from "app/components/FathomAnalytics"
import Footer from "app/components/Footer"

import "./globals.css"

import Header from "./components/Header"

const title = "Mladen Ruzicic"
const description = "Software developer, mentor, and entrepreneur"
const imageUrl = "https://mladenruzicic.com/static/images/opengraph-image.png"

export const metadata: Metadata = {
  metadataBase: new URL("https://mladenruzicic.com/"),
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  openGraph: {
    title,
    description,
    url: imageUrl,
    type: "website",
    locale: "en_US",
    siteName: title,
    images: [
      {
        alt: `${title} - ${description}`,
        url: imageUrl,
        width: 1920,
        height: 1080,
      },
    ],
  },
  twitter: {
    title,
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

const ibmPlexSansFont = localFont({
  src: "./fonts/ibm-plex-sans-var.woff2",
  display: "swap",
  preload: true,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={ibmPlexSansFont.className}>
      <body className="p-0 sm:p-4 md:p-8 lg:p-16 xl:p-20">
        <NoisyGradientBackground />
        <main className="mx-auto flex w-full max-w-7xl flex-col bg-white">
          <Header />
          <div className="mx-4 mt-8 pb-16 sm:mx-8 lg:mx-16 lg:mt-16 xl:mx-20">
            {children}
          </div>
          <Footer />
          <FathomAnalytics />
        </main>
      </body>
    </html>
  )
}

const NoisyGradientBackground = () => (
  <div className="fixed inset-0 -z-10 h-full w-full bg-[#cae9e3]">
    <div className="blur-3xl">
      <div className="absolute h-[100rem] w-[50rem] rotate-45 rounded-full bg-[#cae9e3]"></div>
      <div className="absolute ml-auto h-[60rem] w-[60rem] rounded-full bg-[#b5cde6]"></div>
    </div>
    <div className="absolute inset-0 h-full w-full bg-noise bg-auto bg-repeat opacity-30"></div>
  </div>
)
