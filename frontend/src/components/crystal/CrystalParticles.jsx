import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import particleVertex from './shaders/particleVertex.glsl'
import particleFrag from './shaders/particleFrag.glsl'

const PARTICLE_COUNT = 250
const WRAP_RADIUS = 3.5

export default function CrystalParticles() {
  const pointsRef = useRef()
  const materialRef = useRef()

  const { positions, aVelocity, aPhase } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const aVelocity = new Float32Array(PARTICLE_COUNT * 3)
    const aPhase = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      const r = 0.4 + Math.random() * 1.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)

      // Random normalized outward vector * 0.03
      const vx = Math.random() * 2 - 1
      const vy = Math.random() * 2 - 1
      const vz = Math.random() * 2 - 1
      const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1
      aVelocity[i3] = (vx / vLen) * 0.03
      aVelocity[i3 + 1] = (vy / vLen) * 0.03
      aVelocity[i3 + 2] = (vz / vLen) * 0.03

      aPhase[i] = Math.random()
    }

    return { positions, aVelocity, aPhase }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: typeof window !== 'undefined' ? window.devicePixelRatio : 1 },
      uSize: { value: 6.0 },
    }),
    [],
  )

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uPixelRatio.value = window.devicePixelRatio
    }

    const points = pointsRef.current
    if (!points) return

    const posAttr = points.geometry.getAttribute('position')
    const velAttr = points.geometry.getAttribute('aVelocity')
    const pos = posAttr.array
    const vel = velAttr.array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      pos[i3] += vel[i3]
      pos[i3 + 1] += vel[i3 + 1]
      pos[i3 + 2] += vel[i3 + 2]

      const dist = Math.sqrt(
        pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2],
      )

      if (dist > WRAP_RADIUS) {
        const scale = (0.3 + Math.random() * 0.5) / (dist || 1)
        pos[i3] *= scale
        pos[i3 + 1] *= scale
        pos[i3 + 2] *= scale
      }
    }

    posAttr.needsUpdate = true
  })

  useEffect(() => {
    return () => {
      const points = pointsRef.current
      if (points?.geometry) points.geometry.dispose()
      if (materialRef.current) materialRef.current.dispose()
    }
  }, [])

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aVelocity"
          count={PARTICLE_COUNT}
          array={aVelocity}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={PARTICLE_COUNT}
          array={aPhase}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertex}
        fragmentShader={particleFrag}
        uniforms={uniforms}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
