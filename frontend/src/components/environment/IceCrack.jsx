import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useAtlasStore from '../../store/atlasStore'

export default function IceCrack({ scrollProgress, crackScaleRef }) {
  const meshRefs = useRef([])
  const crystalState = useAtlasStore((s) => s.crystalState)

  const armPoints = [
    [[0,0,0],[0.5,0,0.4],[1.0,0,0.9],[1.6,0,1.8],[2.0,0,2.5]],
    [[1.0,0,0.9],[1.6,0,0.6],[2.1,0,0.4]],
    [[0,0,0],[-0.4,0,0.5],[-0.8,0,1.1],[-1.3,0,1.8]],
    [[-0.8,0,1.1],[-1.4,0,0.85]],
    [[0,0,0],[0.3,0,-0.5],[0.5,0,-1.2]],
    [[0,0,0],[-0.1,0,0.7],[0.05,0,1.5]],
  ]

  const tubeGeos = useMemo(() => {
    return armPoints.map(pts => {
      const vectors = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]))
      const curve = new THREE.CatmullRomCurve3(vectors)
      return new THREE.TubeGeometry(curve, 20, 0.012, 5, false)
    })
  }, [])

  useFrame(() => {
    const isDescending = crystalState === 'DESCENDING'
    const t = scrollProgress.current
    const opacity = isDescending
      ? 1.0
      : Math.min(1, Math.max(0, (t - 0.35) / 0.5))

    meshRefs.current.forEach(m => {
      if (m) m.opacity = opacity
    })
  })

  return (
    <group position={[0, -0.98, 0]}>
      {tubeGeos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial
            ref={(el) => { if (el) meshRefs.current[i] = el }}
            color="#2a3d4d"
            roughness={0.9}
            metalness={0.0}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
