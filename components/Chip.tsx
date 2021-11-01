type Color = 'pink' | 'yellow' | 'purple' | 'green' | 'red' | 'indigo' | 'blue'

const variants: Record<string, Color> = {
  'react native': 'pink',
  react: 'yellow',
  typescript: 'purple',
  graphql: 'green',
  firebase: 'red',
  nodejs: 'blue',
  angular: 'indigo',
  jamstack: 'yellow',
  rxjs: 'blue',
  'chrome extension': 'blue',
  monorepo: 'red'
} as const

const getStyles = (color: Color) =>
  `text-${color}-700 dark:text-${color}-200 bg-${color}-50 dark:bg-${color}-900 border border-${color}-100 dark:border-${color}-800`

export default function Chip({ name }: { name: keyof typeof variants }) {
  return (
    <span
      className={`flex justify-center items-center font-medium py-1 px-2 rounded-full ${getStyles(
        variants[name]
      )}`}
    >
      <span className="text-xs font-normal uppercase tracking-tight max-w-full flex-initial">
        {name}
      </span>
    </span>
  )
}
