import Image from "next/image"

import { Icons } from "./icons"
import { TESTIMONIALS } from "./Testimonials"

export const TestimonialsSummary = () => {
  const fiveTestimonialsWithAvatar = TESTIMONIALS.filter(({ avatar }) =>
    Boolean(avatar)
  ).slice(0, 5)

  return (
    <div className="flex items-center space-x-2">
      <div className="flex -space-x-4">
        {fiveTestimonialsWithAvatar.map(({ avatar, customer }) => (
          <Image
            key={avatar}
            height={40}
            width={40}
            alt={customer}
            src={avatar ?? ""}
            className="rounded-full border-2 border-white"
          />
        ))}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, index) => (
            <Icons.star
              key={index}
              className="h-6 w-6 fill-current text-yellow-400"
            />
          ))}
        </div>

        <div className="text-sm font-normal tracking-tight">
          5.0 from 30+ mentees
        </div>
      </div>
    </div>
  )
}
