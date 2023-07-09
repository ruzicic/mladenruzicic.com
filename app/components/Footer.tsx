import { Icons } from './icons'
import { Button } from './Button'

const SOCIALS = [
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
      <div className="mb-12 pt-6 border-t-2 border-gray-100 flex flex-col-reverse items-center justify-between md:flex-row">
        <div>
          <p className="text-gray-600 font-light text-md">
            © {currentYear} Mladen Ruzicic
          </p>
        </div>
        <ul className="flex flex-row gap-2 ">
          {SOCIALS.map((social) => (
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
