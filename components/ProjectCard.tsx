import Image from 'next/image'
import Link from 'next/link'
import { Project } from 'pages/projects'
import Chip from './Chip'

export default function ProjectCard({
  name,
  icon,
  description,
  href,
  tags,
}: Project) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-full bg-white dark:bg-gray-800 shadow-md rounded-3xl p-4 md:p-2 cursor-pointer dark:hover:bg-gray-700 transition-all flex flex-col md:flex-row gap-2"
    >
      <Image
        className="rounded-2xl"
        src={icon}
        alt={name}
        width={128}
        height={128}
      />

      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between pt-1 pr-1 mb-1 md:mb-2">
          <div className="flex gap-1 flex-wrap">
            {tags.split(',').map((tag) => (
              <Chip key={tag} name={tag.trim() as any} />
            ))}
          </div>

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
        </div>
        <div>
          <h4 className="text-lg md:text-lg font-medium w-full text-gray-900 dark:text-gray-100 tracking-tight ">
            {name}
          </h4>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  )
}
