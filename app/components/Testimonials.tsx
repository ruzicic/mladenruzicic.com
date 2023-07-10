import { HTMLAttributes } from "react"
import Image from "next/image"

import { Icons } from "./icons"

type Testimonial = {
  // default: 1x1, tall: 1x2, wide: 2x1, big: 2x2
  size: "default" | "tall" | "wide" | "big"
  className: HTMLAttributes<HTMLDivElement>["className"]
  text?: string
  customer?: string
  avatar?: string
  source?: "mentorcruise" | "linkedin" | "twitter" | "n/a"
}

export const TESTIMONIALS = [
  {
    size: "big",
    text: "Mladen's enthusiasm and positivity have made our meetings enjoyable and motivating. I appreciate the time and effort he puts into preparing for our calls. One of the things I enjoy the most is that Mladen gives me work to do before our next call - this helps me focus on my goals and prepare well for our meetings.",
    customer: "Maciek Sitkowski",
    source: "mentorcruise",
    className: "bg-primary text-white",
    avatar: "/static/mentees/maciek.webp",
  },
  {
    size: "wide",
    text: "Mladen is an exceptional mentor with a unique approach to peer programming, enhancing coding styles, and he demonstrates excellent technical decision-making skills.",
    customer: "Bruno Krauss",
    source: "mentorcruise",
    className: "",
    avatar: "/static/mentees/bruno.webp",
  },
  {
    size: "wide",
    text: "Having Mladen as a mentor gave me the last push I needed in my career switch journey. He helped me achieve my goals even earlier than expected, and I'm super thrilled with the new role I started this month. I just couldn't ask for more. Thank you!",
    customer: "Juliana Scapucin",
    source: "mentorcruise",
    className: "bg-[#E8BFE4]",
    avatar: "/static/mentees/juliana.webp",
  },

  {
    size: "default",
    text: "He provides valuable insights during every session and helps me focus on my goals!",
    customer: "Andy Yudin",
    source: "mentorcruise",
    className: "bg-primary text-white",
  },
  {
    size: "tall",
    text: "No hand-holding. He is a great accountability partner who will show you where you are in development through tests, exercises, and projects.",
    customer: "Monikka Edgeston",
    source: "mentorcruise",
    className: "bg-[#DFE8C0]",
    avatar: "/static/mentees/monikka.webp",
  },
  {
    size: "wide",
    text: "Mladen's guidance in code reviews and side project ideation has significantly improved my skills and portfolio. The collaborative atmosphere he fosters makes the learning process enjoyable.",
    customer: "Adam Gornas",
    source: "mentorcruise",
    className: "",
  },
  {
    size: "wide",
    text: "Mladen knows how to take control of the conversation and keep it focused on progress and results. Great dude that knows his stuff.",
    customer: "Jobany Aguilar",
    source: "mentorcruise",
    className: "",
    avatar: "/static/mentees/jobany.webp",
  },
  {
    size: "tall",
    text: "Mladen is super knowledgeable and smart. He helps me grasp many important technologies, concepts and techniques. I highly recommend Mladen if you want to become a great front-end dev.",
    customer: "Eyal Fisher",
    source: "mentorcruise",
    className: "bg-[#FFEDE0]",
    avatar: "/static/mentees/eyal.webp",
  },
  {
    size: "wide",
    text: "Mladen has consistently provided great insight and guidance to support my tech career growth from both a professional and personal perspective. He's empathetic, insightful, and relatable, making him an ideal mentor for the industry.",
    customer: "Richard Esquivel",
    source: "mentorcruise",
    className: "bg-primary text-white",
    avatar: "/static/mentees/richard.webp",
  },
] satisfies Testimonial[]

export const Testimonials = () => {
  return (
    <section className="masonry-wrapper">
      {TESTIMONIALS.map((testimonial) => (
        <article
          key={testimonial.text}
          className={`${testimonial.size} text-xl ${testimonial.className}`}
        >
          <div className="flex flex-col justify-between">
            <div className="line-clamp-6 font-light lg:line-clamp-none">
              {testimonial.text}
            </div>
            <div className="flex items-center space-x-2">
              {testimonial.avatar ? (
                <Image
                  height={40}
                  width={40}
                  alt={testimonial.customer}
                  src={testimonial.avatar}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
                  <Icons.user className="h-5 w-5" />
                </div>
              )}
              <p className="text-sm font-medium">{testimonial.customer}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
