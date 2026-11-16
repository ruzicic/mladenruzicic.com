/**
 * Time in Ticino for the footer's station clock. Pure
 * functions, safe on the server and the client.
 */

const TIME_ZONE = "Europe/Zurich"

let fmt: Intl.DateTimeFormat | null = null

/** Hours, minutes and seconds in Switzerland (local time if Intl fails). */
export function zurich(ms: number): { h: number; m: number; s: number } {
  const d = new Date(ms)
  try {
    fmt ??= new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
    const p: Record<string, string> = {}
    for (const x of fmt.formatToParts(d)) p[x.type] = x.value
    const z = {
      h: Number(p.hour) % 24,
      m: Number(p.minute),
      s: Number(p.second),
    }
    if (!Number.isNaN(z.h) && !Number.isNaN(z.m) && !Number.isNaN(z.s)) return z
  } catch {
    // fall through
  }
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() }
}

const pad = (n: number) => String(n).padStart(2, "0")

/** `HH:MM` in Switzerland. */
export function hhmm(ms: number): string {
  const z = zurich(ms)
  return `${pad(z.h)}:${pad(z.m)}`
}

/**
 * The hands' angles. The second hand sweeps the dial in 58.5 s, rests at 12
 * for 1.5 s, and the minute hand jumps as it leaves (the Swiss station clock
 * rhythm, drawn here as our own simplified dial). `minute` is passed in so a
 * running count can keep 59 to 00 from spinning the hand backwards.
 */
export function handAngles(
  ms: number,
  minute?: number
): { hour: number; minute: number; second: number; secondMs: number } {
  const z = zurich(ms)
  let second = 0
  let secondMs = 0
  if (z.s === 58) {
    second = 360
    secondMs = 500
  } else if (z.s < 58) {
    second = ((z.s + 1) * 360) / 58.5
    secondMs = 1000
  }
  return {
    hour: (z.h % 12) * 30 + z.m * 0.5,
    minute: minute ?? z.m * 6,
    second,
    secondMs,
  }
}
