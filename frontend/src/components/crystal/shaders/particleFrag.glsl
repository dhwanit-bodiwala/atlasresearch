// particleFrag.glsl
// Soft glowing points — not hard circles

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Soft circle: bright center, feathered edges
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  float circle = 1.0 - smoothstep(0.3, 0.5, dist);

  // Glow: extend beyond circle edge
  float glow = exp(-dist * 8.0) * 0.4;

  float alpha = (circle + glow) * vAlpha * 1.8;
  gl_FragColor = vec4(vColor, alpha);
}
