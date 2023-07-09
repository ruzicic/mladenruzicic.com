'use client'

import { TESTIMONIALS } from './Testimonials'
import Image from 'next/image'
import { Icons } from './icons'

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
            src={avatar ?? ''}
            className="border-2 border-white rounded-full"
          />
        ))}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, index) => (
            <Icons.star
              key={index}
              className="w-6 h-6 text-yellow-400 fill-current"
            />
          ))}
        </div>

        <div className="font-normal text-sm tracking-tight">
          5.0 from 30+ mentees
        </div>
      </div>
    </div>
  )
}
