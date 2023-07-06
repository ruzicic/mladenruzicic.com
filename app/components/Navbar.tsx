'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import MobileMenu from './MobileMenu'
import { ThemeSwitcher } from './ThemeSwitcher'

const navItems = {
  '/': {
    name: 'home',
  },
  '/about': {
    name: 'about',
  },
  '/projects': {
    name: 'projects',
  },
}

export default function Navbar() {
  let pathname = usePathname() || '/'

  return (
    <div className="flex flex-col justify-center px-8">
      <nav className="flex items-center justify-between w-full relative max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pt-8 pb-8 sm:pb-16  text-gray-900 bg-gray-50  dark:bg-gray-900 bg-opacity-60 dark:text-gray-100">
        <a href="#skip" className="skip-nav">
          Skip to content
        </a>

        <div className="flex ml-[-0.60rem]">
          <MobileMenu />

          <ul className="hidden sm:flex">
            {Object.entries(navItems).map(([path, { name }]) => {
              const isActive = path === pathname

              //   isActive
              //   ? 'font-semibold text-gray-800 dark:text-gray-200'
              //   : 'font-normal text-gray-600 dark:text-gray-400',
              // 'hidden md:inline-block p-1 sm:px-3 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-all',

              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={clsx(
                      'transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle',
                      {
                        'text-neutral-500': !isActive,
                      }
                    )}
                  >
                    <span className="relative py-1 px-2">
                      {name}
                      {path === pathname ? (
                        <div className="absolute h-[1px] top-7 mx-2 inset-0 bg-neutral-200 dark:bg-neutral-800 z-[-1] dark:bg-gradient-to-r from-transparent to-neutral-900" />
                      ) : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <ThemeSwitcher />
      </nav>
    </div>
  )
}
