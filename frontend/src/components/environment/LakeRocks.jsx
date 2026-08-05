import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
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

const ROCK_COLORS = ['#6e7476', '#7a7e82', '#5e6264', '#888c8e', '#4e5254']

function createRockGeom(radius, RNG, mult = 0.7) {
  const geom = new THREE.SphereGeometry(radius, 7, 6)
  const pos = geom.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const len = Math.sqrt(x*x + y*y + z*z)
    const nx = x/len, ny = y/len, nz = z/len
    const disp = (RNG() - 0.5) * radius * mult
    pos.setXYZ(i, x + nx*disp, y + ny*disp*0.5, z + nz*disp)
  }
  pos.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}

export default function LakeRocks({ scrollProgress }) {
  const materials = useMemo(() => {
    return ROCK_COLORS.map(c => new THREE.MeshStandardMaterial({
      color: c,
      roughness: 0.96,
      metalness: 0.02,
      flatShading: true,
      transparent: false,
      opacity: 1
    }))
  }, [])

  const rocks = useMemo(() => {
    const RNG = createSeededRandom(55555)
    const items = []
    
    const southWestAnchors = PERIMETER_ANCHORS.filter(p => p.z < -10 || p.x < -20)
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    const boulders = []
    
    const largeBoulders = []
    
    // Large boulders (3 total)
    for (let i = 0; i < 3; i++) {
      const radius = 2.8 + RNG() * 1.2 // 2.8 - 4.0
      const geom = createRockGeom(radius, RNG, 0.7)
      
      let anchor
      if (i === 0) {
        const south = validAnchors.filter(p => p.z < -20)
        anchor = south[Math.floor(RNG() * south.length)] || validAnchors[0]
      } else if (i === 1) {
        const west = validAnchors.filter(p => p.x < -30)
        anchor = west[Math.floor(RNG() * west.length)] || validAnchors[0]
      } else {
        const east = validAnchors.filter(p => p.x > 25)
        anchor = east[Math.floor(RNG() * east.length)] || validAnchors[0]
      }
      
      const pos = anchor.clone()
      if (i === 2) pos.multiplyScalar(0.85) // Pull east boulder slightly into water
      else pos.add(new THREE.Vector3((RNG() - 0.5) * 4.0, 0, (RNG() - 0.5) * 4.0))
      
      const x = pos.x
      const y = radius * 0.35 // sits heavy and low
      const z = pos.z
      
      const rotX = (RNG() - 0.5) * Math.PI
      const rotY = RNG() * Math.PI * 2
      const rotZ = (RNG() - 0.5) * Math.PI
      
      const colorIdx = Math.floor(RNG() * ROCK_COLORS.length)
      largeBoulders.push({ geom, x, y, z, rotX, rotY, rotZ, colorIdx })
      items.push(largeBoulders[i])
    }
    
    // Boulders (6 total)
    for (let i = 0; i < 6; i++) {
      const radius = 1.2 + RNG() * 0.8 // 1.2 - 2.0
      const geom = createRockGeom(radius, RNG, 0.6)
      
      let anchor
      if (i < 3) {
        // Spread 3 boulders to the east side
        const eastAnchors = validAnchors.filter(p => p.x > 15)
        anchor = eastAnchors[Math.floor(RNG() * eastAnchors.length)]
      } else {
        anchor = southWestAnchors[Math.floor(RNG() * southWestAnchors.length)]
      }
      
      const offsetX = (RNG() - 0.5) * 4.0
      const offsetZ = (RNG() - 0.5) * 4.0
      
      const x = anchor.x + offsetX
      const y = radius * 0.4 // Protrude out of the ground correctly
      const z = anchor.z + offsetZ
      
      const tiltAngle = (18 * Math.PI) / 180
      const rotX = (RNG() - 0.5) * 2 * tiltAngle
      const rotY = RNG() * Math.PI * 2
      const rotZ = (RNG() - 0.5) * 2 * tiltAngle
      
      const colorIdx = Math.floor(RNG() * ROCK_COLORS.length)
      boulders.push({ geom, x, y, z, rotX, rotY, rotZ, colorIdx })
      items.push(boulders[i])
    }
    
    // Medium rocks (14 total)
    const allBoulders = [...largeBoulders, ...boulders]
    for (let i = 0; i < 14; i++) {
      const radius = 0.4 + RNG() * 0.5 // 0.4 - 0.9
      const geom = createRockGeom(radius, RNG, 0.6)
      
      let bx, bz
      if (RNG() > 0.3) { // 70% cluster near boulders
        const parent = allBoulders[Math.floor(RNG() * allBoulders.length)]
        bx = parent.x
        bz = parent.z
      } else {
        const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
        bx = anchor.x
        bz = anchor.z
      }
      
      const x = bx + (RNG() - 0.5) * 6.0
      const z = bz + (RNG() - 0.5) * 6.0
      const y = radius * 0.4
      
      const rotX = (RNG() - 0.5) * 0.5
      const rotY = RNG() * Math.PI * 2
      const rotZ = (RNG() - 0.5) * 0.5
      
      const colorIdx = Math.floor(RNG() * ROCK_COLORS.length)
      items.push({ geom, x, y, z, rotX, rotY, rotZ, colorIdx })
    }
    
    // Small rocks (28 total)
    for (let i = 0; i < 28; i++) {
      const radius = 0.12 + RNG() * 0.23 // 0.12 - 0.35
      const geom = createRockGeom(radius, RNG, 0.3) // light displacement
      
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const x = anchor.x + (RNG() - 0.5) * 4.0
      const z = anchor.z + (RNG() - 0.5) * 4.0
      
      const y = radius * 0.4
      
      const rotX = (RNG() - 0.5) * Math.PI
      const rotY = RNG() * Math.PI * 2
      const rotZ = (RNG() - 0.5) * Math.PI
      
      const colorIdx = Math.floor(RNG() * ROCK_COLORS.length)
      items.push({ geom, x, y, z, rotX, rotY, rotZ, colorIdx })
    }
    
    return items
  }, [])

  return (
    <group>
      {rocks.map((rock, i) => (
        <mesh 
          key={i} 
          geometry={rock.geom} 
          material={materials[rock.colorIdx]} 
          position={[rock.x, rock.y, rock.z]} 
          rotation={[rock.rotX, rock.rotY, rock.rotZ]} 
          castShadow
        />
      ))}
    </group>
  )
}
