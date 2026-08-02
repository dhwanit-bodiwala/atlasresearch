// frost.frag.glsl
// Ice crystal growth pattern — spreads from center outward on synthesis event
// uFrostAmount: 0.0 = no frost, 1.0 = fully covered

uniform float uTime;
uniform float uFrostAmount;  // Animated 0→1 on synthesizer_completed
uniform vec3 uFrostColor;    // vec3(0.7, 0.85, 1.0) — cold blue-white

varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Voronoi-based crystal growth pattern
vec2 voronoi(vec2 x) {
  vec2 p = floor(x);
  vec2 f = fract(x);
  float minDist = 8.0;
  vec2 minPoint = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 b = vec2(float(i), float(j));
      vec2 r = b - f + fract(sin(dot(p + b, vec2(127.1, 311.7))) * 43758.5453);
      float d = dot(r, r);
      if (d < minDist) {
        minDist = d;
        minPoint = r;
      }
    }
  }
  return vec2(sqrt(minDist), dot(minPoint, minPoint));
}

void main() {
  vec2 uv = vUv;

  // Distance from center — frost grows outward from crystal contact points
  float dist = length(uv - 0.5) * 2.0;

  // Frost front: smooth edge that advances as uFrostAmount increases
  float frostFront = uFrostAmount * 1.4; // slightly overshot so edges fully cover
  float frostMask = smoothstep(frostFront, frostFront - 0.4, dist);

  // Voronoi crystal pattern for the frost texture
  vec2 vor = voronoi(uv * 12.0 + uTime * 0.1);
  float crystalPattern = vor.x * 0.5 + vor.y * 0.3;

  // Edge of frost cells = bright ice lines
  float iceLines = 1.0 - smoothstep(0.0, 0.08, vor.x);

  vec3 frostColor = mix(
    uFrostColor * 0.3,           // cell interior: dim
    uFrostColor,                  // cell edge: bright ice lines
    iceLines
  );

  // Add subtle noise variation within cells
  float variation = snoise(vec3(uv * 8.0, uTime * 0.05)) * 0.2 + 0.8;
  frostColor *= variation;

  float alpha = frostMask * (crystalPattern * 0.6 + iceLines * 0.4) * 0.7;

  gl_FragColor = vec4(frostColor, alpha);
}
