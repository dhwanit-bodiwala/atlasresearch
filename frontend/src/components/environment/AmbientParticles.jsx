import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 600

export default function AmbientParticles({ crystalYRef }) {
  const pointsRef = useRef()

  const { positions, offsets, drifts } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const offsets = new Float32Array(PARTICLE_COUNT)
    const drifts = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      // Random positions: x [-12,12], y [-5,5] relative offset, z [-12,12]
      positions[i3]     = (Math.random() - 0.5) * 24
      positions[i3 + 1] = (Math.random() - 0.5) * 10
      positions[i3 + 2] = (Math.random() - 0.5) * 24

      // Store the local y offset for each particle
      offsets[i] = positions[i3 + 1]

      // Drift velocities: x ±0.003, y +0.001 to +0.004, z ±0.003
      drifts[i3]     = (Math.random() - 0.5) * 0.006
      drifts[i3 + 1] = 0.001 + Math.random() * 0.003
      drifts[i3 + 2] = (Math.random() - 0.5) * 0.006
    }

    return { positions, offsets, drifts }
  }, [])

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geom
  }, [positions])

  useFrame(() => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position
    const arr = posAttr.array
    const crystalY = crystalYRef.current.value

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3

      // Apply drift to x and z
      arr[i3]     += drifts[i3]
      arr[i3 + 2] += drifts[i3 + 2]

      // Drift the local y offset upward
      offsets[i] += drifts[i3 + 1]

      // Wrap x if beyond ±12
      if (arr[i3] > 12) arr[i3] = -12
      if (arr[i3] < -12) arr[i3] = 12

      // Wrap z if beyond ±12
      if (arr[i3 + 2] > 12) arr[i3 + 2] = -12
      if (arr[i3 + 2] < -12) arr[i3 + 2] = 12

      // Wrap local y offset if it drifts beyond range
      if (offsets[i] > 5) offsets[i] = -5

      // Set y = crystal position + local offset
      arr[i3 + 1] = crystalY + offsets[i]
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#c8e4f0"
        size={2.0}
        sizeAttenuation
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
