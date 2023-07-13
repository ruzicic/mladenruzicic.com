import { Suspense } from "react"
import Link from "next/link"
import { DISCOVERY_SESSION_URL, ROUTES } from "lib/constants"

import { Button } from "./Button"
import { Icons } from "./icons"
import { LogoAnimated } from "./LogoAnimated"
import MobileMenu from "./MobileMenu"

const LogoStatic = () => (
  <Link href="/" className="flex flex-nowrap items-center gap-4">
    <Icons.logo className=" h-8 w-8 transition-all duration-150 ease-in-out hover:scale-110 active:scale-90" />
    <span className="text-xl tracking-wide">mladen ruzicic</span>
  </Link>
)

export default function Header() {
  return (
    <header className="mx-4 flex flex-none flex-row items-center justify-between border-b-2 border-gray-100 py-4 sm:mx-8 sm:pt-8 lg:mx-16 lg:pt-12 xl:mx-20">
      <div className="flex flex-nowrap items-center gap-2">
        <Suspense fallback={<LogoStatic />}>
          <LogoAnimated />
        </Suspense>
      </div>

      <nav>
        <ul className="hidden items-center gap-4 md:flex">
          {Object.entries(ROUTES).map(([path, { name }]) => {
            return (
              <li key={path}>
                <Link
                  href={path}
                  className=" flex align-middle text-neutral-500 underline-offset-8 transition-all hover:text-neutral-800"
                >
                  <span className="relative px-2">{name}</span>
                </Link>
              </li>
            )
          })}

          <li>
            <Button target="_blank" href={DISCOVERY_SESSION_URL}>
              Get in Touch
            </Button>
          </li>
        </ul>

        <Suspense fallback={null}>
          <MobileMenu />
        </Suspense>
      </nav>
    </header>
  )
}
