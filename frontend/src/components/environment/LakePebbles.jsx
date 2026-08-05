import { useMemo } from 'react'
import * as THREE from 'three'

function createSeededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return function() {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const PERIMETER_ANCHORS = (() => {
  const outer = new THREE.Shape()
  outer.moveTo(0, -36)
  outer.bezierCurveTo(20, -42, 46, -26, 47, -7)
  outer.bezierCurveTo(49, 10, 55, 30, 33, 40)
  outer.bezierCurveTo(14, 49, -13, 52, -34, 38)
  outer.bezierCurveTo(-51, 26, -46, 1, -49, -17)
  outer.bezierCurveTo(-52, -33, -30, -38, -14, -40)
  outer.bezierCurveTo(-6, -42, -10, -32, 0, -36)
  
  const pts = outer.getSpacedPoints(120) 
  return pts.map(p => new THREE.Vector3(p.x, 0, -p.y))
})()

const PEBBLE_COLORS = ['#6a6e72', '#585c60', '#787c7e', '#4e5254', '#8a8e90']

function createPebbleGeom(RNG) {
  const geom = new THREE.SphereGeometry(1, 5, 4)
  const pos = geom.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const len = Math.sqrt(x*x + y*y + z*z)
    const nx = x/len, ny = y/len, nz = z/len
    pos.setXYZ(i, 
      x + nx*(RNG()-0.5)*0.55, 
      y + ny*(RNG()-0.5)*0.35, 
      z + nz*(RNG()-0.5)*0.55
    )
  }
  pos.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}

export default function LakePebbles({ scrollProgress }) {
  const materials = useMemo(() => {
    return PEBBLE_COLORS.map(c => new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.97,
      metalness: 0,
      flatShading: true,
      transparent: false,
      opacity: 1
    }))
  }, [])

  const pebbles = useMemo(() => {
    const RNG = createSeededRandom(77777)
    const items = []
    const count = 80
    
    for (let i = 0; i < count; i++) {
      let anchor
      if (i < count * 0.4) {
        const southAnchors = PERIMETER_ANCHORS.filter(p => p.z < -10)
        anchor = southAnchors[Math.floor(RNG() * southAnchors.length)]
      } else {
        anchor = PERIMETER_ANCHORS[Math.floor(RNG() * PERIMETER_ANCHORS.length)]
      }
      
      const normal = anchor.clone().normalize()
      const dist = RNG() * 5.0
      const pos = anchor.clone().add(normal.multiplyScalar(dist))
      
      const geom = createPebbleGeom(RNG)
      
      const scaleX = RNG() * 0.12 + 0.06
      const scaleY = RNG() * 0.07 + 0.03
      const scaleZ = RNG() * 0.10 + 0.05
      
      const r = scaleY // radius in world space is purely scaleY
      
      let y = 0
      let rotX = 0, rotZ = 0
      
      const rType = RNG()
      if (rType < 0.3) {
        y = -r * 0.6 // 30% buried
      } else if (rType < 0.8) {
        y = -r * 0.2 // 50% sitting
        rotX = (RNG() - 0.5) * (40 * Math.PI / 180) // 0-20 deg random tilt (+/-20)
        rotZ = (RNG() - 0.5) * (40 * Math.PI / 180)
      } else {
        y = 0 // 20% proud
        rotX = (RNG() - 0.5) * (40 * Math.PI / 180)
        rotZ = (RNG() - 0.5) * (40 * Math.PI / 180)
      }
      
      const rotY = RNG() * Math.PI * 2
      const colorIdx = Math.floor(RNG() * PEBBLE_COLORS.length)
      
      items.push({ 
        geom, 
        x: pos.x, 
        y, 
        z: pos.z, 
        scaleX, 
        scaleY, 
        scaleZ, 
        rotX, 
        rotY, 
        rotZ, 
        colorIdx 
      })
    }
    
    return items
  }, [])

  return (
    <group>
      {pebbles.map((p, i) => (
        <mesh 
          key={i} 
          geometry={p.geom} 
          material={materials[p.colorIdx]} 
          position={[p.x, p.y, p.z]} 
          scale={[p.scaleX, p.scaleY, p.scaleZ]}
          rotation={[p.rotX, p.rotY, p.rotZ]} 
          castShadow
        />
      ))}
    </group>
  )
}
