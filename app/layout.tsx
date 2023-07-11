import type { Metadata } from "next"
import localFont from "next/font/local"
import FathomAnalytics from "app/components/FathomAnalytics"
import Footer from "app/components/Footer"

import { Providers } from "./providers"

import "./globals.css"

import Header from "./components/Header"

export const metadata: Metadata = {
  metadataBase: new URL("https://mladenruzicic.com/"),
  title: {
    default: "Mladen Ruzicic",
    template: "%s | Mladen Ruzicic",
  },
  description: "Software developer, mentor, and entrepreneur",
  openGraph: {
    title: "Mladen Ruzicic",
    description: "Software developer, mentor, and entrepreneur",
    url: "https://mladenruzicic.com/opengraph-image.png",
    type: "website",
    locale: "en_US",
    siteName: "Mladen Ruzicic",
  },
  twitter: {
    title: "Mladen Ruzicic",
    card: "summary_large_image",
    images: ["https://mladenruzicic.com/opengraph-image.png"],
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
        <Providers>
          <main className="mx-auto flex w-full max-w-7xl flex-col bg-white">
            <Header />
            <div className="mx-4 mt-8 pb-16 sm:mx-8 lg:mx-16 lg:mt-16 xl:mx-20">
              {children}
            </div>
            <Footer />
            <FathomAnalytics />
          </main>
        </Providers>
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
