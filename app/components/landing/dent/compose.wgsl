// Vertical half of the depth blur, then the displaced-material lip:
// the paper pushed out of a dent piles up just outside its rim.
// Output: r = surface height in px (negative in a dent, positive on the lip),
// g = depth, b = blurred depth (the dent's neighbourhood, for occlusion).
import { gauss_weight } from "./common.wgsl";

struct Compose {
  sigma: f32,
  stride: f32,
  lip: f32,
  // Depth (px) under which a texel counts as "outside" the dent.
  rim: f32,
}

@group(0) @binding(0) var<uniform> params: Compose;
@group(0) @binding(1) var state: texture_2d<f32>;
@group(0) @binding(2) var blur_x: texture_2d<f32>;

@fragment fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let p = vec2i(floor(pos.xy));
  let h = i32(textureDimensions(blur_x).y);
  var sum = 0.0;
  var weight = 0.0;
  for (var i = -16; i <= 16; i = i + 1) {
    let off = f32(i) * params.stride;
    let y = p.y + i32(round(off));
    let k = gauss_weight(off, params.sigma);
    if (y >= 0 && y < h) {
      sum = sum + k * textureLoad(blur_x, vec2i(p.x, y), 0).r;
    }
    weight = weight + k;
  }
  let blurred = sum / weight;
  let depth = textureLoad(state, p, 0).g;
  let outside = 1.0 - smoothstep(0.0, params.rim, depth);
  let lip = params.lip * max(blurred - depth, 0.0) * outside;
  return vec4f(lip - depth, depth, blurred, 1.0);
}
