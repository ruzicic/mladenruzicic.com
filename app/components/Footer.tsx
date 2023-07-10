import { Button } from "./Button"
import { Icons } from "./icons"

const SOCIALS = [
  {
    name: "Twitter",
    url: "https://twitter.com/ruzicic",
    icon: () => <Icons.twitter className="h-6 w-6" />,
  },
  {
    name: "GitHub",
    url: "https://github.com/ruzicic",
    icon: () => <Icons.github className="h-6 w-6" />,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/ruzicic187/",
    icon: () => <Icons.instagram className="h-6 w-6" />,
  },
  {
    name: "Linkedin",
    url: "https://www.linkedin.com/in/ruzicic/",
    icon: () => <Icons.linkedin className="h-6 w-6" />,
  },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="mx-12 flex flex-col lg:mx-16 xl:mx-20">
      <div className="mb-12 flex flex-col-reverse items-center justify-between border-t-2 border-gray-100 pt-6 md:flex-row">
        <div>
          <p className="font-light text-gray-600">
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
