/**
 * A rail's counter or slide label: `{n}` (one-based) and `{total}` filled
 * in. Plain module, so server components (the slides' "1 of 4") and the
 * rails' client code (`use-rail.ts`) can both call it.
 */
export function railCounter(format: string, idx: number, total: number) {
  return format
    .replace("{n}", String(idx + 1))
    .replace("{total}", String(total))
}
