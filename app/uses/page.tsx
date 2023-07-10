import { Metadata } from 'next'
import PageContent from './page.mdx'

export const metadata: Metadata = {
  title: 'Uses',
}

export default function Uses() {
  return (
    <section className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
      <PageContent />
    </section>
  )
}
