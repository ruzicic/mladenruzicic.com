import type { MDXComponents } from "mdx/types"

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including components from
// other libraries.

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 bg-gradient-to-b from-black to-gray-400 bg-clip-text text-2xl font-normal text-transparent md:text-5xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="my-4 bg-gradient-to-b text-xl font-normal md:text-3xl">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 text-lg  font-normal md:mb-4 md:mt-6 md:text-2xl">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <div className="mb-2 text-gray-500 md:mb-4 md:text-lg">{children}</div>
    ),
    blockquote: ({ children }) => (
      <blockquote className=" rounded-xl bg-accent p-4">{children}</blockquote>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 list-inside list-decimal">{children}</ol>
    ),
    ul: ({ children }) => (
      <ul
        className="mb-4"
        style={{ listStyleType: "disc", paddingLeft: "2rem" }}
      >
        {children}
      </ul>
    ),
    li: ({ children }) => (
      <li className="text-gray-500 md:text-lg">{children}</li>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        className="font-bold text-gray-700 underline-offset-4 hover:underline md:text-lg"
      >
        {children}
      </a>
    ),

    ...components,
  }
}
