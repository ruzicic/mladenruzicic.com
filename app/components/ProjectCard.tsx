import Image from 'next/image'
import Link from 'next/link'
import { Project } from 'app/projects/page'
import Chip from './Chip'

const LinkCard = ({ href, children }: { href: string; children: any }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="relative w-full bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 md:p-4 cursor-pointer dark:hover:bg-gray-700 transition-all flex flex-col md:flex-row gap-4"
  >
    {children}
  </Link>
)

const PlainCard = ({ children }: { children: any }) => (
  <div className="relative w-full bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 md:p-4 transition-all flex flex-col md:flex-row gap-4">
    {children}
  </div>
)

export default function ProjectCard({
  name,
  icon,
  description,
  href,
  tags,
}: Project) {
  const ProjectCardContainer = href ? LinkCard : PlainCard
  return (
    <ProjectCardContainer href={href}>
      <Image
        className="rounded-2xl"
        src={icon}
        alt={name}
        width={100}
        height={100}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />

      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between pt-1 pr-1 mb-1 md:mb-2">
          <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip key={tag} name={tag.trim() as any} />
              </li>
            ))}
          </ul>

          {href && <ExternalLinkIcon />}
        </div>
        <div>
          <h4 className="text-lg md:text-lg font-medium w-full text-gray-900 dark:text-gray-100 tracking-tight ">
            {name}
          </h4>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
    </ProjectCardContainer>
  )
}

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
)
