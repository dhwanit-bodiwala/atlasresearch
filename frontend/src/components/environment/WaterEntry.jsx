import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FLASH_DURATION = 0.4
const MAX_RADIUS = 6

export default function WaterEntry({ fallPhaseRef }) {
  const triggered = useRef(false)
  const time = useRef(0)
  const meshRef = useRef()

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), [])

  // Thin caustic ring — very narrow
  const geom = useMemo(() =>
    new THREE.RingGeometry(0.92, 1.0, 128),
  [])

  useFrame((_, delta) => {
    const phase = fallPhaseRef?.current
    const mesh = meshRef.current
    if (!mesh) return

    // Trigger on water_entry
    if (phase === 'water_entry' && !triggered.current) {
      triggered.current = true
      time.current = 0
    }

    if (!triggered.current) {
      material.opacity = 0
      mesh.scale.setScalar(0.01)
      return
    }

    time.current += delta

    const progress = Math.min(1, time.current / FLASH_DURATION)

    // Expand from 0 to MAX_RADIUS very fast
    const currentRadius = THREE.MathUtils.lerp(0.01, MAX_RADIUS, progress)
    mesh.scale.setScalar(currentRadius)

    // Opacity: 0 → 1 in first 30%, then 1 → 0 in remaining 70%
    let opacity = 0
    if (progress < 0.3) {
      opacity = progress / 0.3
    } else {
      opacity = 1 - ((progress - 0.3) / 0.7)
    }

    // Second smaller inner flash ring — fake it with scale pulse on same mesh
    material.opacity = opacity * 0.9

    // Reset after flash completes so it doesn't linger
    if (progress >= 1) {
      material.opacity = 0
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geom}
      material={material}
      position={[0, -0.3, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={0.01}
    />
  )
}
