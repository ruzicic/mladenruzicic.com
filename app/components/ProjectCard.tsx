import Image from 'next/image'
import Link from 'next/link'
import { Project } from 'app/work/page'
import Chip from './Chip'
import { Icons } from './icons'
import { Button } from './Button'

export default function ProjectCard({
  name,
  icon,
  description,
  links,
  tags,
}: Project) {
  return (
    <article className="relative w-full bg-white p-4 md:p-4 flex flex-col md:flex-row gap-4 lg:gap-8 border-b-[1px] border-gray-300 pb-4">
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
        <div className="flex flex-col">
          <h4 className="text-xl mb-1">{name}</h4>
          <p className="text-lg font-light text-gray-500">{description}</p>
        </div>

        <ul className="flex flex-wrap space-x-4 my-4">
          {links.map((link) => (
            <li key={link.url}>
              <Button href={link.url} variant="link" size="auto">
                <span className="mr-1">{link.title}</span>
                <Icons.externalLink className="h-4 w-4 text-gray-500" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-row justify-between pt-1 pr-1 mb-1 md:mb-2">
          <ul className="flex flex-wrap gap-1.5" aria-label="Technologies used">
            {tags.map((tag) => (
              <li key={tag}>
                <Chip key={tag} name={tag.trim() as any} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
