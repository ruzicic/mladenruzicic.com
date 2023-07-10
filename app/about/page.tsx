import { Metadata } from 'next'
import PageContent from './page.mdx'

export const metadata: Metadata = {
  title: 'About',
}

export default function About() {
  return (
    <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
      <PageContent />
    </div>
  )
}
