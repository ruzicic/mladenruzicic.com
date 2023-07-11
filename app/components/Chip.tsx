export default function Chip({ name }: { name: string }) {
  return (
    <div className="flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium leading-5 text-gray-800">
      {name}
    </div>
  )
}
