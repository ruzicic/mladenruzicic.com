import Image from "next/image"
import { Project } from "app/work/page"

import { Button } from "./Button"
import Chip from "./Chip"
import { Icons } from "./icons"

export default function ProjectCard({
  name,
  icon,
  description,
  links,
  tags,
}: Project) {
  return (
    <article className="relative flex w-full flex-col gap-4 border-b-[1px] border-gray-300 bg-white p-4 md:flex-row md:p-4 lg:gap-8">
      <Image
        className="rounded-2xl"
        src={icon}
        alt={name}
        width={100}
        height={100}
        placeholder="empty"
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />

      <div className="flex w-full flex-col">
        <div className="flex flex-col">
          <h4 className="mb-1 text-xl">{name}</h4>
          <p className="text-lg font-light text-gray-500">{description}</p>
        </div>

        <ul className="my-4 flex flex-wrap space-x-4">
          {links.map((link) => (
            <li key={link.url}>
              <Button
                href={link.url}
                variant="link"
                size="auto"
                target="_blank"
              >
                <span className="mr-1">{link.title}</span>
                <Icons.externalLink className="h-4 w-4 text-gray-500" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="mb-1 flex flex-row justify-between pr-1 pt-1 md:mb-2">
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
