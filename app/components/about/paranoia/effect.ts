/*
 * The enemy team's view, drawn as one fixed overlay canvas with
 * `pointer-events: none`, created on the click and removed at the end.
 *
 * WebGL2 (one fragment shader at half resolution): near-black murk built
 * from domain-warped value noise in two drifting layers, carrying a red
 * tint, deeper toward the screen edges, with a frayed, breathing edge around
 * a circle of sight that follows the pointer. Without WebGL2 a 2D canvas
 * draws the same circle with a radial gradient (no smoke texture).
 *
 * Phases: cast (the darkness closes from the edges inward to nothing), hold
 * (the circle opens and follows the pointer; clicks inside it still work,
 * the page itself is held still by the caller), release (the circle widens
 * until the light is back). A hidden tab ends the run at once: frames stop
 * there, and the reader should not come back to the dark.
 *
 * Ported from the paper lab (`~/Projects/paper-lab/src/paranoia/effect.ts`)
 * with its default settings fixed; loaded only on the first intent to press
 * the postscript's button (`app/components/about/Postscript.tsx`).
 */
/** The lab's default settings, fixed (owner, 15 Nov 2026: "nocturne ult is fine"). */
export interface ParanoiaSettings {
  /** Radius of the circle of sight around the pointer, CSS px. */
  radius: number
  /** Width of its soft, smoky edge, CSS px. */
  soft: number
  /** Opacity of the darkness, 0..1. */
  dark: number
  /** How much red the murk carries, 0..1. */
  tint: number
  castMs: number
  holdMs: number
  releaseMs: number
}

export function paranoiaSettings(): ParanoiaSettings {
  const phone = window.matchMedia("(max-width: 720px)").matches
  return {
    radius: phone ? 110 : 150,
    soft: phone ? 48 : 64,
    dark: 0.97,
    tint: 0.55,
    castMs: 500,
    holdMs: 6000,
    releaseMs: 800,
  }
}

export interface RunOptions {
  settings(): ParanoiaSettings
  /** Where the circle starts (CSS px, viewport): the pointer, or the button for a keyboard press. */
  origin: [number, number]
  reduced: boolean
  /** Called when the release starts (the sound fades with it); `early` for Escape, a click or a double tap. */
  onRelease(ms: number, early: boolean): void
  onEnd(stats: {
    frames: number
    avgMs: number
    maxMs: number
    renderer: string
  }): void
}

export interface Run {
  /** End early: go straight to the release. */
  stop(): void
}

const SCALE = 0.5 // canvas px per CSS px: the murk is soft, half resolution is plenty
const OPEN_MS = 260 // the circle opening after the cast

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uScale;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uSoft;
uniform float uDark;
uniform float uTint;
uniform float uTime;
uniform float uAlpha;
out vec4 o;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;
  vec2 q = css * 0.0042;
  float t = uTime;
  // Domain-warped smoke in two layers that drift against each other.
  vec2 w = vec2(fbm(q + vec2(0.0, t * 0.045)), fbm(q + vec2(5.2, 1.3) - t * 0.035));
  float smoke = fbm(q * 1.6 + 2.4 * w + vec2(t * 0.03, -t * 0.02));
  float wisps = fbm(q * 3.6 - 1.6 * w + vec2(-t * 0.07, t * 0.05));

  // The edge of sight frays and breathes with the smoke.
  float d = distance(css, uCenter);
  float edge = uRadius + (smoke - 0.5) * uSoft * 0.9;
  float cover = smoothstep(edge - uSoft * 0.45, edge + uSoft, d);
  // Thicker shadow hugging the edge, outside the light.
  float rim = exp(-pow((d - edge - uSoft * 0.7) / (uSoft * 0.9 + 1.0), 2.0));

  vec3 col = vec3(0.010, 0.007, 0.010);
  vec3 red = vec3(0.34, 0.03, 0.05);
  col += red * uTint * (0.22 * smoke * smoke + 0.62 * pow(wisps, 2.6));
  col += vec3(0.20, 0.015, 0.03) * uTint * rim * smoke * 0.7;

  // Deeper toward the screen's edges.
  vec2 uv = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.65 * smoothstep(0.18, 0.72, length(uv * vec2(1.0, 0.9)));

  float a = clamp(cover * uDark * (0.96 + 0.04 * smoke + 0.04 * rim), 0.0, 1.0) * uAlpha;
  o = vec4(col * a, a);
}`

type Draw = (u: {
  w: number
  h: number
  cx: number
  cy: number
  r: number
  soft: number
  dark: number
  tint: number
  time: number
  alpha: number
}) => void

function makeGl(
  canvas: HTMLCanvasElement
): { draw: Draw; dispose(): void; renderer: string } | null {
  const gl = canvas.getContext("webgl2", {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  })
  if (!gl) return null
  const sh = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type)
    if (!s) return null
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      return null
    }
    return s
  }
  const vs = sh(gl.VERTEX_SHADER, VERT)
  const fs = sh(gl.FRAGMENT_SHADER, FRAG)
  const prog = gl.createProgram()
  if (!vs || !fs || !prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  )
  const loc = gl.getAttribLocation(prog, "aPos")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  gl.useProgram(prog)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const U = {
    res: u("uRes"),
    scale: u("uScale"),
    center: u("uCenter"),
    radius: u("uRadius"),
    soft: u("uSoft"),
    dark: u("uDark"),
    tint: u("uTint"),
    time: u("uTime"),
    alpha: u("uAlpha"),
  }
  return {
    renderer: "webgl2",
    draw(p) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.scale, canvas.width / p.w)
      gl.uniform2f(U.center, p.cx, p.cy)
      gl.uniform1f(U.radius, p.r)
      gl.uniform1f(U.soft, p.soft)
      gl.uniform1f(U.dark, p.dark)
      gl.uniform1f(U.tint, p.tint)
      gl.uniform1f(U.time, p.time)
      gl.uniform1f(U.alpha, p.alpha)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    },
  }
}

function make2d(canvas: HTMLCanvasElement): {
  draw: Draw
  dispose(): void
  renderer: string
} {
  const c = canvas.getContext("2d")!
  return {
    renderer: "canvas2d",
    draw(p) {
      const k = canvas.width / p.w
      c.setTransform(k, 0, 0, k, 0, 0)
      c.clearRect(0, 0, p.w, p.h)
      const r0 = Math.max(0, p.r - p.soft * 0.45)
      const r1 = p.r + p.soft
      const g = c.createRadialGradient(p.cx, p.cy, r0, p.cx, p.cy, r1)
      const a = p.dark * p.alpha
      const tint = `${Math.round(10 + 60 * p.tint)}, 4, 8`
      g.addColorStop(0, `rgba(${tint}, 0)`)
      g.addColorStop(1, `rgba(${tint}, ${a})`)
      c.fillStyle = g
      c.fillRect(0, 0, p.w, p.h)
    },
    dispose() {},
  }
}

const easeIn = (k: number, p: number) =>
  Math.pow(Math.min(1, Math.max(0, k)), p)
const easeOut = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3)

export function runParanoia(o: RunOptions): Run {
  const canvas = document.createElement("canvas")
  canvas.setAttribute("aria-hidden", "true")
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000;display:block"
  document.body.append(canvas)

  const size = () => {
    canvas.width = Math.max(1, Math.round(window.innerWidth * SCALE))
    canvas.height = Math.max(1, Math.round(window.innerHeight * SCALE))
  }
  size()
  const renderer = makeGl(canvas) ?? make2d(canvas)

  let target: [number, number] = [o.origin[0], o.origin[1]]
  let center: [number, number] = [o.origin[0], o.origin[1]]
  const start = performance.now()
  let releaseAt: number | null = null // ms since start
  let releaseFrom = 0
  let lastR = 0
  let last = start
  let raf = 0
  let frames = 0
  let total = 0
  let worst = 0
  let ended = false

  const onMove = (e: PointerEvent) => {
    target = [e.clientX, e.clientY]
  }
  // A mouse click ends it early; a single touch only moves the circle
  // there, a double tap anywhere ends it.
  let lastTap: { t: number; x: number; y: number } | null = null
  const onDown = (e: PointerEvent) => {
    target = [e.clientX, e.clientY]
    if (e.pointerType === "mouse" || e.pointerType === "pen") return stop()
    const now = performance.now()
    if (
      lastTap &&
      now - lastTap.t < 320 &&
      Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 48
    ) {
      lastTap = null
      return stop()
    }
    lastTap = { t: now, x: e.clientX, y: e.clientY }
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") stop()
  }
  const onVisibility = () => {
    if (document.visibilityState !== "hidden") return
    if (releaseAt === null) {
      releaseAt = performance.now() - start
      o.onRelease(0, true)
    }
    end()
  }
  window.addEventListener("pointermove", onMove, { passive: true })
  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("resize", size, { passive: true })
  window.addEventListener("keydown", onKey)
  // Attach after the click that started the run has finished dispatching.
  const attach = window.setTimeout(
    () =>
      window.addEventListener("pointerdown", onDown, {
        passive: true,
        capture: true,
      }),
    0
  )

  function stop(): void {
    if (releaseAt !== null) return
    const now = performance.now() - start
    releaseAt = now
    releaseFrom = lastR
    o.onRelease(o.settings().releaseMs, true)
  }

  const frame = (now: number) => {
    const s = o.settings()
    const reduced = o.reduced
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    const t = now - start
    const w = window.innerWidth
    const h = window.innerHeight
    const far = Math.hypot(w, h) + s.soft * 2
    // The cast closes in from every edge at once: the first frame already
    // darkens all four sides (the front starts at the nearest edge).
    const corner =
      Math.min(center[0], w - center[0], center[1], h - center[1], h * 0.45) +
      s.soft

    // The circle follows with a slight lag (none under reduced motion).
    const k = reduced ? 1 : 1 - Math.exp(-dt / 0.09)
    center = [
      center[0] + (target[0] - center[0]) * k,
      center[1] + (target[1] - center[1]) * k,
    ]

    const holdEnd = s.castMs + s.holdMs
    if (releaseAt === null && t >= holdEnd) {
      releaseAt = holdEnd
      releaseFrom = lastR
      o.onRelease(s.releaseMs, false)
    }

    let r: number
    let alpha = 1
    if (releaseAt !== null) {
      const kr = (t - releaseAt) / (reduced ? 1 : s.releaseMs)
      if (kr >= 1) return end()
      r = reduced
        ? s.radius
        : releaseFrom + (far - releaseFrom) * easeIn(kr, 2.2)
      alpha = reduced ? 1 : 1 - easeIn((kr - 0.55) / 0.45, 1.5)
    } else if (reduced) {
      r = s.radius
    } else if (t < s.castMs) {
      // Heavy: slow to start, then it slams shut.
      const kc = t / s.castMs
      r = corner * (1 - easeIn(kc, 1.7))
      alpha = Math.min(1, 0.7 + kc * 1.2)
    } else {
      r = s.radius * easeOut((t - s.castMs) / OPEN_MS)
    }
    lastR = r

    const c0 = performance.now()
    renderer.draw({
      w,
      h,
      cx: center[0],
      cy: center[1],
      r,
      soft: s.soft,
      dark: s.dark,
      tint: s.tint,
      time: reduced ? 0 : t / 1000,
      alpha,
    })
    const cost = performance.now() - c0
    frames++
    total += cost
    worst = Math.max(worst, cost)
    raf = requestAnimationFrame(frame)
  }

  function end(): void {
    if (ended) return
    ended = true
    cancelAnimationFrame(raf)
    window.clearTimeout(attach)
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerdown", onDown, { capture: true })
    window.removeEventListener("resize", size)
    window.removeEventListener("keydown", onKey)
    document.removeEventListener("visibilitychange", onVisibility)
    renderer.dispose()
    canvas.remove()
    o.onEnd({
      frames,
      avgMs: frames ? total / frames : 0,
      maxMs: worst,
      renderer: renderer.renderer,
    })
  }

  raf = requestAnimationFrame(frame)
  return { stop }
}
