import { useRef, useMemo } from 'react'
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

function createShardGeom(RNG, size) {
  const shape = new THREE.Shape()
  const halfBase = size * (0.18 + RNG() * 0.12)
  const height = size * (1.0 + RNG() * 0.5)
  const topJitterX = (RNG() - 0.5) * size * 0.12
  const midBulgeX = (RNG() - 0.5) * size * 0.08
  shape.moveTo(topJitterX, height)
  shape.lineTo(-halfBase + midBulgeX, height * 0.4)
  shape.lineTo(-halfBase * 0.7, 0)
  shape.lineTo(halfBase * 0.7, 0)
  shape.lineTo(halfBase + midBulgeX, height * 0.4)
  shape.closePath()
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02 + RNG() * 0.06,
    bevelEnabled: false
  })
  geom.computeVertexNormals()
  return geom
}

function randomSize(RNG) {
  const roll = RNG()
  if (roll < 0.45) return 0.2 + RNG() * 0.5
  if (roll < 0.75) return 0.6 + RNG() * 0.8
  if (roll < 0.92) return 1.2 + RNG() * 1.0
  return 2.2 + RNG() * 1.2
}

export default function LakeIceShards({ scrollProgress }) {
  const groupRef = useRef()

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#c8dff0',
      transmission: 0.7,
      thickness: 0.15,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    })
  }, [])

  const shards = useMemo(() => {
    const RNG = createSeededRandom(77777)
    const items = []

    for (let i = 0; i < PERIMETER_ANCHORS.length; i++) {
      const anchor = PERIMETER_ANCHORS[i]

      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist

      const clusterCount = 3 + Math.floor(RNG() * 4)

      for (let j = 0; j < clusterCount; j++) {
        const d = Math.pow(RNG(), 1.8) * 26

        const lateralSpread = 2.0 + d * 0.45
        const lateral = (RNG() - 0.5) * lateralSpread

        const px = -oz
        const pz = ox

        const x = anchor.x + ox * d + px * lateral
        const z = anchor.z + oz * d + pz * lateral
        const y = -(RNG() * 0.25)

        const uprightBias = Math.max(0, 1 - d / 18)
        const leanMin = (30 + (1 - uprightBias) * 30) * Math.PI / 180
        const leanMax = (70 + (1 - uprightBias) * 15) * Math.PI / 180
        const leanAmount = leanMin + RNG() * (leanMax - leanMin)
        const leanDir = RNG() * Math.PI * 2

        const rotX = Math.cos(leanDir) * leanAmount
        const rotZ = Math.sin(leanDir) * leanAmount
        const rotY = RNG() * Math.PI * 2

        const size = randomSize(RNG)
        items.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
      }
    }

    for (let i = 0; i < 80; i++) {
      const anchor = PERIMETER_ANCHORS[Math.floor(RNG() * PERIMETER_ANCHORS.length)]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist

      const d = 18 + RNG() * 22
      const lateral = (RNG() - 0.5) * 20

      const px = -oz
      const pz = ox

      const x = anchor.x + ox * d + px * lateral
      const z = anchor.z + oz * d + pz * lateral
      const y = -(RNG() * 0.2)

      const leanAmount = (60 + RNG() * 25) * Math.PI / 180
      const leanDir = RNG() * Math.PI * 2
      const rotX = Math.cos(leanDir) * leanAmount
      const rotZ = Math.sin(leanDir) * leanAmount
      const rotY = RNG() * Math.PI * 2

      const size = randomSize(RNG) * 0.7
      items.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
    }

    return items
  }, [])

  useFrame(() => {
    if (groupRef.current) {
      const opacity = Math.min(1, (scrollProgress?.current || 0) / 0.85)
      groupRef.current.children.forEach(child => {
        if (child.material) child.material.opacity = opacity
      })
    }
  })

  return (
    <group ref={groupRef}>
      {shards.map((s, i) => (
        <mesh
          key={i}
          geometry={s.geom}
          material={material}
          position={[s.x, s.y, s.z]}
          rotation={[s.rotX, s.rotY, s.rotZ]}
        />
      ))}
    </group>
  )
}
