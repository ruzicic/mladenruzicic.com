import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ThemeProvider } from 'next-themes'
import { useAnalytics } from 'hooks/useAnalytics'

function MyApp({ Component, pageProps }: AppProps) {
  useAnalytics()

  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
