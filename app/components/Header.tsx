'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import { Button } from './Button'
import { Icons } from './icons'
import { useState } from 'react'
import { Variants, motion } from 'framer-motion'

const navItems = {
  '/about': {
    name: 'About',
  },
  '/projects': {
    name: 'Projects',
  },
}
const logoVariants = ['mladen ruzicic', 'mladen ružičić', 'младен ружичић']

export default function Navbar() {
  let pathname = usePathname() || '/'
  const [currentLogoVariant, setCurrentLogoVariant] = useState(0)
  const nextLogoVariant = () =>
    setCurrentLogoVariant((currentLogoVariant + 1) % logoVariants.length)

  return (
    <header className="flex flex-row flex-none items-center justify-between pt-12 pb-4 mx-12 lg:mx-16 xl:mx-20 border-b-2 border-gray-100">
      <div className="flex flex-nowrap gap-2 items-center">
        <Link href="/" className="flex flex-nowrap items-center gap-4">
          <Button
            variant="link"
            size="icon"
            renderAs="button"
            onClick={nextLogoVariant}
          >
            <Icons.logo className="h-8 w-8" />
          </Button>
          <AnimatedText text={logoVariants[currentLogoVariant]} />
        </Link>
      </div>

      <nav>
        <ul className="hidden md:flex items-center gap-4">
          {Object.entries(navItems).map(([path, { name }]) => {
            const isActive = path === pathname

            return (
              <li key={path}>
                <Link
                  href={path}
                  className={clsx(
                    'transition-all hover:text-neutral-800 flex align-middle underline-offset-8',
                    {
                      'text-neutral-500': !isActive,
                      underline: isActive,
                    }
                  )}
                >
                  <span className="relative px-2">
                    {name}
                    {path === pathname ? (
                      <div className="absolute h-[1px] top-7 mx-2 inset-0 bg-neutral-200 z-[-1] from-transparent to-neutral-900" />
                    ) : null}
                  </span>
                </Link>
              </li>
            )
          })}
          <li>
            <Button href="#">Get in Touch</Button>
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
        type: 'spring',
        duration: 0.2,
      }}
      className="text-xl tracking-wide"
    >
      {text}
    </motion.span>
  )
}
