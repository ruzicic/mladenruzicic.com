import { Metadata } from "next"

import PageContent from "./page.mdx"

export const metadata: Metadata = {
  title: "Uses",
}

export default function Uses() {
  return (
    <section className="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center">
      <PageContent />
    </section>
  )
}
