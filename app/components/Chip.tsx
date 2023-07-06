export default function Chip({ name }: { name: string }) {
  return (
    <span className="flex justify-center items-center font-medium py-1 px-2 rounded-full text-pink-700 dark:text-pink-200 bg-pink-50 dark:bg-pink-900 border border-pink-100 dark:border-pink-800 whitespace-nowrap">
      <span className="text-xs font-normal uppercase tracking-tight max-w-full flex-initial">
        {name}
      </span>
    </span>
  )
}
