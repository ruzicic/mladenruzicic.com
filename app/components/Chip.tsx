export default function Chip({ name }: { name: string }) {
  return (
    <div className="flex items-center rounded-full bg-teal-50 dark:bg-teal-400/10 px-3 py-1 text-xs font-medium leading-5 text-teal-600 dark:text-teal-300 ">
      {name}
    </div>
  )
}
