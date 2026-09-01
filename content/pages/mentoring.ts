import type { Mentoring } from "@/lib/content/schema"

export const MENTORING = {
  seo: {
    title: "Mentoring",
    description:
      "One-to-one mentoring for engineers who want to ship: architecture, code review, career decisions and the habits behind senior work.",
  },
  h1: "Mentoring engineers who want to ship.",
  lede: "I have mentored more than thirty engineers through MentorCruise, mostly mid-level developers pushing toward senior and career switchers who need someone to be straight with them. It is a small, deliberate part of what I do. I take a handful of people at a time, because anything more stops being useful.",
  whoFor: [
    "Mid-level engineers who can build features and want to know what separates them from the senior people around them.",
    "Career switchers who have finished the courses and now need real feedback on real code.",
    "Frontend and React Native engineers moving toward architecture, design systems and platform work.",
    "Engineers stepping into their first lead or product-facing role, where the hard part stops being the code.",
    "Founders and small teams who want a second pair of eyes on a technical direction before committing to it.",
  ],
  howItWorks: [
    {
      title: "Discovery call",
      body: "Fifteen minutes, free, no pitch. You describe where you are and what you are trying to reach; I tell you honestly whether I am the right person for it. If the answer is no, I say so on the call rather than after you have paid for a month.",
    },
    {
      title: "A plan, not a vibe",
      body: "We agree on what changes in the next three months and how we will know it happened: a shipped project, a passed interview loop, a refactor that survives review. Vague goals produce vague sessions.",
    },
    {
      title: "Sessions with homework",
      body: "Regular calls, with work between them. You write code, I review it the way I would review a colleague's pull request, and we spend the call on the decisions rather than the syntax. The work between sessions is where the progress actually happens.",
    },
    {
      title: "Async in between",
      body: "Code review, architecture questions and the occasional 'is this a bad idea' message. Most of the useful feedback happens outside the calendar.",
    },
  ],
  topics: [
    "Frontend architecture and state management that survives a second year",
    "React and React Native in production, including performance on bad devices and slow networks",
    "Design systems: component API design, versioning and getting other teams to adopt them",
    "Code review: giving it, receiving it, and reading a diff for intent instead of style",
    "Testing strategy that people actually maintain",
    "Working with AI tools without outsourcing your judgment to them",
    "Scoping, estimating and saying no with a reason attached",
    "Interview preparation and the difference between a senior title and senior work",
    "Moving from engineer toward product ownership and technical leadership",
  ],
  expectations: [
    "You do the work between sessions. I will not carry a plan on my own.",
    "Direct feedback. If the code or the plan is wrong, I will say so and explain why.",
    "No hand-holding and no syllabus. We work on your code, your project and your decisions.",
    "Bring specifics. 'How do I get better at React' produces a worse session than a pull request you are unsure about.",
    "Progress is measured in shipped things, not hours attended.",
    "I will tell you when you have outgrown the arrangement. That is the goal.",
  ],
  cta: {
    label: "Start on MentorCruise",
    url: "https://mentors.to/ruzicic",
    note: "Availability, plans and reviews live on MentorCruise. Start with the free discovery call.",
  },
} satisfies Mentoring
