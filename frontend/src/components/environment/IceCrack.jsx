import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

export default function IceCrack({ scrollProgress }) {
  const materialRefs = useRef([])

  useFrame(() => {
    const t = scrollProgress.current
    const opacity = Math.min(1, Math.max(0, (t - 0.35) / 0.5))
    materialRefs.current.forEach((m, idx) => {
      if (!m) return
      // Even indices = dark fissure, odd = shadow pass (softer)
      m.fog = false
      m.opacity = idx % 2 === 0 ? opacity : opacity * 0.25
    })
  })

  const arms = useMemo(() => [
    // Primary fissure — runs forward-right (longest, most prominent)
    [[0,0,0], [0.45,0,0.35], [0.85,0,0.75], [1.3,0,1.4], [1.75,0,2.2], [2.1,0,2.55]],
    [[0.85,0,0.75], [1.5,0,0.55], [2.0,0,0.4]],
    [[0,0,0], [-0.35,0,0.4], [-0.7,0,1.0], [-1.15,0,1.65], [-1.4,0,2.1]],
    [[-0.7,0,1.0], [-1.3,0,0.85], [-1.7,0,0.7]],
    [[0,0,0], [0.25,0,-0.45], [0.6,0,-0.95], [0.45,0,-1.5]],
    [[0,0,0], [-0.15,0,0.6], [0.05,0,1.2], [-0.1,0,1.8]],
  ], [])

  return (
    <group position={[0, -1.01, 0]} scale={1.6}>
      {arms.map((arm, i) => (
        <group key={i}>
          {/* Pass 1 — dark fissure */}
          <Line
            ref={(el) => { if (el) materialRefs.current[i * 2] = el.material }}
            points={arm.map(p => new THREE.Vector3(...p))}
            color="#4a6272"
            lineWidth={3.0}
            transparent
            opacity={0}
          />
          {/* Pass 2 — ice glow */}
          <Line
            ref={(el) => { if (el) materialRefs.current[i * 2 + 1] = el.material }}
            points={arm.map(p => new THREE.Vector3(...p))}
            color="#38505e"
            lineWidth={3.5}
            transparent
            opacity={0}
          />
        </group>
      ))}
    </group>
  )
}
