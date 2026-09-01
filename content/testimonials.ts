import {
  parseOrThrow,
  testimonialSchema,
  type Testimonial,
} from "@/lib/content/schema"
import { z } from "zod"

/**
 * Migrated from the old `app/components/Testimonials.tsx`.
 * `featured: true` marks the six that appear on the homepage as chat bubbles:
 * Maciek, Juliana, Monikka, Bruno, Jobany, Eyal.
 */
export const TESTIMONIALS: Testimonial[] = parseOrThrow(
  z.array(testimonialSchema),
  [
    {
      id: "maciek-sitkowski",
      author: "Maciek Sitkowski",
      avatar: "/static/mentees/maciek.webp",
      quote:
        "Mladen gives me work to do before our next call — this helps me focus on my goals and prepare well for our meetings.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "juliana-scapucin",
      author: "Juliana Scapucin",
      avatar: "/static/mentees/juliana.webp",
      quote:
        "Having Mladen as a mentor gave me the last push I needed in my career switch journey. He helped me achieve my goals even earlier than expected.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "monikka-edgeston",
      author: "Monikka Edgeston",
      avatar: "/static/mentees/monikka.webp",
      quote:
        "No hand-holding. He is a great accountability partner who will show you where you are in development through tests, exercises, and projects.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "bruno-krauss",
      author: "Bruno Krauss",
      avatar: "/static/mentees/bruno.webp",
      quote:
        "An exceptional mentor with a unique approach to peer programming, enhancing coding styles, and excellent technical decision-making.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "jobany-aguilar",
      author: "Jobany Aguilar",
      avatar: "/static/mentees/jobany.webp",
      quote:
        "Mladen knows how to take control of the conversation and keep it focused on progress and results. Great dude that knows his stuff.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "eyal-fisher",
      author: "Eyal Fisher",
      avatar: "/static/mentees/eyal.webp",
      quote:
        "He helps me grasp many important technologies, concepts and techniques. I highly recommend Mladen if you want to become a great front-end dev.",
      source: "mentorcruise",
      permission: "public",
      featured: true,
    },
    {
      id: "richard-esquivel",
      author: "Richard Esquivel",
      avatar: "/static/mentees/richard.webp",
      quote:
        "Mladen has consistently provided great insight and guidance to support my tech career growth from both a professional and personal perspective. He's empathetic, insightful, and relatable, making him an ideal mentor for the industry.",
      source: "mentorcruise",
      permission: "public",
    },
    {
      id: "adam-gornas",
      author: "Adam Gornas",
      quote:
        "Mladen's guidance in code reviews and side project ideation has significantly improved my skills and portfolio. The collaborative atmosphere he fosters makes the learning process enjoyable.",
      source: "mentorcruise",
      permission: "public",
    },
    {
      id: "andy-yudin",
      author: "Andy Yudin",
      quote:
        "He provides valuable insights during every session and helps me focus on my goals.",
      source: "mentorcruise",
      permission: "public",
    },
  ],
  "content/testimonials.ts"
)
