// Horizontal Gaussian of the total depth (state.g) at sim resolution. The
// vertical half lives in compose.wgsl, which also builds the final height.
import { gauss_weight } from "./common.wgsl";

struct Blur {
  sigma: f32,
  stride: f32,
}

@group(0) @binding(0) var<uniform> params: Blur;
@group(0) @binding(1) var state: texture_2d<f32>;

@fragment fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let p = vec2i(floor(pos.xy));
  let w = i32(textureDimensions(state).x);
  var sum = 0.0;
  var weight = 0.0;
  for (var i = -16; i <= 16; i = i + 1) {
    let off = f32(i) * params.stride;
    let x = p.x + i32(round(off));
    let k = gauss_weight(off, params.sigma);
    if (x >= 0 && x < w) {
      sum = sum + k * textureLoad(state, vec2i(x, p.y), 0).g;
    }
    weight = weight + k;
  }
  return vec4f(sum / weight, 0.0, 0.0, 1.0);
}
