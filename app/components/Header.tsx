"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import { motion, Variants } from "framer-motion"
import { DISCOVERY_SESSION_URL, ROUTES } from "lib/constants"

import { Button } from "./Button"
import { Icons } from "./icons"
import MobileMenu from "./MobileMenu"

const logoVariants = ["mladen ruzicic", "mladen ružičić", "младен ружичић"]

export default function Navbar() {
  let pathname = usePathname() || "/"
  const [currentLogoVariant, setCurrentLogoVariant] = useState(0)
  const nextLogoVariant = () =>
    setCurrentLogoVariant((currentLogoVariant + 1) % logoVariants.length)

  return (
    <header className="mx-4 flex flex-none flex-row items-center justify-between border-b-2 border-gray-100 py-4 sm:mx-8 sm:pt-8 lg:mx-16 lg:pt-12 xl:mx-20">
      <div className="flex flex-nowrap items-center gap-2">
        <Link href="/" className="flex flex-nowrap items-center gap-4">
          <Button
            variant="link"
            size="icon"
            renderAs="button"
            onClick={nextLogoVariant}
          >
            <Icons.logo className=" h-8 w-8 transition-all duration-150 ease-in-out hover:scale-110 active:scale-90" />
          </Button>
          <AnimatedText text={logoVariants[currentLogoVariant]} />
        </Link>
      </div>

      <nav>
        <ul className="hidden items-center gap-4 md:flex">
          {Object.entries(ROUTES).map(([path, { name }]) => {
            const isActive = path === pathname

            return (
              <li key={path}>
                <Link
                  href={path}
                  className={clsx(
                    "flex align-middle underline-offset-8 transition-all hover:text-neutral-800",
                    {
                      "text-neutral-500": !isActive,
                      underline: isActive,
                    }
                  )}
                >
                  <span className="relative px-2">
                    {name}
                    {path === pathname ? (
                      <div className="absolute inset-0 top-7 z-[-1] mx-2 h-[1px] bg-neutral-200 from-transparent to-neutral-900" />
                    ) : null}
                  </span>
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

        <MobileMenu />
      </nav>
    </header>
  )
}

const AnimatedText = ({ text }: { text: string }) => {
  return (
    <motion.span
      key={text}
      initial={{ y: -20, opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0.5 }}
      transition={{
        type: "spring",
        duration: 0.2,
      }}
      className="text-xl tracking-wide"
    >
      {text}
    </motion.span>
  )
}
