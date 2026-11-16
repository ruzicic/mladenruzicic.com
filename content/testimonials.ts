import { z } from "zod"

import {
  parseOrThrow,
  testimonialSchema,
  type Testimonial,
} from "@/lib/content/schema"

/**
 * Migrated from the old `app/components/Testimonials.tsx`.
 * `featured: true` marks the six that appear on the homepage as chat bubbles:
 * Maciek, Juliana, Monikka, Bruno, Jobany, Eyal.
 *
 * The last eight (Maximilian to Roki) were added on 2026-11-12 from his public
 * MentorCruise profile (`mentors.to/ruzicic`). Each quote is a contiguous run
 * of whole sentences from the review, verbatim, typos included; the author is
 * the first name exactly as the profile shows it. `duration` and `year` are
 * the mentorship length and review year the profile shows, for all seventeen.
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
      duration: "3 months",
      year: 2023,
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
      duration: "1 month",
      year: 2022,
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
      duration: "2 months",
      year: 2022,
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
      duration: "2 months",
      year: 2023,
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
      duration: "1 month",
      year: 2022,
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
      duration: "8 months",
      year: 2022,
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
      duration: "1.5 years",
      year: 2023,
    },
    {
      id: "adam-gornas",
      author: "Adam Gornas",
      quote:
        "Mladen's guidance in code reviews and side project ideation has significantly improved my skills and portfolio. The collaborative atmosphere he fosters makes the learning process enjoyable.",
      source: "mentorcruise",
      permission: "public",
      duration: "1 month",
      year: 2023,
    },
    {
      id: "andy-yudin",
      author: "Andy Yudin",
      quote:
        "He provides valuable insights during every session and helps me focus on my goals.",
      source: "mentorcruise",
      permission: "public",
      duration: "4 months",
      year: 2023,
    },
    {
      id: "maximilian",
      author: "Maximilian",
      quote:
        "What I liked most was that his guidance was not only insightful, but also very human. He listened well, understood where I was coming from, and gave advice that felt relevant and actionable.",
      source: "mentorcruise",
      permission: "public",
      duration: "1 month",
      year: 2026,
    },
    {
      id: "juan",
      author: "Juan",
      quote:
        "Don't get me wrong, he will tell you what you need to hear many times, and that can sometimes not be what you want to hear, but I think that's one of the biggest benefits of having a mentor.",
      source: "mentorcruise",
      permission: "public",
      duration: "2 months",
      year: 2025,
    },
    {
      id: "aleksandar",
      author: "Aleksandar",
      quote:
        "He was checking in daily, following my progress, and making sure I stay on track with my goals. That kind of consistency really helped me stay focused.",
      source: "mentorcruise",
      permission: "public",
      duration: "3 months",
      year: 2025,
    },
    {
      id: "martynas",
      author: "Martynas",
      quote:
        "I reached out to Mladen to help evaluate career growth in the new era of AI-enhanced development, and he did an honest job to identify opportunities to grow and what really matters in today's workplace.",
      source: "mentorcruise",
      permission: "public",
      duration: "2 months",
      year: 2026,
    },
    {
      id: "kristian-august",
      author: "Kristian August",
      quote:
        "Mladen has been a great help in launching my product, providing invaluable insights on structuring my project and optimizing it for SEO.",
      source: "mentorcruise",
      permission: "public",
      duration: "1 month",
      year: 2025,
    },
    {
      id: "ivan",
      author: "Ivan",
      quote:
        "With his support, I successfully built an app which I have already succeed to publish on both the App Store and Google Play.",
      source: "mentorcruise",
      permission: "public",
      duration: "6 months",
      year: 2023,
    },
    {
      id: "luis",
      author: "Luis",
      quote:
        "As a senior software engineer, I truly appreciate this incredible guidance and advice.",
      source: "mentorcruise",
      permission: "public",
      duration: "2 years",
      year: 2024,
    },
    {
      id: "roki",
      author: "Roki",
      quote:
        "He becomes a mentor as much as a friend. He truly wants to bring value during the 60 minutes together, whether that's links to check out, a pitch deck to listen through or feedback on your work.",
      source: "mentorcruise",
      permission: "public",
      duration: "3 months",
      year: 2025,
    },
  ],
  "content/testimonials.ts"
)
