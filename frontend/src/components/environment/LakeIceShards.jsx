import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

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
  // Irregular convex polygon — like a broken ice plate
  // Wide and flat, not tall
  const vertCount = Math.floor(RNG() * 4) + 5  // 5–8 verts
  const shape = new THREE.Shape()
  const verts = []
  for (let i = 0; i < vertCount; i++) {
    const angle = (i / vertCount) * Math.PI * 2 + (RNG() - 0.5) * 0.6
    // Aspect ratio: width ~= depth (roughly square plates, not elongated)
    const rx = size * (0.5 + RNG() * 0.4)
    const ry = size * (0.5 + RNG() * 0.4)
    verts.push([Math.cos(angle) * rx, Math.sin(angle) * ry])
  }
  shape.moveTo(verts[0][0], verts[0][1])
  for (let i = 1; i < verts.length; i++) shape.lineTo(verts[i][0], verts[i][1])
  shape.closePath()

  // Thickness: 0.08–0.25 — these are chunky ice slabs not paper
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08 + RNG() * 0.17,
    bevelEnabled: false
  })
  geom.computeVertexNormals()
  return geom
}

function randomSize(RNG) {
  const roll = RNG()
  if (roll < 0.35) return 0.3 + RNG() * 0.4    // 35% small chips: 0.3–0.7
  if (roll < 0.65) return 0.6 + RNG() * 0.7    // 30% medium: 0.6–1.3
  if (roll < 0.85) return 1.1 + RNG() * 0.9    // 20% large: 1.1–2.0
  return 1.8 + RNG() * 1.2                      // 15% very large: 1.8–3.0
}

export default function LakeIceShards({ scrollProgress }) {
  const materialRef = useRef()

  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#c8e0f0',
      transmission: 0.35,
      thickness: 0.3,
      roughness: 0.15,
      metalness: 0,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide
    })
  }, [])

  // Build all shard geometries with identical RNG order, then merge into one BufferGeometry
  const mergedGeometry = useMemo(() => {
    const RNG = createSeededRandom(77777)
    const shards = []

    // LAYER 1 — GROUND COVER: completely flat slabs lying on tundra
    // These make the ground invisible. Max tilt 8°. Spread 0–35 units from shore.
    // Falloff: Math.pow(RNG(), 1.4) * 35 — dense near shore, thins naturally far out.
    for (let i = 0; i < PERIMETER_ANCHORS.length; i++) {
      const anchor = PERIMETER_ANCHORS[i]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist
      const px = -oz
      const pz = ox

      const count = 6 + Math.floor(RNG() * 4)  // 6–9 per anchor

      for (let j = 0; j < count; j++) {
        const d = Math.pow(RNG(), 1.4) * 35     // 0–35 units, biased toward shore
        const lateral = (RNG() - 0.5) * (3 + d * 0.5)

        const x = anchor.x + ox * d + px * lateral
        const z = anchor.z + oz * d + pz * lateral
        const y = -(0.02 + RNG() * 0.05)        // just at/below ground surface

        // Almost completely flat — these are the ground cover
        const tiltAmount = RNG() * 8 * Math.PI / 180
        const tiltDir = RNG() * Math.PI * 2
        const rotX = -Math.PI / 2 + Math.cos(tiltDir) * tiltAmount
        const rotZ = Math.sin(tiltDir) * tiltAmount
        const rotY = RNG() * Math.PI * 2

        const size = randomSize(RNG) * 1.2      // slightly larger to maximize coverage
        shards.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
      }
    }

    // LAYER 2 — TILTED PILE: slabs at 15–45° sitting on top of ground cover
    // These create the "pile" depth effect. Spread 0–18 units. Much steeper falloff.
    for (let i = 0; i < PERIMETER_ANCHORS.length; i++) {
      const anchor = PERIMETER_ANCHORS[i]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist
      const px = -oz
      const pz = ox

      const count = 8 + Math.floor(RNG() * 5)

      for (let j = 0; j < count; j++) {
        const d = Math.pow(RNG(), 1.6) * 18     // steep falloff, most within 6 units
        const lateral = (RNG() - 0.5) * (2 + d * 0.35)

        const x = anchor.x + ox * d + px * lateral
        const z = anchor.z + oz * d + pz * lateral
        const y = 0.05 + RNG() * 0.35           // sits on top of layer 1

        const tiltAmount = (15 + RNG() * 30) * Math.PI / 180   // 15–45°
        const tiltDir = RNG() * Math.PI * 2
        const rotX = -Math.PI / 2 + Math.cos(tiltDir) * tiltAmount
        const rotZ = Math.sin(tiltDir) * tiltAmount
        const rotY = RNG() * Math.PI * 2

        const size = randomSize(RNG)
        shards.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
      }
    }

    // LAYER 3 — UPRIGHT EDGE: near-vertical pieces only within 5 units of shore
    // These are the dramatic spikes at the breach point. Very steep falloff.
    for (let i = 0; i < PERIMETER_ANCHORS.length; i++) {  // every anchor
      const anchor = PERIMETER_ANCHORS[i]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist
      const px = -oz
      const pz = ox

      const count = 4 + Math.floor(RNG() * 5)

      for (let j = 0; j < count; j++) {
        const d = Math.pow(RNG(), 2.5) * 8      // up to 8 units from shore
        const lateral = (RNG() - 0.5) * 2.5

        const x = anchor.x + ox * d + px * lateral
        const z = anchor.z + oz * d + pz * lateral
        const y = 0.1 + RNG() * 0.4

        // Near-vertical: only 20–50° tilt from upright
        const tiltAmount = (20 + RNG() * 30) * Math.PI / 180
        const tiltDir = RNG() * Math.PI * 2
        // Upright = rotX near 0 (not -PI/2)
        const rotX = Math.cos(tiltDir) * tiltAmount
        const rotZ = Math.sin(tiltDir) * tiltAmount
        const rotY = RNG() * Math.PI * 2

        const size = 0.4 + RNG() * 1.0         // medium-small, these are spikes
        shards.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
      }
    }

    // LAYER 4 — FAR SCATTER: thin outliers 20–50 units out on tundra
    // Almost flat, very sparse. The "furthest ejecta" that traveled far.
    // No hard boundary — some pieces land surprisingly far.
    for (let i = 0; i < PERIMETER_ANCHORS.length; i++) {  // every anchor
      const anchor = PERIMETER_ANCHORS[i]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist
      const px = -oz
      const pz = ox

      if (RNG() > 0.55) continue               // 45% skip — sparse

      const d = 10 + RNG() * 45               // 10–55 units out
      const lateral = (RNG() - 0.5) * 15

      const x = anchor.x + ox * d + px * lateral
      const z = anchor.z + oz * d + pz * lateral
      const y = 0

      // Almost completely flat — these slid/slipped far
      const tiltAmount = RNG() * 10 * Math.PI / 180
      const tiltDir = RNG() * Math.PI * 2
      const rotX = -Math.PI / 2 + Math.cos(tiltDir) * tiltAmount
      const rotZ = Math.sin(tiltDir) * tiltAmount
      const rotY = RNG() * Math.PI * 2

      const size = randomSize(RNG) * 1.1
      shards.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
    }

    // LAYER 5 — RADIAL MID-FIELD: debris along shockwave paths, 8–25 units out
    for (let i = 0; i < PERIMETER_ANCHORS.length; i += 3) {
      const anchor = PERIMETER_ANCHORS[i]
      const dist = Math.sqrt(anchor.x * anchor.x + anchor.z * anchor.z)
      const ox = anchor.x / dist
      const oz = anchor.z / dist
      const px = -oz
      const pz = ox

      const count = 3 + Math.floor(RNG() * 3)
      for (let j = 0; j < count; j++) {
        const d = 8 + Math.pow(RNG(), 1.2) * 17      // 8–25 units, fills the gap
        const lateral = (RNG() - 0.5) * (1.5 + d * 0.2)  // narrow — follows crack lines

        const x = anchor.x + ox * d + px * lateral
        const z = anchor.z + oz * d + pz * lateral
        const y = RNG() * 0.15                        // mostly flat, slight tilt

        const tiltAmount = RNG() * 18 * Math.PI / 180
        const tiltDir = RNG() * Math.PI * 2
        const rotX = -Math.PI / 2 + Math.cos(tiltDir) * tiltAmount
        const rotZ = Math.sin(tiltDir) * tiltAmount
        const rotY = RNG() * Math.PI * 2
        const size = randomSize(RNG) * (0.4 + RNG() * 0.9)

        shards.push({ geom: createShardGeom(RNG, size), x, y, z, rotX, rotY, rotZ })
      }
    }

    // Apply transforms to each geometry and merge into a single BufferGeometry
    const euler = new THREE.Euler()
    const quat = new THREE.Quaternion()
    const mat4 = new THREE.Matrix4()
    const pos = new THREE.Vector3()
    const scale = new THREE.Vector3(1, 1, 1)

    const transformedGeoms = shards.map(s => {
      const g = s.geom.clone()
      euler.set(s.rotX, s.rotY, s.rotZ)
      quat.setFromEuler(euler)
      pos.set(s.x, s.y, s.z)
      mat4.compose(pos, quat, scale)
      g.applyMatrix4(mat4)
      return g
    })

    const merged = mergeGeometries(transformedGeoms, false)
    merged.computeVertexNormals()

    // Dispose individual geometries — they're baked into merged now
    shards.forEach(s => s.geom.dispose())
    transformedGeoms.forEach(g => g.dispose())

    return merged
  }, [])

  // O(1) per frame — update material opacity directly via ref
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.opacity = Math.min(1, (scrollProgress?.current || 0) / 0.85)
    }
  })

  return (
    <mesh geometry={mergedGeometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </mesh>
  )
}
