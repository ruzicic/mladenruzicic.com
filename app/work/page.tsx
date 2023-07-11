import { Metadata } from "next"
import ProjectCard from "app/components/ProjectCard"

export const metadata: Metadata = {
  title: "Work",
}

const projects = [
  {
    name: "mladenruzicic.com",
    links: [
      {
        title: "GitHub repository",
        url: "https://github.com/ruzicic/mladenruzicic.com",
      },
    ],
    icon: "/static/images/mladenruzicic-logo.svg",
    description:
      "Redesigned my personal website and it's Open Source (if you're into code).",
    tags: ["next.js", "tailwind css", "vercel"],
    year: 2023,
  },
  {
    name: "studenti.rs",
    links: [{ title: "studenti.rs", url: "https://studenti.rs" }],
    icon: "/static/images/studenti.svg",
    description:
      "Redesign 10y+ old website (custom WordPress theme and plugins), optimizing for SEO and User Experience",
    tags: ["wordpress", "php", "tailwind css", "seo"],
    year: 2023,
  },
  {
    name: "Shop Minis Platform",
    links: [{ title: "Shop Minis", url: "https://shop.app/minis" }],
    icon: "/static/images/shop-minis.svg",
    description: "React Native SDK with powerful retail components",
    tags: ["typescript", "react", "nodejs", "github actions"],
    year: 2023,
  },
  {
    name: "Shop.app",
    links: [{ title: "Shop.app", url: "https://shop.app" }],
    icon: "/static/images/shop.svg",
    description:
      "Development and maintenance of cross-platform applications built in React and React Native.",
    tags: ["react", "react native", "typescript", "graphql"],
    year: 2021,
  },
  {
    name: "Panciona",
    links: [{ title: "Panciona website", url: "https://panciona.com" }],
    icon: "/static/images/panciona.svg",
    description: "Solo founder bootstrapping SaaS",
    tags: ["react", "firebase", "nodejs"],
    year: 2021,
  },
  {
    name: "HEGIAS CMS",
    links: [{ title: "Hegias website", url: "https://hegias.com" }],
    icon: "/static/images/hegias.svg",
    description:
      "Full-stack teamlead and responsible for the core frontend app architecture and development, as well as the backend APIs.",
    tags: ["react", "typescript", "storybook", "express.js", "swagger"],
    year: 2020,
  },
  {
    name: "WolkAbout IoT Platform",
    links: [],
    icon: "/static/images/wolkabout.svg",
    description:
      "Built a modular (micro frontends) Angular application from ground up, with a focus on performance, scalability, and extensibility.",
    tags: [
      "angular",
      "typescript",
      "rxjs",
      "nrwl",
      "monorepo",
      "micro frontends",
    ],
    year: 2020,
  },
  {
    name: "WolkAbout SDK",
    links: [
      {
        title: "Wolk REST npm",
        url: "https://www.npmjs.com/package/@wolkabout/wolk-rest",
      },
    ],
    icon: "/static/images/wolkabout.svg",
    description:
      "Built a set of tools to speed up development for the WolkAbout Platform: a NodeJS TypeScript REST Client and a UI Component library built in Angular.",
    tags: ["angular", "typescript", "rxjs", "monorepo"],
    year: 2019,
  },
  {
    name: "WolkAbout Website",
    links: [
      {
        title: "WolkAbout.com on Archive.org",
        url: "http://web.archive.org/web/20210616143417/https://wolkabout.com/",
      },
    ],
    icon: "/static/images/wolkabout.svg",
    description:
      "Solo developer on the company website project. The company pivoted in 2023 and the website was shutdown, therefore a link to WebArchive.",
    tags: ["jamstack"],
    year: 2019,
  },
  {
    name: "Internxt Drive Mobile",
    links: [
      {
        title: "Internxt website",
        url: "https://internxt.com/products#mobile",
      },
    ],
    icon: "/static/images/internxt.svg",
    description:
      "Freelance project. Built an initial version of the mobile app: a file management app and a secure wallet for the Internxt Drive cloud storage service.",
    tags: ["web3", "react native", "expo"],
    year: 2019,
  },
  {
    name: "Trello Boosted Boards",
    links: [
      {
        title: "Chrome Web Store",
        url: "https://chrome.google.com/webstore/detail/trello-boosted-boards/kdnfiaaebipjfmlajbklkkcgkddakdnf?hl=en",
      },
      {
        title: "Mozilla Addons",
        url: "https://addons.mozilla.org/en-US/firefox/addon/trello-boosted-boards/",
      },
    ],
    icon: "/static/images/trello.svg",
    description:
      "Developed a browser extension for Trello. It adds additional features to Trello, like: Tags, Labels, Priorities, Counters, and Calendar. Published on Chrome Web Store and Mozilla Firefox Addons. Has 3.000+ active users and 5/5 rating even 6 years after the release.",
    tags: ["javascript", "chrome extension"],
    year: 2017,
  },
]
export type Project = (typeof projects)[number]

// group project by year, persisting the type
const projectsByYear = projects.reduce(
  (acc: Record<number, Project[]>, project) => {
    const year = project.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(project)
    return acc
  },
  {}
)

export default function Work() {
  return (
    <div className="mx-auto mb-16 flex w-full max-w-2xl flex-col items-start justify-center">
      <h1 className="mb-4 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-normal tracking-tight text-transparent md:mb-6 md:text-5xl">
        Work
      </h1>

      <div className="w-full">
        {Object.keys(projectsByYear)
          .sort((a, b) => Number(b) - Number(a))
          .map((year) => (
            <div
              key={year}
              className="mt-4 flex w-full flex-wrap gap-2 md:gap-4 lg:mt-12"
            >
              <h3 className="font-mono text-xl md:text-2xl">{year}</h3>

              {projectsByYear[year as any].map((item) => (
                <ProjectCard key={item.name} {...item} />
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
