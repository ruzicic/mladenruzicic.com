import Container from 'components/Container'

export default function UsesLayout({ children }: { children: any }) {
  return (
    <Container
      title="Uses – Mladen Ružičić"
      description="Here's what tech I'm using day to day"
    >
      <article className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          My Gear
        </h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          Here is a glimpse at some of the hardware, software, apps and other
          tools I use on a daily basis both at work and in my personal life. I
          hope you found some useful resources here.
        </p>
        <div className="prose dark:prose-dark w-full">{children}</div>
      </article>
    </Container>
  )
}
