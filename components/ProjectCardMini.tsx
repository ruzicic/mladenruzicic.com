import Image from "next/legacy/image"
import Link from 'next/link'

type Props = {
  title: string
  src: string
  href: string
}

export default function ProjectCardMini({ title, src, href }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative bg-white dark:bg-gray-800 shadow-md rounded-3xl p-2 cursor-pointer w-full md:w-1/3 mr-2 mb-2 transform hover:scale-[1.01] transition-all flex flex-row md:flex-col"
    >
      <div className="rounded-2xl overflow-hidden relative w-[90px] md:w-[180px] h-[90px] md:h-[140px] mr-2 md:mr-0">
        <Image className="object-cover" src={src} alt={title} layout="fill" />
      </div>

      <div className="mt-4 pl-2 flex justify-between">
        <div>
          <h4 className="text-lg md:text-lg font-medium mb-2 md:mb-4 w-full text-gray-900 dark:text-gray-100 tracking-tight">
            {title}
          </h4>
        </div>
        <div className="absolute bottom-3 right-3 text-gray-300 dark:text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
      </div>
    </Link>
  )
}
