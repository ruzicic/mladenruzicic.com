import { DISCOVERY_SESSION_URL } from "lib/constants"

import { Button } from "./Button"

export const NextStepsBanner = () => {
  return (
    <section className="w-full rounded-2xl bg-gradient-to-r from-[#FDE68A] via-[#FCA5A5] to-[#FECACA] p-1">
      <div className="flex h-full flex-col rounded-2xl bg-white p-5  md:p-7">
        <h6 className="text-xl font-light md:text-2xl">
          Mentoring: Next steps
        </h6>

        <p className="mb-4 text-gray-500">
          If you&apos;d like to meet and see if we&apos;re a good fit for a
          mentoring session, it doesn&apos;t get any easier than this:
        </p>

        <Button href={DISCOVERY_SESSION_URL} target="_blank" variant="outline">
          <span className="whitespace-nowrap">Book a Discovery Session</span>
        </Button>
      </div>
    </section>
  )
}
