import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useAtlasStore from '../../store/atlasStore'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uOpacity;
varying vec2 vUv;

float shaft(float x, float center, float width) {
  return smoothstep(0.0, width, width - abs(x - center));
}

void main() {
  float rays = 0.0;
  rays += shaft(vUv.x, 0.2, 0.06);
  rays += shaft(vUv.x, 0.4, 0.04);
  rays += shaft(vUv.x, 0.55, 0.08);
  rays += shaft(vUv.x, 0.72, 0.035);
  rays += shaft(vUv.x, 0.85, 0.05);

  float fade = (1.0 - vUv.y) * vUv.y * 3.0;
  float flicker = 0.85 + 0.15 * sin(uTime * 0.7 + vUv.x * 8.0);

  float alpha = rays * fade * flicker * uOpacity;
  gl_FragColor = vec4(0.78, 0.92, 1.0, alpha);
}
`

export default function GodRays({ crystalYRef }) {
  const meshRef = useRef()
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const targetOpacity = useRef(0.18)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 0.18 },
  }), [])

  useEffect(() => {
    if (pipelineStage === 'gatherer') targetOpacity.current = 0.18
    if (pipelineStage === 'synthesizer') targetOpacity.current = 0.08
    if (pipelineStage === 'critic') targetOpacity.current = 0.0
  }, [pipelineStage])

  useFrame(({ camera }, delta) => {
    if (!meshRef.current) return

    // Lerp opacity toward target
    uniforms.uOpacity.value = THREE.MathUtils.lerp(
      uniforms.uOpacity.value,
      targetOpacity.current,
      0.01
    )

    // Update time
    uniforms.uTime.value += delta

    // Position above crystal
    meshRef.current.position.y = crystalYRef.current.value + 16

    // Billboard: face the camera
    meshRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[18, 28]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
