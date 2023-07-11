import { Metadata } from "next"

import PageContent from "./page.mdx"

export const metadata: Metadata = {
  title: "About",
}

export default function About() {
  return (
    <div className="mx-auto mb-16 flex max-w-2xl flex-col items-start justify-center">
      <PageContent />
    </div>
  )
}
