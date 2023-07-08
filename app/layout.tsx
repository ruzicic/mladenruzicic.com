import FathomAnalytics from 'app/components/FathomAnalytics'
import Footer from 'app/components/Footer'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from './providers'

import './globals.css'
import Header from './components/Header'

export const metadata: Metadata = {
  metadataBase: new URL('https://mladenruzicic.com/'),
  title: {
    default: 'Mladen Ruzicic',
    template: '%s | Mladen Ruzicic',
  },
  description: 'Senior Frontend Developer at Shopify',
  openGraph: {
    title: 'Mladen Ruzicic',
    description: 'Senior Frontend Developer at Shopify',
    url: 'https://mladenruzicic.com/',
    type: 'website',
    locale: 'en_US',
    siteName: 'Mladen Ruzicic',
  },
  twitter: {
    title: 'Mladen Ruzicic',
    card: 'summary_large_image',
  },
}

const ibmPlexSansFont = localFont({
  src: './fonts/ibm-plex-sans-var.woff2',
  display: 'swap',
  preload: true,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={ibmPlexSansFont.className}>
      <body className="p-4 sm:p-6 md:p-8 lg:p-16 xl:p-20">
        <NoisyGradientBackground />
        <Providers>
          <main className="bg-white flex flex-col w-full ml-auto mr-auto max-w-7xl">
            <Header />
            <div className="mx-12 lg:mx-16 xl:mx-20 mt-8 lg:mt-16 pb-16">
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
  <div className="-z-10 w-full h-full bg-[#cae9e3] fixed top-0 left-0 right-0 bottom-0">
    <div className="blur-3xl">
      <div className="absolute t-[-10rem] l-36 rotate-45 w-[50rem] h-[100rem] bg-[#cae9e3] rounded-full"></div>
      <div className="absolute w-[60rem] h-[60rem] bg-[#b5cde6] rounded-full rotate-60 ml-auto t-[-10rem] r-[-20rem]"></div>
    </div>
    <div className="bg-noise bg-auto bg-repeat absolute w-full h-full opacity-30 top-0 left-0 right-0 bottom-0"></div>
  </div>
)
