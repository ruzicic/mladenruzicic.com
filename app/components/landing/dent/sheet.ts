/**
 * The paper's memory: a persistent height field the pointer carves into.
 *
 * Per frame, at half resolution: up to four fixed 1/60 s steps of
 * `step.wgsl` (ping-pong between two float targets), a separable blur of
 * the depth for the displaced lip (`blur.wgsl` + `compose.wgsl`), then
 * `shade.wgsl` lights the result at full resolution onto the canvas.
 *
 * Part of each dent is elastic and springs back in about a second, part is
 * plastic and heals over `heal` seconds, so a dragged groove stays and
 * overlapping dents keep the deepest (nothing is stacked twice). The shading
 * marches each pixel's horizon towards the light, so a dent casts a soft
 * shadow across its own floor.
 */
import { effect, frame, pingPong, sampler, target } from "vgpu"
import type { Effect, Frame, Gpu, PingPongTargets, Target } from "vgpu"

import blurShader from "./blur.wgsl"
import composeShader from "./compose.wgsl"
import type { DentSettings } from "./settings"
import shadeShader from "./shade.wgsl"
import stepShader from "./step.wgsl"

/** Sim texels per CSS px (the shading filters the field smoothly). */
const SIM_SCALE = 0.5
const DT = 1 / 60
/** The finger sinks in (whole brush at once, so no stepping marks). */
const FORM_TAU = 0.05
/** The springy part comes back. */
const ELASTIC_TAU = 0.26
const MAX_STEPS = 4

export interface Look {
  /** sRGB 0..1, the paper the canvas sits on. */
  paper: readonly [number, number, number]
}

export class Sheet {
  readonly #gpu: Gpu
  readonly #step: Effect
  readonly #blur: Effect
  readonly #compose: Effect
  readonly #shade: Effect
  readonly #state: PingPongTargets
  readonly #blurX: Target
  readonly #field: Target
  #simSize: [number, number] = [1, 1]
  #view: [number, number] = [1, 1]

  // Pointer, in the layer's CSS px (the paper's own coordinates).
  #pressed = false
  #pointer: [number, number] = [0, 0]
  #stamped: [number, number] | null = null
  #pressStart = 0
  #lastActivity = -Infinity
  #accum = 0
  #lastTime: number | null = null
  /** How far the field has already been shifted with the page, sim texels. */
  #fieldScroll: [number, number] | null = null

  constructor(gpu: Gpu) {
    this.#gpu = gpu
    this.#step = effect(gpu, stepShader, { label: "dent-step" })
    this.#blur = effect(gpu, blurShader, { label: "dent-blur" })
    this.#compose = effect(gpu, composeShader, { label: "dent-compose" })
    this.#shade = effect(gpu, shadeShader, {
      label: "dent-shade",
      set: {
        samp: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
      },
    })
    // Tiny until the first press (`resize`), so an idle page holds no
    // large textures.
    this.#state = pingPong(gpu, 1, 1, {
      format: "rg32float",
      label: "dent-state",
    })
    this.#blurX = target(gpu, {
      size: [1, 1],
      format: "r16float",
      label: "dent-blur-x",
    })
    this.#field = target(gpu, {
      size: [1, 1],
      format: "rgba16float",
      label: "dent-field",
    })
  }

  /** Builds every pipeline ahead of the first press. */
  async compile(output: Target): Promise<void> {
    await Promise.all([
      this.#step.compile(this.#state.write),
      this.#blur.compile(this.#blurX),
      this.#compose.compile(this.#field),
      this.#shade.compile(output),
    ])
  }

  /**
   * The canvas size in CSS px. A new size forgets the dents (the field
   * covers the canvas window). `[1, 1]` releases the textures.
   */
  resize(view: [number, number]): void {
    const w = Math.max(1, Math.ceil(view[0] * SIM_SCALE))
    const h = Math.max(1, Math.ceil(view[1] * SIM_SCALE))
    this.#view = [view[0], view[1]]
    if (w === this.#simSize[0] && h === this.#simSize[1]) return
    this.#simSize = [w, h]
    this.#state.read.resize([w, h])
    this.#state.write.resize([w, h])
    this.#blurX.resize([w, h])
    this.#field.resize([w, h])
    this.#clearState()
  }

  #clearState(): void {
    frame(this.#gpu, (f) => {
      f.pass({ target: this.#state.read, clear: [0, 0, 0, 0] }, () => {})
      f.pass({ target: this.#state.write, clear: [0, 0, 0, 0] }, () => {})
    })
  }

  press(x: number, y: number, t: number): void {
    this.#pressed = true
    this.#pointer = [x, y]
    this.#stamped = [x, y]
    this.#pressStart = t
    this.#lastActivity = t
  }

  move(x: number, y: number, t: number): void {
    this.#pointer = [x, y]
    this.#lastActivity = t
  }

  release(t: number): void {
    this.#pressed = false
    this.#stamped = null
    this.#lastActivity = t
  }

  /** True while anything can still be visible. */
  alive(t: number, s: DentSettings): boolean {
    if (this.#pressed) return true
    return t - this.#lastActivity < (Math.max(s.heal, 1.6) + 0.25) * 1000
  }

  /** Time (ms) of the last press, move or release. */
  get lastActivity(): number {
    return this.#lastActivity
  }

  /**
   * Advances the field to `t` (ms) and draws it into `output`. `origin` is
   * the position of the canvas's top-left corner on the paper (CSS px). The
   * field is fixed to the paper, so when the origin moves it is shifted by
   * the same amount (whole sim texels; the remainder is applied when
   * sampling).
   */
  render(
    output: Target,
    t: number,
    origin: [number, number],
    s: DentSettings,
    look: Look
  ): void {
    const last = this.#lastTime ?? t - DT * 1000
    this.#lastTime = t
    this.#accum = Math.min(this.#accum + (t - last) / 1000, MAX_STEPS * DT)
    let steps = 0
    while (this.#accum >= DT && steps < MAX_STEPS) {
      this.#accum -= DT
      steps++
    }
    if (steps === 0 && this.#fieldScroll === null) steps = 1

    const sx = origin[0] * SIM_SCALE
    const sy = origin[1] * SIM_SCALE
    let shift: [number, number] = [0, 0]
    if (this.#fieldScroll === null) {
      this.#fieldScroll = [Math.round(sx), Math.round(sy)]
    } else {
      shift = [
        Math.round(sx) - this.#fieldScroll[0],
        Math.round(sy) - this.#fieldScroll[1],
      ]
      this.#fieldScroll = [
        this.#fieldScroll[0] + shift[0],
        this.#fieldScroll[1] + shift[1],
      ]
    }
    // The step pass applies the shift, so a frame that moves the field runs
    // one even when no step is due (taken from the next frame's budget).
    if (steps === 0 && (shift[0] !== 0 || shift[1] !== 0)) {
      steps = 1
      this.#accum -= DT
    }
    const fieldOrigin: [number, number] = [
      this.#fieldScroll[0] / SIM_SCALE,
      this.#fieldScroll[1] / SIM_SCALE,
    ]
    const toSim = (q: [number, number]): [number, number] => [
      (q[0] - fieldOrigin[0]) * SIM_SCALE,
      (q[1] - fieldOrigin[1]) * SIM_SCALE,
    ]

    // Held still, the paper keeps yielding a little: wider and deeper.
    const held = this.#pressed ? Math.max(0, (t - this.#pressStart) / 1000) : 0
    const creep = 1 - Math.exp(-held / 1.4)
    const radius = s.radius * (1 + 0.28 * creep) * SIM_SCALE
    const sink = this.#pressed ? 1 - Math.exp(-held / FORM_TAU) : 0
    const depth = s.depth * (1 + 0.3 * creep) * sink

    // Heal: exponential plus a floor, so a full-depth set is gone in `heal` s.
    const plastic = Math.max(0.02, s.plasticity)
    const floorShare = 0.03
    const healTau =
      Math.max(0.2, s.heal) / Math.log(1 + (1.3 * plastic) / floorShare)
    const elasticFloorShare = 0.012

    const passes = (f: Frame): void => {
      for (let i = 0; i < steps; i++) {
        let from: [number, number] = [0, 0]
        let to: [number, number] = [0, 0]
        if (this.#pressed && this.#stamped) {
          from = toSim(this.#stamped)
          to = toSim(this.#pointer)
          this.#stamped = [this.#pointer[0], this.#pointer[1]]
        }
        this.#step.set({
          params: {
            shift: i === 0 ? shift : [0, 0],
            seg_from: from,
            seg_to: to,
            radius,
            depth,
            pressed: this.#pressed ? 1 : 0,
            plasticity: s.plasticity,
            k_form: 1,
            k_elastic: Math.exp(-DT / ELASTIC_TAU),
            elastic_floor: (elasticFloorShare * s.depth * DT) / ELASTIC_TAU,
            k_heal: Math.exp(-DT / healTau),
            heal_floor: (floorShare * s.depth * DT) / healTau,
          },
          src: this.#state.read,
        })
        f.pass(this.#state.write, this.#step)
        this.#state.swap()
      }

      const sigma = Math.max(2, 0.3 * radius)
      const stride = Math.max(1, (2.6 * sigma) / 16)
      this.#blur.set({ params: { sigma, stride }, state: this.#state.read })
      f.pass(this.#blurX, this.#blur)
      this.#compose.set({
        params: {
          sigma,
          stride,
          lip: s.lip,
          rim: Math.max(0.15, 0.06 * s.depth),
        },
        state: this.#state.read,
        blur_x: this.#blurX,
      })
      f.pass(this.#field, this.#compose)

      this.#shade.set({
        params: {
          view_css: this.#view,
          sim_scale: SIM_SCALE,
          strength: s.strength,
          sim_size: this.#simSize,
          scroll: origin,
          field_offset: [
            origin[0] - fieldOrigin[0],
            origin[1] - fieldOrigin[1],
          ],
          paper: look.paper,
          light_angle: s.lightAngle,
          grain: s.grain,
          softness: s.softness,
          reach: s.radius * 1.6,
          depth_ref: s.depth,
        },
        field: this.#field,
      })
      f.pass({ target: output, clear: [0, 0, 0, 0] }, this.#shade)
    }
    frame(this.#gpu, passes)
  }

  clear(output: Target): void {
    frame(this.#gpu, (f) =>
      f.pass({ target: output, clear: [0, 0, 0, 0] }, () => {})
    )
  }

  /** Forgets every dent (the sheet has come to rest). */
  reset(): void {
    this.#lastTime = null
    this.#accum = 0
    this.#fieldScroll = null
    this.#clearState()
  }

  dispose(): void {
    this.#step.dispose()
    this.#blur.dispose()
    this.#compose.dispose()
    this.#shade.dispose()
  }
}
