import Link from 'next/link'
import { Icons } from './icons'
import { Button } from './Button'

const socials = [
  {
    name: 'Twitter',
    url: 'https://twitter.com/ruzicic',
    icon: () => <Icons.twitter className="h-6 w-6" />,
  },
  {
    name: 'GitHub',
    url: 'https://github.com/ruzicic',
    icon: () => <Icons.github className="h-6 w-6" />,
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/ruzicic187/',
    icon: () => <Icons.instagram className="h-6 w-6" />,
  },
  {
    name: 'Linkedin',
    url: 'https://www.linkedin.com/in/ruzicic/',
    icon: () => <Icons.linkedin className="h-6 w-6" />,
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="flex flex-col mx-12 lg:mx-16 xl:mx-20">
      <div className="w-full grid grid-cols-1 gap-4 pb-16 sm:grid-cols-6">
        <div className="flex flex-col ">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-600 transition"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-500 hover:text-gray-600 transition"
          >
            About
          </Link>
          <Link
            href="/projects"
            className="text-gray-500 hover:text-gray-600 transition"
          >
            Projects
          </Link>
          <Link
            href="/uses"
            className="text-gray-500 hover:text-gray-600 transition"
          >
            Uses
          </Link>
        </div>
        <div className="flex flex-col ">col 2</div>

        <span className="flex"></span>

        {/* <div className="flex flex-col col-span-3">
          <h6>Next steps</h6>
          <li className="list-none">
            <li>
              <strong>01</strong> / Let’s connect! It’s on the house. Get
              started with a Discovery Session.
            </li>
            <li>
              <strong>02</strong> / I’ll follow up with a proposal based on our
              conversation.
            </li>
            <li>
              <strong>03</strong> / If all looks good, payment is requested, and
              we get to work!
            </li>
          </li>
        </div> */}
      </div>

      <div className="mb-12 pt-6 border-t-2 border-gray-100 flex flex-col-reverse items-center justify-between md:flex-row">
        <div>
          <p className="text-gray-600 font-light text-md">
            © {currentYear} Mladen Ruzicic
          </p>
        </div>
        <ul className="flex flex-row gap-2 ">
          {socials.map((social) => (
            <li key={social.name}>
              <Button
                href={social.url}
                target="_blank"
                rel="noopener"
                variant="link"
                size="icon"
                className="opacity-50 hover:opacity-100"
              >
                {social.icon()}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
