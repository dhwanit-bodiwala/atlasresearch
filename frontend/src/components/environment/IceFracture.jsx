import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

const ICE_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#8a9faf',
  roughness: 0.85,
  metalness: 0.05,
})

export default function IceFracture() {
  const { scene } = useGLTF('/ice_fracture.glb')

  const meshes = []
  scene.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child)
    }
  })

  return (
    <group position={[0, -6, 0]}>
      {meshes.map((mesh, i) => (
        <mesh
          key={i}
          geometry={mesh.geometry}
          material={ICE_MATERIAL}
          position={[
            mesh.position.x,
            mesh.position.y,
            mesh.position.z,
          ]}
          rotation={[
            mesh.rotation.x,
            mesh.rotation.y,
            mesh.rotation.z,
          ]}
          scale={[
            mesh.scale.x,
            mesh.scale.y,
            mesh.scale.z,
          ]}
          receiveShadow
        />
      ))}
    </group>
  )
}

useGLTF.preload('/ice_fracture.glb')
