const Divider = () => {
  return (
    <div className="border border-gray-200 dark:border-gray-600 w-full my-8" />
  )
}

export const Year = ({ children }: any) => {
  return (
    <h3 className="uppercase font-sans tracking-widest font-regular mb-2">
      {children}
    </h3>
  )
}

const Step = (props: any) => {
  return (
    <li className="mb-4 ml-2">
      <div className="flex items-center mb-2 text-green-700 dark:text-green-300">
        <span className="sr-only">Check</span>
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </g>
        </svg>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {props.title}
        </p>
      </div>
      <p className="text-gray-700 dark:text-gray-400 ml-6">{props.children}</p>
    </li>
  )
}

export default function Timeline() {
  return (
    <>
      <h2 className="font-normal text-xl md:text-3xl tracking-tight mb-4 md:mb-6 text-black">
        Timeline
      </h2>

      <Year>2021</Year>
      <ul>
        <Step title="Launched mladenruzicic.com 🚀">
          I am seriously excited about my website seeing the light of the day!
          To finally accomplish that, after years of delaying, I have
          shamelessly stolen a ton of stuff from{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://twitter.com/leeerob"
            className="font-bold"
          >
            Lee Robinson
          </a>
          , to whom I am immensely grateful.
        </Step>
        <Step title="Joined Shopify">A dream comming true! 🤩</Step>
      </ul>
      <Divider />
      <Year>2020</Year>
      <ul>
        <Step title="Started working at HEGIAS 🇨🇭">
          My first &ldquo;on-site&ldquo; job since moving to Switzerland. I
          joined the team as a Fullstack Developer and a team lead, to help
          build a browser-based CMS solution communicating with VR.
        </Step>
        <Step title="Got a baby girl 👶">
          Ivana said `Hello world!` in March! We&apos;ll be remembering 2020 by
          so many good things
        </Step>
        <Step title="Got married 🎉">
          We made it official and threw an Italian-style dinner party for
          friends & family.
        </Step>
      </ul>
      <Divider />
      <Year>2019</Year>
      <ul>
        <Step title="Moved to Switzerland">
          Long-distance relationship came to an end, happy end — we&apos;re
          moving in together, and we&apos;re doing it in Switzerland! 🇨🇭
        </Step>
        <Step title="Promoted to Senior Frontend Developer 🤓">
          Although essentially my job has not changed, new role more precisely
          described my work — more responsibilities from project setup to
          production, mentoring junior colleagues, onboarding new team members
        </Step>
      </ul>
      {/* {isShowingFullTimeline ? (
        <FullTimeline />
      ) : (
        <button
          type="button"
          className="flex items-center text-sm my-4 mx-auto px-4 py-2 rounded-md font-medium text-gray-900 dark:text-gray-100"
          onClick={() => showFullTimeline(true)}
        >
          See More
          <svg
            className="h-4 w-4 ml-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )} */}
    </>
  )
}
