// One simulation step of the memory sheet's height state (ping-pong).
// State texel: r = plastic set (px of depth that stays), g = total depth (px).
// Depths are positive numbers: 3.0 means the paper sits 3 px below the page.
struct Step {
  // Content offset in sim texels: the field scrolls with the page.
  shift: vec2f,
  // Brush segment, sim texels (previous and current pointer position).
  seg_from: vec2f,
  seg_to: vec2f,
  radius: f32,
  depth: f32,
  pressed: f32,
  plasticity: f32,
  // Per-step factors, computed on the CPU from dt.
  k_form: f32,
  k_elastic: f32,
  elastic_floor: f32,
  k_heal: f32,
  heal_floor: f32,
}

@group(0) @binding(0) var<uniform> params: Step;
@group(0) @binding(1) var src: texture_2d<f32>;

// A fingertip: a bowl with a steep wall near the rim, so the rim reads as an
// edge, not a fog. Depth at distance `d` from the stroke.
fn brush(p: vec2f) -> f32 {
  let ab = params.seg_to - params.seg_from;
  let t = clamp(dot(p - params.seg_from, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  let d = length(p - (params.seg_from + t * ab));
  let u = d / params.radius;
  // Rounded floor, and a wall about six CSS px wide: steep enough to read
  // as an edge, smooth enough not to stair-step.
  let w = min(0.45, 6.0 / params.radius);
  let wall = 1.0 - smoothstep(1.0 - w, 1.0, u);
  return params.depth * wall * (1.0 - 0.35 * u * u);
}

@fragment fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let texel = vec2i(floor(pos.xy)) + vec2i(params.shift);
  let dims = vec2i(textureDimensions(src));
  var s = vec4f(0.0);
  if (all(texel >= vec2i(0)) && all(texel < dims)) {
    s = textureLoad(src, texel, 0);
  }
  var plastic = s.r;
  let total0 = max(s.g, plastic);

  // The elastic part springs back fast; the plastic set heals slowly. Both
  // are exponential with a small linear floor so they reach exactly zero.
  let elastic = max((total0 - plastic) * params.k_elastic - params.elastic_floor, 0.0);
  plastic = max(plastic * params.k_heal - params.heal_floor, 0.0);
  var total = plastic + elastic;

  if (params.pressed > 0.5) {
    let want = brush(pos.xy);
    if (want > total) {
      total = total + (want - total) * params.k_form;
    }
    if (want > 0.0) {
      // Only what is under the finger yields; the rest just recovers.
      plastic = max(plastic, params.plasticity * total);
    }
  }
  return vec4f(plastic, total, 0.0, 1.0);
}
