/*
 * The cast sound, ported from the paper lab
 * (`~/Projects/paper-lab/src/paranoia/sound.ts`). The file from content
 * (`postscript.sound`, the cast) plays alone at the cast and carries the
 * moment. Only if it fails to load or decode does the synthesized stand-in
 * play instead (a heavy low hit, a breathy tail in a long dark reverb, then a
 * quiet low drone under the hold). The file is fetched on the first intent to
 * press the button, never with the page.
 */

/** The lab's default volume. */
const VOLUME = 0.5

export type SoundSource = { kind: "synth" } | { kind: "file"; url: string }

let probe: Promise<{ url: string; data: ArrayBuffer } | null> | null = null

/** Fetches the cast file once; `null` when it cannot be had (the stand-in plays). */
export function probeCastFile(
  url: string
): Promise<{ url: string; data: ArrayBuffer } | null> {
  probe ??= (async () => {
    try {
      const res = await fetch(url)
      const type = res.headers.get("content-type") ?? ""
      if (res.ok && type.startsWith("audio"))
        return { url, data: await res.arrayBuffer() }
    } catch {
      /* offline or blocked: the synthesized hit plays */
    }
    return null
  })()
  return probe
}

function noiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buf = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * seconds),
    ctx.sampleRate
  )
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** A dark, long room: stereo noise with an exponential tail, low end kept. */
function impulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    let lp = 0
    for (let i = 0; i < len; i++) {
      const t = i / len
      // A one-pole low-pass on the noise darkens the room.
      lp += 0.18 * (Math.random() * 2 - 1 - lp)
      d[i] = lp * Math.pow(1 - t, 3.2)
    }
  }
  return buf
}

function softClip(ctx: BaseAudioContext, amount: number): WaveShaperNode {
  const ws = ctx.createWaveShaper()
  const n = 1024
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount)
  }
  ws.curve = curve
  return ws
}

export class ParanoiaSound {
  readonly ctx: AudioContext
  private master: GainNode
  private reverb: ConvolverNode
  private drone: { stop(at: number): void } | null = null
  private castBuffer: AudioBuffer | null = null
  source: SoundSource = { kind: "synth" }

  /** Create inside the click handler (autoplay rules). */
  constructor(
    private readonly url: string,
    volume = VOLUME
  ) {
    this.ctx = new AudioContext()
    const comp = this.ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    this.master = this.ctx.createGain()
    this.master.gain.value = volume
    this.master.connect(comp).connect(this.ctx.destination)
    this.reverb = this.ctx.createConvolver()
    this.reverb.buffer = impulse(this.ctx, 3.6)
    const wet = this.ctx.createGain()
    wet.gain.value = 0.55
    this.reverb.connect(wet).connect(this.master)
  }

  async prepare(): Promise<void> {
    const file = await probeCastFile(this.url)
    if (!file) return
    try {
      this.castBuffer = await this.ctx.decodeAudioData(file.data.slice(0))
      this.source = { kind: "file", url: file.url }
    } catch {
      this.castBuffer = null
    }
  }

  /** The hit and its tail, then the drone until `release()`. */
  cast(): void {
    const ctx = this.ctx
    void ctx.resume()
    const t = ctx.currentTime + 0.01
    if (this.castBuffer) {
      const src = ctx.createBufferSource()
      src.buffer = this.castBuffer
      src.connect(this.master)
      src.start(t)
    } else {
      this.synthHit(t)
      this.drone = this.startDrone(t + 0.35)
    }
  }

  /** An early end (Escape, a click, a double tap): silence at once. */
  stopNow(): void {
    const at = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(at)
    this.master.gain.setValueAtTime(this.master.gain.value, at)
    this.master.gain.linearRampToValueAtTime(0, at + 0.03)
    this.drone?.stop(at)
    this.drone = null
    window.setTimeout(() => void this.ctx.close().catch(() => {}), 200)
  }

  private synthHit(t: number): void {
    const ctx = this.ctx
    const drive = softClip(ctx, 2.2)
    const hitGain = ctx.createGain()
    hitGain.gain.value = 0.9
    drive.connect(hitGain)
    hitGain.connect(this.master)
    hitGain.connect(this.reverb)

    // A sub that drops: the weight of the hit.
    const sub = ctx.createOscillator()
    sub.type = "sine"
    sub.frequency.setValueAtTime(96, t)
    sub.frequency.exponentialRampToValueAtTime(34, t + 0.7)
    const subG = ctx.createGain()
    subG.gain.setValueAtTime(0.0001, t)
    subG.gain.exponentialRampToValueAtTime(1, t + 0.012)
    subG.gain.exponentialRampToValueAtTime(0.0001, t + 2.4)
    sub.connect(subG).connect(drive)
    sub.start(t)
    sub.stop(t + 2.5)

    // A darker body a fifth below the sub's start, slightly detuned.
    const body = ctx.createOscillator()
    body.type = "triangle"
    body.frequency.setValueAtTime(64, t)
    body.frequency.exponentialRampToValueAtTime(29, t + 0.9)
    body.detune.value = -12
    const bodyG = ctx.createGain()
    bodyG.gain.setValueAtTime(0.0001, t)
    bodyG.gain.exponentialRampToValueAtTime(0.6, t + 0.02)
    bodyG.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
    body.connect(bodyG).connect(drive)
    body.start(t)
    body.stop(t + 1.9)

    // The impact: a thud of filtered noise closing down.
    const noise = noiseBuffer(ctx, 3)
    const thud = ctx.createBufferSource()
    thud.buffer = noise
    const thudF = ctx.createBiquadFilter()
    thudF.type = "lowpass"
    thudF.frequency.setValueAtTime(1400, t)
    thudF.frequency.exponentialRampToValueAtTime(90, t + 0.45)
    const thudG = ctx.createGain()
    thudG.gain.setValueAtTime(0.0001, t)
    thudG.gain.exponentialRampToValueAtTime(0.9, t + 0.008)
    thudG.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
    thud.connect(thudF).connect(thudG).connect(drive)
    thud.start(t)
    thud.stop(t + 0.8)

    // The breathy tail: noise through two moving formant bands, fluttering,
    // mostly in the reverb. Evokes a whisper; it carries no words.
    const breath = ctx.createBufferSource()
    breath.buffer = noise
    const f1 = ctx.createBiquadFilter()
    f1.type = "bandpass"
    f1.Q.value = 7
    f1.frequency.setValueAtTime(620, t + 0.1)
    f1.frequency.linearRampToValueAtTime(880, t + 0.9)
    f1.frequency.linearRampToValueAtTime(540, t + 2.6)
    const f2 = ctx.createBiquadFilter()
    f2.type = "bandpass"
    f2.Q.value = 9
    f2.frequency.setValueAtTime(2300, t + 0.1)
    f2.frequency.linearRampToValueAtTime(1700, t + 1.4)
    f2.frequency.linearRampToValueAtTime(2600, t + 2.6)
    const mix = ctx.createGain()
    const breathG = ctx.createGain()
    breathG.gain.setValueAtTime(0.0001, t)
    breathG.gain.linearRampToValueAtTime(0.0001, t + 0.12)
    breathG.gain.linearRampToValueAtTime(0.55, t + 0.55)
    breathG.gain.setTargetAtTime(0.0001, t + 0.9, 0.55)
    // Flutter: a slow tremolo on the breath.
    const flutter = ctx.createOscillator()
    flutter.frequency.value = 6.5
    const flutterDepth = ctx.createGain()
    flutterDepth.gain.value = 0.25
    flutter.connect(flutterDepth).connect(breathG.gain)
    breath.connect(f1).connect(mix)
    breath.connect(f2).connect(mix)
    mix.connect(breathG)
    breathG.connect(this.reverb)
    const dry = ctx.createGain()
    dry.gain.value = 0.35
    breathG.connect(dry).connect(this.master)
    breath.start(t + 0.05, 0.5)
    breath.stop(t + 3.2)
    flutter.start(t)
    flutter.stop(t + 3.2)
  }

  /** A quiet, slowly moving low drone. */
  private startDrone(t: number): { stop(at: number): void } {
    const ctx = this.ctx
    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, t)
    out.gain.linearRampToValueAtTime(0.16, t + 1.2)
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 170
    lp.Q.value = 3
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.17
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = 60
    lfo.connect(lfoDepth).connect(lp.frequency)
    const oscs = [43.65, 44.1, 65.4].map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i === 2 ? "triangle" : "sawtooth"
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = i === 2 ? 0.25 : 0.5
      o.connect(g).connect(lp)
      o.start(t)
      return o
    })
    lp.connect(out)
    out.connect(this.master)
    out.connect(this.reverb)
    lfo.start(t)
    return {
      stop: (at: number) => {
        out.gain.cancelScheduledValues(at)
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), at)
        out.gain.exponentialRampToValueAtTime(0.0001, at + 0.8)
        for (const o of oscs) o.stop(at + 0.9)
        lfo.stop(at + 0.9)
      },
    }
  }

  /** Fade the drone with the light coming back; close the context after the reverb tail. */
  release(ms: number): void {
    const at = this.ctx.currentTime
    this.drone?.stop(at + Math.max(0, ms / 1000 - 0.8) * 0.5)
    this.drone = null
    window.setTimeout(() => void this.ctx.close(), ms + 4000)
  }
}
