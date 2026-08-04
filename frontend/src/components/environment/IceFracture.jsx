import { useGLTF, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export default function IceFracture() {
  const { scene } = useGLTF('/ice_fracture.glb')

  const normalMap = useTexture('/textures/Snow013_2K-JPG_NormalGL.jpg')
  const roughnessMap = useTexture('/textures/Snow013_2K-JPG_Roughness.jpg')

  ;[normalMap, roughnessMap].forEach(t => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(6, 40)
  })

  const shelfMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#b0c0cc',
    roughness: 0.88,
    metalness: 0.02,
    normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughnessMap,
  }), [normalMap, roughnessMap])

  const voidMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#06090f',
  }), [])

  const meshes = []
  scene.traverse((child) => {
    if (child.isMesh) meshes.push(child)
  })

  // Void plane fills the gap between shelves
  const voidGeo = useMemo(() =>
    new THREE.PlaneGeometry(24, 500), [])

  return (
    <group>
      {/* Left shelf — tilted so inner edge dips down */}
      {meshes[0] && (
        <mesh
          geometry={meshes[0].geometry}
          material={shelfMaterial}
          position={[-46, -3.95, 150]}
          rotation={[0, 0, 0.08]}
          scale={[5, 1, 1]}
        />
      )}

      {/* Right shelf — mirrored tilt */}
      {meshes[1] && (
        <mesh
          geometry={meshes[1].geometry}
          material={shelfMaterial}
          position={[46, -3.95, 150]}
          rotation={[0, 0, -0.08]}
          scale={[5, 1, 1]}
        />
      )}

      {/* Dark void between the shelves */}
      <mesh
        geometry={voidGeo}
        material={voidMaterial}
        position={[0, -4.5, 150]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

useGLTF.preload('/ice_fracture.glb')
