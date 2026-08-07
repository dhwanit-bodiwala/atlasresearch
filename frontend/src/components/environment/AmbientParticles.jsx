import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 180

function createCircleTexture() {
  const size = 64
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(size, size)
    : document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function AmbientParticles({ crystalYRef }) {
  const pointsRef = useRef()

  const alphaMap = useMemo(() => createCircleTexture(), [])

  const { positions, offsets, velocities } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const offsets = new Float32Array(PARTICLE_COUNT)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      const col = i % 12
      const row = Math.floor(i / 12)
      // Loose grid: base position from grid, then jitter
      positions[i3]     = (col / 12 - 0.5) * 28 + (Math.random() - 0.5) * 2.2
      positions[i3 + 1] = (Math.random() - 0.5) * 16
      positions[i3 + 2] = (row / 15 - 0.5) * 28 + (Math.random() - 0.5) * 2.2 - 8

      // Store the local y offset for each particle
      offsets[i] = positions[i3 + 1]

      // Velocities: vx and vz ±0.002, vy 0.003–0.008
      velocities[i3]     = (Math.random() - 0.5) * 0.004
      velocities[i3 + 1] = 0.003 + Math.random() * 0.005
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.004
    }

    return { positions, offsets, velocities }
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

      // Apply horizontal drift
      arr[i3]     += velocities[i3]
      arr[i3 + 2] += velocities[i3 + 2]

      // Drift the local y offset upward
      offsets[i] += velocities[i3 + 1]

      // Flip horizontal velocity if x or z exceeds ±10
      if (arr[i3] > 10 || arr[i3] < -10) velocities[i3] *= -1
      if (arr[i3 + 2] > 10 || arr[i3 + 2] < -10) velocities[i3 + 2] *= -1

      // Loop local y offset
      if (offsets[i] > 6) offsets[i] = -6

      // Set y = crystal position + local offset
      arr[i3 + 1] = crystalY + offsets[i]
    }

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.12}
        color="#d8eaf0"
        transparent
        opacity={0.18}
        alphaMap={alphaMap}
        alphaTest={0.01}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
