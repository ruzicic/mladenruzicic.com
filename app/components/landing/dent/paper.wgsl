// The paper look of the homepage dent: fibre grain, one light, and the
// overlay that turns a shaded colour into "black or white at some alpha" over
// the DOM paper, so flat paper stays exactly transparent.
import { simplex2d } from "@vgpu/wgsl-std/noise/simplex";
import { pcg2d, unitFloat } from "@vgpu/wgsl-std/hash";

// Paper fibre relief at a page position (CSS px). Two elongated layers at
// different angles plus a fine tooth; roughly in (-1, 1).
export fn fibre(p: vec2f) -> f32 {
  let r1 = mat2x2f(0.94, 0.34, -0.34, 0.94);
  let r2 = mat2x2f(0.42, -0.91, 0.91, 0.42);
  let a = simplex2d((r1 * p) * vec2f(0.11, 0.38));
  let b = simplex2d((r2 * p) * vec2f(0.13, 0.33) + vec2f(17.3, 4.1));
  let tooth = simplex2d(p * 0.62 + vec2f(3.7, 9.2));
  let cloud = simplex2d(p * 0.07 + vec2f(-5.1, 2.6));
  return 0.3 * a + 0.25 * b + 0.3 * tooth + 0.15 * cloud;
}

// Gradient of `fibre` by central differences, 0.75 CSS px apart.
export fn fibre_gradient(p: vec2f) -> vec2f {
  let e = 0.75;
  let gx = fibre(p + vec2f(e, 0.0)) - fibre(p - vec2f(e, 0.0));
  let gy = fibre(p + vec2f(0.0, e)) - fibre(p - vec2f(0.0, e));
  return vec2f(gx, gy) / (2.0 * e);
}

// Uniform noise in [0, 1) per pixel, for dithering and ray jitter.
export fn pixel_noise(p: vec2f, salt: u32) -> vec2f {
  let h = pcg2d(vec2u(bitcast<u32>(i32(p.x)), bitcast<u32>(i32(p.y)) ^ salt));
  return vec2f(unitFloat(h.x), unitFloat(h.y));
}

export fn srgb_to_linear(c: vec3f) -> vec3f {
  return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045));
}

export fn linear_to_srgb(c: vec3f) -> vec3f {
  let k = clamp(c, vec3f(0.0), vec3f(1.0));
  return select(1.055 * pow(k, vec3f(1.0 / 2.4)) - 0.055, k * 12.92, k <= vec3f(0.0031308));
}

fn luma(c: vec3f) -> f32 {
  return dot(c, vec3f(0.2126, 0.7152, 0.0722));
}

// The canvas sits under the text and over the CSS paper, and the browser blends
// in sRGB. Express the wanted sRGB colour `want` over `paper` as premultiplied
// black (darker) or white (lighter). `dither` is in [0, 1).
export fn overlay(want: vec3f, paper: vec3f, dither: f32) -> vec4f {
  let w = luma(want);
  let p = max(luma(paper), 1e-3);
  let n = (dither - 0.5) / 255.0;
  if (w < p) {
    let a = clamp(1.0 - w / p + n, 0.0, 1.0);
    return vec4f(0.0, 0.0, 0.0, a);
  }
  let a = clamp((w - p) / max(1.0 - p, 1e-3) + n, 0.0, 1.0);
  return vec4f(a, a, a, a);
}

// Screen-space direction towards the light (y down) for an angle in degrees
// where 0 = right, 90 = top.
export fn light_dir(angle_deg: f32) -> vec2f {
  let a = radians(angle_deg);
  return vec2f(cos(a), -sin(a));
}
