import { Button } from 'app/components/Button'
import type { MDXComponents } from 'mdx/types'

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from
// other libraries.

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="font-normal text-2xl md:text-5xl mb-4 ">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-normal text-xl md:text-3xl mt-4 mb-4 ">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-normal text-lg md:text-2xl  mt-4 md:mt-6 mb-2 md:mb-4">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <div className="mb-2 md:mb-4 md:text-lg">{children}</div>
    ),
    blockquote: ({ children }) => (
      <blockquote className=" bg-accent p-4 rounded-xl">{children}</blockquote>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4">{children}</ol>
    ),
    ul: ({ children }) => (
      <ul
        className="mb-4"
        style={{ listStyleType: 'disc', paddingLeft: '2rem' }}
      >
        {children}
      </ul>
    ),
    li: ({ children }) => <li className="text-lg">{children}</li>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        className="font-bold text-primary md:text-lg underline-offset-4 hover:underline"
      >
        {children}
      </a>
    ),

    ...components,
  }
}
