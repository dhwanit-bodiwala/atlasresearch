import * as THREE from 'three'

export default function IceCrack({ scrollProgress = 0 }) {
  const crackOpacity = Math.max(0, (scrollProgress - 0.9) / 0.1)

  const shape = new THREE.Shape()
  
  // Center point
  shape.moveTo(0, 0)
  
  // Arm 1: center → top-left
  shape.lineTo(-0.3, 0.8)
  shape.lineTo(-0.5, 1.2)
  shape.lineTo(-0.7, 1.8)
  shape.lineTo(-0.3, 0.8)
  shape.lineTo(0, 0)
  
  // Sub-branch from arm 1
  shape.moveTo(-0.5, 1.2)
  shape.lineTo(-0.9, 1.4)
  shape.lineTo(-0.5, 1.2)
  
  // Arm 2: center → right
  shape.moveTo(0, 0)
  shape.lineTo(0.4, 0.6)
  shape.lineTo(0.8, 1.0)
  shape.lineTo(1.4, 1.6)
  shape.lineTo(0.8, 1.0)
  shape.lineTo(0.4, 0.6)
  shape.lineTo(0, 0)
  
  // Sub-branch from arm 2
  shape.moveTo(0.8, 1.0)
  shape.lineTo(1.0, 0.6)
  shape.lineTo(0.8, 1.0)
  
  // Arm 3: center → bottom
  shape.moveTo(0, 0)
  shape.lineTo(-0.2, -0.7)
  shape.lineTo(-0.4, -1.4)
  shape.lineTo(-0.2, -2.2)
  shape.lineTo(-0.4, -1.4)
  shape.lineTo(-0.2, -0.7)
  shape.lineTo(0, 0)
  
  // Sub-branch from arm 3
  shape.moveTo(-0.4, -1.4)
  shape.lineTo(-0.8, -1.6)
  shape.lineTo(-0.4, -1.4)
  
  // Arm 4: center → top-right
  shape.moveTo(0, 0)
  shape.lineTo(0.6, 0.9)
  shape.lineTo(1.2, 1.8)
  shape.lineTo(1.8, 2.8)
  shape.lineTo(1.2, 1.8)
  shape.lineTo(0.6, 0.9)
  shape.lineTo(0, 0)

  const geometry = new THREE.ShapeGeometry(shape)

  return (
    <mesh
      geometry={geometry}
      position={[0, -0.97, 0]}
      rotation={-Math.PI / 2}
    >
      <meshBasicMaterial
        color="#1a2535"
        transparent={true}
        opacity={crackOpacity}
      />
    </mesh>
  )
}
