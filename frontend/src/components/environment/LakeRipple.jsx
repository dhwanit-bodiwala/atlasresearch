import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RING_SEGMENTS = 128
const RING_DURATIONS = [5.0, 7.5]   // ring 0 faster, ring 1 slower and longer
const RING_MAX_RADII = [45, 58]      // ring 0 smaller, ring 1 reaches full shore
const RING_OPACITIES = [0.85, 0.6]  // ring 0 more visible, ring 1 subtler

function createRippleMaterial() {
  return new THREE.MeshBasicMaterial({
    color: '#2a4a5e',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

const TRIGGER_PHASES = {
  ripple_1: 0,
  ripple_2: 1,
}

export default function LakeRipple({ scrollProgress, fallPhaseRef }) {
  const ringsRef = useRef([
    { triggered: false, time: 0, meshRef: useRef() },
    { triggered: false, time: 0, meshRef: useRef() },
  ])

  const materials = useMemo(() => [
    createRippleMaterial(),
    createRippleMaterial(),
  ], [])

  const geom = useMemo(() =>
    new THREE.RingGeometry(0.988, 1.0, RING_SEGMENTS),
    [])

  useFrame((_, delta) => {
    const phase = fallPhaseRef?.current
    const scrollOpacity = Math.min(1, (scrollProgress?.current || 0) / 0.85)

    // Trigger rings on phase change
    const triggerIdx = TRIGGER_PHASES[phase]
    if (triggerIdx !== undefined) {
      const ring = ringsRef.current[triggerIdx]
      if (!ring.triggered) {
        ring.triggered = true
        ring.time = 0
      }
    }

    // Animate each ring
    ringsRef.current.forEach((ring, i) => {
      const mesh = ring.meshRef.current
      if (!mesh) return

      if (!ring.triggered) {
        materials[i].opacity = 0
        mesh.scale.setScalar(0.01)
        return
      }

      ring.time += delta

      const progress = Math.min(1, ring.time / RING_DURATIONS[i])

      // Ease out expansion — fast at start, slows near edge
      const eased = 1 - Math.pow(1 - progress, 2.2)
      const currentRadius = THREE.MathUtils.lerp(0.5, RING_MAX_RADII[i], eased)

      mesh.scale.setScalar(currentRadius)

      // Opacity: fade in fast (first 15%), hold, then fade out
      let opacity = 0
      if (progress < 0.15) {
        opacity = progress / 0.15               // 0 → 1 in first 15%
      } else {
        opacity = 1 - ((progress - 0.15) / 0.85) // 1 → 0 over remaining 85%
      }

      materials[i].opacity = opacity * RING_OPACITIES[i] * scrollOpacity
    })
  })

  return (
    <group>
      {ringsRef.current.map((ring, i) => (
        <mesh
          key={i}
          ref={ring.meshRef}
          geometry={geom}
          material={materials[i]}
          position={[0, -0.35, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.01}
        />
      ))}
    </group>
  )
}
