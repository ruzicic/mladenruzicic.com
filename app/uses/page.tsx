import DateFormatted from 'app/components/DateFormatted'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uses',
}

export default function Uses() {
  return (
    <section className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
      <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
        My Gear
      </h1>
      <div className="prose dark:prose-dark w-full">
        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          Here is a glimpse at some of the hardware, software, apps and other
          tools I use on a daily basis both at work and in my personal life. I
          hope you found some useful resources here.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          <strong>Last update:</strong> Jul 6, 2023
        </p>

        <h2>Hardware</h2>
        <ul>
          <li>14&quot; MacBook Pro M1 (2021)</li>
          <li>24&quot; DELL U2415</li>
          <li>Logitech MX Keys Mini for Mac</li>
          <li>Logitech MX Master 3</li>
          <li>Anker PowerExpand 8-in-1</li>
          <li>Logitech Brio 4K webcam</li>
          <li>Aputure Mc</li>
        </ul>

        <h2>Coding</h2>
        <ul>
          <li>
            <strong>Editor:</strong> VS Code with Default Dark+ theme
          </li>
          <li>
            <strong>Terminal:</strong> iTerm2 with zsh and OhMyZshell
          </li>
        </ul>

        <h2>Software</h2>
        <ul>
          <li>1Password</li>
          <li>Grammarly</li>
          <li>Notion</li>
          <li>Raycast</li>
        </ul>
      </div>
    </section>
  )
}
