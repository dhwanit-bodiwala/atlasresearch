// particleVertex.glsl
// Velocity-based colour: fast particles = bright ice blue, slow = dim violet
// Matches igloo.inc's particle colouring behaviour exactly

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;

attribute vec3 aVelocity;    // Per-particle velocity vector
attribute float aPhase;      // Random phase offset per particle

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Colour by speed: map velocity magnitude to colour gradient
  float speed = length(aVelocity);
  float normalizedSpeed = clamp(speed / 0.08, 0.0, 1.0);

  // Slow: dark blue-grey → Fast: slightly lighter
  vec3 slowColor = vec3(0.15, 0.18, 0.28);
  vec3 fastColor = vec3(0.25, 0.35, 0.55);
  vColor = mix(slowColor, fastColor, normalizedSpeed);

  // Alpha: pulsing based on speed + phase
  vAlpha = 0.2 + normalizedSpeed * 0.6 + sin(uTime * 2.0 + aPhase) * 0.1;

  // Billboard point
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * uPixelRatio * (1.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
