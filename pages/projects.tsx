import Container from 'components/Container'
import ProjectCard from 'components/ProjectCard'
import { Year } from 'components/Timeline'
import { getPostBySlug } from 'lib/api'
import markdownToHtml from 'lib/markdownToHtml'

export type Project = {
  name: string
  href: string
  icon: string
  description: string
  tags: string
  year: number | string
}

type ProjectPage = {
  title: string
  excerpt: string
  date: string
  content: string
  projects: Project[]
}

export default function Projects({ project }: { project: ProjectPage }) {
  const projectsByYear: Record<number, Project[]> = groupBy(
    project.projects,
    'year'
  )

  return (
    <Container title="Projects – Mladen Ružičić">
      <div className="w-full flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          {project.title}
        </h1>
        <div className="w-full mb-8 prose leading-6 text-gray-600 dark:text-gray-400">
          {project.content}
        </div>

        <div className="w-full">
          {Object.keys(projectsByYear)
            .sort((a, b) => Number(b) - Number(a))
            .map((year) => (
              <div key={year} className="w-full flex flex-wrap gap-2 md:gap-4 mb-5 md:mb-10">
                <Year>{year}</Year>
                {projectsByYear[year as any].map((item) => (
                  <ProjectCard key={item.href} {...item} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </Container>
  )
}

export async function getStaticProps() {
  const project = getPostBySlug('projects', [
    'title',
    'excerpt',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
    'projects',
  ])
  const content = await markdownToHtml(project.content || '')

  return {
    props: {
      project: {
        ...project,
        content,
      },
    },
  }
}

const groupBy = function (xs: any[], key: string) {
  return xs.reduce(function (rv, x) {
    ;(rv[x[key]] = rv[x[key]] || []).push(x)
    return rv
  }, {})
}
