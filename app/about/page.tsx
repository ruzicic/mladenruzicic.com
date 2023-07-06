import Timeline from 'app/components/Timeline'

export default function About() {
  return (
    <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16">
      <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
        About Me
      </h1>
      <div className="mb-8 prose leading-6 text-gray-600 dark:text-gray-400">
        <p>
          Hello there. I&apos;m Mladen. I&apos;m a developer with industry
          experience building real-time web applications. I am currently
          employed at{' '}
          <a
            href="https://shopify.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shopify
          </a>{' '}
          as a Senior Software Developer, working on{' '}
          <a href="https://shop.app" target="_blank" rel="noopener noreferrer">
            Shop.app
          </a>
          .
        </p>
        <p>
          I was born in Bosnia and Herzegovina in 1988. When I was 18, I moved
          to Serbia for studies and stayed for a while. My IT journey started
          with PHP and WordPress in outsourcing companies, continued in
          startups. Since then, I have worked in the Internet of Things (
          <a
            href="https://wolkabout.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            @WolkAbout
          </a>
          ), Virtual Reality (
          <a
            href="https://hegias.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            @HEGIAS
          </a>
          ), and E-commerce (
          <a
            href="https://shopify.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            @Shopify
          </a>
          ) industries.
        </p>
        <p>
          Today, I live in Switzerland with my wife and 2-year-old daughter. 👨‍👩‍👧
        </p>
      </div>
      <Timeline />
    </div>
  )
}
