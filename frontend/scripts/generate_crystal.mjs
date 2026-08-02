/**
 * Headless crystal.glb generator (Node fallback when Blender is unavailable).
 * Mirrors generate_crystal.py: two-part crystal (igloo.inc structure).
 * - CrystalShell: ico detail 1, vertex random, light displace, flat facets
 * - CrystalCore: ico detail 2, irregular scale, clouds displace, smooth/organic,
 *   positioned slightly off-axis inside the shell
 *
 * Run: node scripts/generate_crystal.mjs
 */
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.()
    })
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(__dirname, '../public/crystal.glb')

const RADIUS = 0.65
const DETAIL = 1
const SHELL_SCALE = [0.75, 1.25, 0.75] // elongated shard, baked in
const VERTEX_RANDOM = { offset: 0.45, uniform: 0.08, normal: 0.22 }
const DISPLACE_STRENGTH = 0.03

const CORE_RADIUS = 0.15
const CORE_DETAIL = 2
const CORE_SCALE = [0.6, 0.8, 0.55]
const CORE_DISPLACE_STRENGTH = 0.06
const CORE_NOISE_SCALE = 0.4
const CORE_OFFSET = [0.06, -0.04, 0.035] // slightly off-axis — never perfectly centered

let seed = 42
function random() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

function simpleNoise(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return s - Math.floor(s)
}

function hash3(x, y, z) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
  return s - Math.floor(s)
}

const smoothstep = (t) => t * t * (3 - 2 * t)

// Smooth trilinear value noise — approximates Blender CLOUDS for the core
function valueNoise(x, y, z) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const u = smoothstep(x - xi)
  const v = smoothstep(y - yi)
  const w = smoothstep(z - zi)

  const c000 = hash3(xi, yi, zi)
  const c100 = hash3(xi + 1, yi, zi)
  const c010 = hash3(xi, yi + 1, zi)
  const c110 = hash3(xi + 1, yi + 1, zi)
  const c001 = hash3(xi, yi, zi + 1)
  const c101 = hash3(xi + 1, yi, zi + 1)
  const c011 = hash3(xi, yi + 1, zi + 1)
  const c111 = hash3(xi + 1, yi + 1, zi + 1)

  const x00 = c000 + (c100 - c000) * u
  const x10 = c010 + (c110 - c010) * u
  const x01 = c001 + (c101 - c001) * u
  const x11 = c011 + (c111 - c011) * u
  const y0 = x00 + (x10 - x00) * v
  const y1 = x01 + (x11 - x01) * v
  return y0 + (y1 - y0) * w
}

function toFlatGeometry(source) {
  const index = source.index
  const posAttr = source.attributes.position
  const positions = []
  const normals = []

  const pushTriangle = (a, b, c) => {
    const ax = posAttr.getX(a)
    const ay = posAttr.getY(a)
    const az = posAttr.getZ(a)
    const bx = posAttr.getX(b)
    const by = posAttr.getY(b)
    const bz = posAttr.getZ(b)
    const cx = posAttr.getX(c)
    const cy = posAttr.getY(c)
    const cz = posAttr.getZ(c)

    const abx = bx - ax
    const aby = by - ay
    const abz = bz - az
    const acx = cx - ax
    const acy = cy - ay
    const acz = cz - az

    let nx = aby * acz - abz * acy
    let ny = abz * acx - abx * acz
    let nz = abx * acy - aby * acx
    const len = Math.hypot(nx, ny, nz) || 1
    nx /= len
    ny /= len
    nz /= len

    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz)
    normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz)
  }

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      pushTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2))
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      pushTriangle(i, i + 1, i + 2)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

// ── Outer ice shell ──────────────────────────────────────────
// Weld first: three.js icosahedra have unshared vertices, and randomizing
// per-vertex without welding tears the mesh into separate shards
const base = mergeVertices(new THREE.IcosahedronGeometry(RADIUS, DETAIL))
const pos = base.attributes.position

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i)
  const y = pos.getY(i)
  const z = pos.getZ(i)
  const len = Math.hypot(x, y, z) || 1
  const nx = x / len
  const ny = y / len
  const nz = z / len

  const rx = (random() * 2 - 1) * VERTEX_RANDOM.uniform
  const ry = (random() * 2 - 1) * VERTEX_RANDOM.uniform
  const rz = (random() * 2 - 1) * VERTEX_RANDOM.uniform
  const normalDisp = (random() * 2 - 1) * VERTEX_RANDOM.normal

  pos.setXYZ(
    i,
    x + rx * VERTEX_RANDOM.offset + nx * normalDisp,
    y + ry * VERTEX_RANDOM.offset + ny * normalDisp,
    z + rz * VERTEX_RANDOM.offset + nz * normalDisp,
  )
}

for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i)
  const y = pos.getY(i)
  const z = pos.getZ(i)
  const len = Math.hypot(x, y, z) || 1
  const nx = x / len
  const ny = y / len
  const nz = z / len
  const n = (simpleNoise(x, y, z) - 0.5) * 2 * DISPLACE_STRENGTH
  pos.setXYZ(i, x + nx * n, y + ny * n, z + nz * n)
}

// Elongated ice-shard proportions, baked in before facet normals are built
base.scale(SHELL_SCALE[0], SHELL_SCALE[1], SHELL_SCALE[2])

const geo = toFlatGeometry(base)
geo.computeBoundingSphere()

const shellMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ flatShading: true }))
shellMesh.name = 'CrystalShell'

// ── Inner core — soft organic blob ───────────────────────────
let coreGeo = new THREE.IcosahedronGeometry(CORE_RADIUS, CORE_DETAIL)
coreGeo = mergeVertices(coreGeo) // weld so displacement + normals stay smooth
coreGeo.scale(CORE_SCALE[0], CORE_SCALE[1], CORE_SCALE[2])

const corePos = coreGeo.attributes.position
// The core spans well under one noise cell at this size, so single-octave
// sampling is near-constant and acts as a uniform shrink/grow offset.
// Two octaves give real variation, and zero-mean enforcement guarantees the
// displacement only lumps the blob instead of resizing it.
const lump = new Float32Array(corePos.count)
let lumpMean = 0
for (let i = 0; i < corePos.count; i++) {
  const x = corePos.getX(i) / CORE_NOISE_SCALE
  const y = corePos.getY(i) / CORE_NOISE_SCALE
  const z = corePos.getZ(i) / CORE_NOISE_SCALE
  lump[i] =
    0.65 * valueNoise(x, y, z) +
    0.35 * valueNoise(x * 2.13 + 17.7, y * 2.13 + 9.2, z * 2.13 + 4.1)
  lumpMean += lump[i]
}
lumpMean /= corePos.count

for (let i = 0; i < corePos.count; i++) {
  const x = corePos.getX(i)
  const y = corePos.getY(i)
  const z = corePos.getZ(i)
  const len = Math.hypot(x, y, z) || 1
  const n = (lump[i] - lumpMean) * 2 * CORE_DISPLACE_STRENGTH
  corePos.setXYZ(i, x + (x / len) * n, y + (y / len) * n, z + (z / len) * n)
}
// Smooth vertex normals — organic and rounded, NOT faceted like the shell
coreGeo.computeVertexNormals()
coreGeo.computeBoundingSphere()

const coreMesh = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial())
coreMesh.name = 'CrystalCore'
coreMesh.position.set(CORE_OFFSET[0], CORE_OFFSET[1], CORE_OFFSET[2])

// ── Export both meshes as a single GLB ───────────────────────
const scene = new THREE.Scene()
scene.add(shellMesh)
scene.add(coreMesh)

const exporter = new GLTFExporter()
const glb = await exporter.parseAsync(scene, { binary: true })
writeFileSync(OUTPUT, Buffer.from(glb))
console.log(`Exported crystal to ${OUTPUT}`)
