import * as THREE from 'three'
import { useMemo } from 'react'

function IceRidge({ x, z, width, height, opacity, seed }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    
    // Start bottom-left
    shape.moveTo(-width / 2, 0)
    
    // Create jagged top edge using pseudo-random points
    const segments = Math.floor(width / 8)
    const points = []
    
    // Simple seeded variation based on seed value
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const xPos = -width / 2 + t * width
      // Irregular height using multiple sine waves for natural look
      const h = height * (
        0.3 +
        0.4 * Math.abs(Math.sin(t * Math.PI * (2 + seed * 0.7))) +
        0.2 * Math.abs(Math.sin(t * Math.PI * (5 + seed * 1.3) + seed)) +
        0.1 * Math.abs(Math.sin(t * Math.PI * (9 + seed * 0.5) + seed * 2))
      )
      points.push({ x: xPos, y: h })
    }
    
    // Draw jagged top
    points.forEach(p => shape.lineTo(p.x, p.y))
    
    // Close bottom-right to bottom-left
    shape.lineTo(width / 2, 0)
    shape.lineTo(-width / 2, 0)
    
    return new THREE.ShapeGeometry(shape)
  }, [width, height, seed])

  return (
    <mesh position={[x, 0, z]} geometry={geometry}>
      <meshBasicMaterial
        color="#8a9aaa"
        transparent={true}
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function HorizonRidge() {
  const ridges = [
    { x: -120, z: -100, width: 120, height: 12, opacity: 0.40, seed: 1.2 },
    { x: -50,  z: -110, width: 80,  height: 9,  opacity: 0.34, seed: 2.7 },
    { x: 10,   z: -115, width: 60,  height: 7,  opacity: 0.28, seed: 0.8 },
    { x: 70,   z: -105, width: 100, height: 11, opacity: 0.38, seed: 3.4 },
    { x: 140,  z: -100, width: 130, height: 14, opacity: 0.44, seed: 1.9 },
    { x: 200,  z: -108, width: 90,  height: 10, opacity: 0.32, seed: 4.1 },
    { x: -180, z: -95,  width: 110, height: 13, opacity: 0.40, seed: 2.3 },
    { x: 240,  z: -102, width: 70,  height: 8,  opacity: 0.26, seed: 0.5 },
    { x: -240, z: -107, width: 85,  height: 9,  opacity: 0.30, seed: 3.8 },
    { x: 100,  z: -118, width: 55,  height: 6,  opacity: 0.24, seed: 1.5 },
  ]

  return (
    <group>
      {ridges.map((ridge, i) => (
        <IceRidge key={i} {...ridge} />
      ))}
    </group>
  )
}