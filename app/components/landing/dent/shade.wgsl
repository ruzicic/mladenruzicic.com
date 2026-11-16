// Lighting of the memory sheet at full resolution: normals from the height
// field, one light at the upper left, a horizon march towards the light for
// soft self-shadowing, cavity occlusion, fibre grain revealed by slope, and
// the black/white overlay that keeps flat paper transparent.
import { fibre, fibre_gradient, pixel_noise, srgb_to_linear, linear_to_srgb, overlay, light_dir } from "./paper.wgsl";

struct Shade {
  view_css: vec2f,      // viewport, CSS px
  sim_scale: f32,       // sim texels per CSS px
  strength: f32,        // global relief multiplier
  sim_size: vec2f,      // sim texture size, texels
  scroll: vec2f,        // page scroll, CSS px (grain is fixed to the page)
  field_offset: vec2f,  // sub-texel remainder of the field's scroll, CSS px
  paper: vec3f,         // sRGB 0..1
  light_angle: f32,     // degrees, 0 = right, 90 = top
  grain: f32,
  softness: f32,
  reach: f32,           // shadow march length, CSS px
  depth_ref: f32,       // nominal dent depth, px (normalises occlusion)
}

@group(0) @binding(0) var<uniform> params: Shade;
@group(0) @binding(1) var field: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

const TAN_ELEV: f32 = 0.34;   // raking light, about 19 degrees above the paper
const STEPS: i32 = 22;

fn uv_of(css: vec2f) -> vec2f {
  return (css + params.field_offset) * params.sim_scale / params.sim_size;
}

// Cubic B-spline of the height from four bilinear taps: a C2 surface between
// sim texels, so normals (and the rim) show no texel steps.
fn height_smooth(css: vec2f) -> f32 {
  let g = (css + params.field_offset) * params.sim_scale - 0.5;
  let base = floor(g);
  let f = g - base;
  let w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0;
  let w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;
  let w3 = f * f * f / 6.0;
  let w2 = 1.0 - w0 - w1 - w3;
  let s0 = w0 + w1;
  let s1 = w2 + w3;
  let t0 = (base - 1.0 + w1 / s0 + 0.5) / params.sim_size;
  let t1 = (base + 1.0 + w3 / s1 + 0.5) / params.sim_size;
  let h = (textureSampleLevel(field, samp, vec2f(t0.x, t0.y), 0.0).r * s0.x
         + textureSampleLevel(field, samp, vec2f(t1.x, t0.y), 0.0).r * s1.x) * s0.y
        + (textureSampleLevel(field, samp, vec2f(t0.x, t1.y), 0.0).r * s0.x
         + textureSampleLevel(field, samp, vec2f(t1.x, t1.y), 0.0).r * s1.x) * s1.y;
  return h * params.strength;
}

fn height(css: vec2f) -> f32 {
  return textureSampleLevel(field, samp, uv_of(css), 0.0).r * params.strength;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let css = uv * params.view_css;
  let f = textureSampleLevel(field, samp, uv_of(css), 0.0);
  let neighbourhood = f.b * params.strength;
  let depth = f.g * params.strength;

  // Nothing pressed near here: leave the paper alone (exactly transparent).
  if (neighbourhood < 0.004 && depth < 0.004 && abs(f.r) < 0.002) {
    return vec4f(0.0);
  }

  // Normal from the height field; one sim texel apart.
  let e = 1.0; // CSS px
  let hx = (height_smooth(css + vec2f(e, 0.0)) - height_smooth(css - vec2f(e, 0.0))) / (2.0 * e);
  let hy = (height_smooth(css + vec2f(0.0, e)) - height_smooth(css - vec2f(0.0, e))) / (2.0 * e);
  let slope = length(vec2f(hx, hy));

  // Fibres: always faintly there in a disturbed area, much stronger on walls
  // where the stretched paper catches the light at an angle.
  let page = css + params.scroll;
  let near = smoothstep(0.0, 0.5, neighbourhood + depth);
  let fibre_amp = params.grain * near * (0.03 + 0.10 * smoothstep(0.04, 0.5, slope));
  let g = fibre_gradient(page) * fibre_amp;
  let n = normalize(vec3f(-(hx + g.x), -(hy + g.y), 1.0));

  let l2 = light_dir(params.light_angle);
  let cos_e = inverseSqrt(1.0 + TAN_ELEV * TAN_ELEV);
  let light = vec3f(l2 * cos_e, TAN_ELEV * cos_e);

  // Horizon march towards the light: the highest occluder angle along the ray
  // against the light's elevation. Jittered start removes banding.
  let h0 = f.r * params.strength;
  let jitter = pixel_noise(css * 1.0, 7u).x;
  let step_len = params.reach / f32(STEPS);
  var horizon = -10.0;
  for (var i = 0; i < STEPS; i = i + 1) {
    let s = (f32(i) + 0.35 + 0.5 * jitter) * step_len;
    let hs = height(css + l2 * s);
    horizon = max(horizon, (hs - h0) / s);
  }
  let shadow = 1.0 - smoothstep(TAN_ELEV - params.softness, TAN_ELEV + params.softness * 0.35, horizon);

  // Lambert against the flat-paper value, so flat paper is exactly 1.
  let flat_ndl = light.z;
  let ndl = max(dot(n, light), 0.0) * shadow;
  let ambient = 0.40;
  var lum = ambient + (1.0 - ambient) * ndl / flat_ndl;

  // Cavity: deeper than its surroundings means less sky reaches it.
  let cavity = max(depth - neighbourhood, 0.0) / max(params.depth_ref * params.strength, 0.5);
  lum = lum * (1.0 - 0.22 * clamp(cavity, 0.0, 1.0));
  // The pressed paper itself sits a little below the page white, so the lit
  // wall can show on near-white paper. Only inside: a grey halo outside the
  // rim would read as the drop shadow of a raised shape.
  lum = lum * (1.0 - 0.11 * smoothstep(0.0, 0.45 * params.depth_ref * params.strength, depth));
  // Fibres also vary the albedo a touch where they are revealed.
  lum = lum * (1.0 + 0.25 * fibre(page) * fibre_amp);

  // Highlights compress: paper does not glow.
  if (lum > 1.0) {
    lum = 1.0 + (lum - 1.0) * 0.3;
  }

  let paper_lin = srgb_to_linear(params.paper);
  let want = linear_to_srgb(paper_lin * lum);
  return overlay(want, params.paper, pixel_noise(css, 91u).y);
}
