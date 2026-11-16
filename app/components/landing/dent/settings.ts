/**
 * The homepage dent's look, as the owner chose it in the paper lab on 14 Nov
 * 2026 ("Memory Sheet"). Tune here; nothing else needs reading to change
 * how deep, wide or long-lived a dent is.
 */
export const DENT = {
  /** Multiplies the relief of everything below. */
  strength: 1,
  /** Degrees the light comes from on screen: 0 = right, 90 = top, 135 = upper left. */
  lightAngle: 135,
  /** Paper fibre visibility, 0 to 1. */
  grain: 0.5,
  /** Depth of a fresh press, CSS px of the height field. */
  depth: 5,
  /** Radius of the fingertip, CSS px. */
  radius: 35,
  /** Share of a dent that stays and heals slowly; the rest springs back. */
  plasticity: 0.53,
  /** Seconds until a full-depth set is gone. */
  heal: 14,
  /** Penumbra of the dent's own shadow. */
  softness: 0.2,
  /** The displaced paper piled up just outside the rim, share of local depth. */
  lip: 0.6,
} as const

export type DentSettings = typeof DENT

/** Canvas device pixel ratio cap. */
export const MAX_DPR = 1.5

/**
 * After the last dent has healed and nobody has pressed for this long, the
 * canvas and the large textures are released (the device and pipelines
 * stay, so the next press needs no compile).
 */
export const RELEASE_AFTER_MS = 30_000
