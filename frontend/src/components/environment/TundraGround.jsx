import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function TundraGround() {
  const colorMap = useTexture('/textures/Snow013_2K-JPG_Color.jpg')
  const normalMap = useTexture('/textures/Snow013_2K-JPG_NormalGL.jpg')
  const roughnessMap = useTexture('/textures/Snow013_2K-JPG_Roughness.jpg')

  colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping

  colorMap.repeat.set(60, 60)
  normalMap.repeat.set(60, 60)
  roughnessMap.repeat.set(60, 60)

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1, 0]}
      geometry={new THREE.PlaneGeometry(600, 600, 1, 1)}
    >
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={0.95}
        metalness={0.0}
        color="#e8eef4"
      />
    </mesh>
  )
}
