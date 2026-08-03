import * as THREE from 'three'

export default function FrozenLake() {
  return (
    <mesh
      geometry={new THREE.CircleGeometry(18, 64)}
      position={[0, -0.98, 0]}
      rotation={-Math.PI / 2}
    >
      <meshPhysicalMaterial
        color="#c8d8e8"
        roughness={0.05}
        metalness={0.1}
        transmission={0.3}
        transparent={true}
        opacity={0.85}
        envMapIntensity={1.0}
      />
    </mesh>
  )
}
