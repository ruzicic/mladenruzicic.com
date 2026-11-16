export fn gauss_weight(x: f32, sigma: f32) -> f32 {
  return exp(-0.5 * x * x / max(sigma * sigma, 1e-4));
}
