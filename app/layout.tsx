import FathomAnalytics from 'app/components/FathomAnalytics'
import Footer from 'app/components/Footer'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Providers } from './providers'

import './globals.css'
import Navbar from './components/Navbar'

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
    <html
      // suppressHydrationWarning
      lang="en"
      className={ibmPlexSansFont.className}
    >
      <body className="bg-gray-50 dark:bg-gray-900 text-white dark:text-black">
        <Providers>
          <>
            <Navbar />

            <main id="skip" className="flex flex-col justify-center px-8  ">
              {children}
              <Footer />
            </main>

            <FathomAnalytics />
          </>
        </Providers>
      </body>
    </html>
  )
}
