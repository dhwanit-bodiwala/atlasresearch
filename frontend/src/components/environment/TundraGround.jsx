import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function TundraGround({ scrollProgress }) {
  const meshRef = useRef()
  const [normalMap, roughnessMap] = useTexture([
    '/textures/Snow013_2K-JPG_NormalGL.jpg',
    '/textures/Snow013_2K-JPG_Roughness.jpg',
  ])
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(12, 12)
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping
  roughnessMap.repeat.set(12, 12)

  useFrame(() => {
    if (meshRef.current) {
      const t = scrollProgress.current || 0
      meshRef.current.material.opacity = Math.max(0, 1 - t * 1.5)
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.1, 120]}
    >
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial
        color="#c2d0dc"
        roughness={1.0}
        roughnessMap={roughnessMap}
        metalness={0}
        normalMap={normalMap}
        normalScale={[1.8, 1.8]}
        transparent
        opacity={1}
        depthWrite={false}
      />
    </mesh>
  )
}