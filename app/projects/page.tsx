import ProjectCard from 'app/components/ProjectCard'
import { Year } from 'app/components/Timeline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projects',
}

const projects = [
  {
    name: 'studenti.rs',
    href: 'https://studenti.rs',
    icon: '/static/images/shop.svg',
    description: 'Redesign my old website',
    tags: ['wordpress', 'php', 'tailwind css'],
    year: 2023,
  },
  {
    name: 'Shop Minis Platform',
    href: 'https://shop.app/minis',
    icon: '/static/images/shop.svg',
    description: 'React Native SDK with powerful retail components',
    tags: ['typescript', 'react', 'nodejs', 'github actions'],
    year: 2023,
  },
  {
    name: 'Shop.app',
    href: 'https://shop.app',
    icon: '/static/images/shop.svg',
    description: 'Building new shopping assistant',
    tags: ['react native', 'typescript', 'graphql'],
    year: 2021,
  },
  {
    name: 'Panciona',
    href: 'https://panciona.com',
    icon: '/static/images/panciona.svg',
    description: 'Solo founder bootstrapping SaaS',
    tags: ['react', 'firebase', 'nodejs'],
    year: 2021,
  },
  {
    name: 'HEGIAS CMS',
    href: 'https://hegias.com',
    icon: '/static/images/hegias.svg',
    description:
      'Teamlead and responsible for core frontend app architecture and development',
    tags: ['react', 'typescript'],
    year: 2020,
  },
  {
    name: 'WolkAbout IoT Platform',
    href: '',
    icon: '/static/images/wolkabout.svg',
    description:
      'Built modular Angular application from ground up (removed in 2022)',
    tags: ['angular', 'typescript', 'rxjs', 'monorepo'],
    year: 2020,
  },
  {
    name: 'WolkAbout SDK',
    href: '',
    icon: '/static/images/wolkabout.svg',
    description:
      'Built modular Angular application from ground up (removed in 2022)',
    tags: ['angular', 'typescript', 'rxjs', 'monorepo'],
    year: 2020,
  },
  {
    name: 'WolkAbout Website',
    href: '',
    icon: '/static/images/wolkabout.svg',
    description: 'Teamlead on the company website project (removed in 2022)',
    tags: ['jamstack'],
    year: 2019,
  },
  {
    name: 'Internxt Drive Mobile',
    href: 'https://internxt.com/products#mobile',
    icon: '/static/images/internxt.svg',
    description: 'Freelance project',
    tags: ['react native'],
    year: 2019,
  },
  {
    name: 'Trello Boosted Boards',
    href: 'https://chrome.google.com/webstore/detail/trello-boosted-boards/kdnfiaaebipjfmlajbklkkcgkddakdnf?hl=en',
    icon: '/static/images/trello.svg',
    description: 'Developed browser extension for Chrome and Mozilla Firefox',
    tags: ['chrome extension'],
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

export default function Projects() {
  return (
    <div className="w-full flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
      <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
        Projects
      </h1>

      <div className="w-full">
        {Object.keys(projectsByYear)
          .sort((a, b) => Number(b) - Number(a))
          .map((year) => (
            <div
              key={year}
              className="w-full flex flex-wrap gap-2 md:gap-4 mb-5 md:mb-10"
            >
              <Year>{year}</Year>
              {projectsByYear[year as any].map((item) => (
                <ProjectCard key={item.href} {...item} />
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
