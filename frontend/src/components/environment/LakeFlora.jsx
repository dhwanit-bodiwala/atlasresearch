import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'

// Simple seeded RNG for stable positions
function createSeededRandom(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return function() {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Perimeter definition
const PERIMETER_ANCHORS = (() => {
  const outer = new THREE.Shape()
  outer.moveTo(0, -36)
  outer.bezierCurveTo(20, -42, 46, -26, 47, -7)
  outer.bezierCurveTo(49, 10, 55, 30, 33, 40)
  outer.bezierCurveTo(14, 49, -13, 52, -34, 38)
  outer.bezierCurveTo(-51, 26, -46, 1, -49, -17)
  outer.bezierCurveTo(-52, -33, -30, -38, -14, -40)
  outer.bezierCurveTo(-6, -42, -10, -32, 0, -36)
  
  // Sample 120 anchor points along the lake perimeter
  const pts = outer.getSpacedPoints(120) 
  // Convert 2D Shape to 3D World (x, 0, -y) due to -PI/2 X rotation in LakeBody
  return pts.map(p => new THREE.Vector3(p.x, 0, -p.y))
})()

export default function LakeFlora({ scrollProgress, windStrengthRef }) {
  const grassRef = useRef()
  const allMaterialRefs = useRef([])

  const addMaterialRef = (mesh) => {
    if (mesh && !allMaterialRefs.current.includes(mesh)) {
      allMaterialRefs.current.push(mesh)
    }
  }

  // === FLORA PLACEMENTS ===
  const cattails = useMemo(() => {
    const RNG = createSeededRandom(12345)
    const items = []
    
    // Skip north gap
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    let placed = 0
    while (placed < 100) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const isSouth = anchor.z < -15
      
      // South zone gets the most
      if (!isSouth && RNG() > 0.33) continue 
      
      // Never more than 2.5 units from anchor -> span is 5.0
      const offsetX = (RNG() - 0.5) * 5.0
      const offsetZ = (RNG() - 0.5) * 5.0
      
      const x = anchor.x + offsetX
      const z = anchor.z + offsetZ
      
      const lean = (RNG() - 0.5) * 2.0
      
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(lean * 0.08, 1.3, 0),
        new THREE.Vector3(lean * 0.12, 2.5, 0)
      ])
      
      const headPos = [lean * 0.12, 2.5, 0]
      const rotY = RNG() * Math.PI * 2
      const scale = 0.8 + RNG() * 0.35
      
      items.push({ x, z, rotY, scale, curve, headPos })
      placed++
    }
    return items
  }, [])

  const flowers = useMemo(() => {
    const RNG = createSeededRandom(54321)
    const items = []
    
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    let placed = 0
    while (placed < 60) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      
      // Distribute radially like before but relative to anchors
      const normal = anchor.clone().normalize()
      const dist = RNG() * 3.5
      const pos = anchor.clone().add(normal.multiplyScalar(dist))
      
      const rotY = RNG() * Math.PI * 2
      const height = 0.3 + RNG() * 0.2
      const scale = 0.7 + RNG() * 0.4
      
      items.push({ x: pos.x, z: pos.z, rotY, height, scale })
      placed++
    }
    return items
  }, [])

  const tallReeds = useMemo(() => {
    const RNG = createSeededRandom(11111)
    const items = []
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    let placed = 0
    while (placed < 180) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const offsetX = (RNG() - 0.5) * 7.0
      const offsetZ = (RNG() - 0.5) * 7.0
      const x = anchor.x + offsetX
      const z = anchor.z + offsetZ
      
      const height = 3.0 + RNG() * 1.5
      const leanX = (RNG() - 0.5) * 0.4
      const leanZ = (RNG() - 0.5) * 0.4
      const sCurveX = (RNG() - 0.5) * 0.2
      const sCurveZ = (RNG() - 0.5) * 0.2
      
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(leanX * 0.3 + sCurveX, height * 0.3, leanZ * 0.3 + sCurveZ),
        new THREE.Vector3(leanX * 0.7 - sCurveX, height * 0.6, leanZ * 0.7 - sCurveZ),
        new THREE.Vector3(leanX, height, leanZ)
      ])
      
      const rotY = RNG() * Math.PI * 2
      
      const paniclePts = []
      const panicleCount = 8 + Math.floor(RNG() * 5)
      for (let i = 0; i < panicleCount; i++) {
        const pLen = 0.3 + RNG() * 0.2
        const pAngleY = RNG() * Math.PI * 2
        const pAngleDrop = (RNG() * 0.5 + 0.5) * Math.PI // Pointing downwards
        
        const px = Math.cos(pAngleY) * Math.sin(pAngleDrop) * pLen
        const py = Math.cos(pAngleDrop) * pLen
        const pz = Math.sin(pAngleY) * Math.sin(pAngleDrop) * pLen
        
        // Push vertices translated to stem tip so wind sway calculates accurately based on world Y
        paniclePts.push(leanX, height, leanZ)
        paniclePts.push(leanX + px, height + py, leanZ + pz)
      }
      
      items.push({ x, z, rotY, curve, paniclePts: new Float32Array(paniclePts) })
      placed++
    }
    return items
  }, [])

  const sedgeTufts = useMemo(() => {
    const RNG = createSeededRandom(22222)
    const items = []
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    let placed = 0
    while (placed < 120) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const isSouthWest = anchor.z < -10 || anchor.x < -20
      if (!isSouthWest && RNG() > 0.4) continue
      
      const offsetX = (RNG() - 0.5) * 7.0
      const offsetZ = (RNG() - 0.5) * 7.0
      const x = anchor.x + offsetX
      const z = anchor.z + offsetZ
      
      const rotY = RNG() * Math.PI * 2
      
      const tuftGeoms = []
      const bladeCount = 12 + Math.floor(RNG() * 5)
      for (let i = 0; i < bladeCount; i++) {
        const bladeLen = 0.8 + RNG() * 0.5
        const bAngleY = RNG() * Math.PI * 2
        const leanOut = 0.3 + RNG() * 0.6 
        
        const midX = Math.cos(bAngleY) * leanOut * 0.4
        const midZ = Math.sin(bAngleY) * leanOut * 0.4
        const tipX = Math.cos(bAngleY) * leanOut * 1.0
        const tipZ = Math.sin(bAngleY) * leanOut * 1.0
        
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(midX, bladeLen * 0.6, midZ),
          new THREE.Vector3(tipX, bladeLen * 0.3, tipZ)
        ])
        
        const tube = new THREE.TubeGeometry(curve, 6, 0.012, 3, false)
        tuftGeoms.push(tube)
      }
      
      const mergedGeom = BufferGeometryUtils.mergeGeometries(tuftGeoms)
      items.push({ x, z, rotY, geom: mergedGeom })
      placed++
    }
    return items
  }, [])

  const rushBundles = useMemo(() => {
    const RNG = createSeededRandom(33333)
    const items = []
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    const baseCyl = new THREE.CylinderGeometry(0.008, 0.01, 1.0, 3)
    baseCyl.translate(0, 0.5, 0)
    
    let placed = 0
    while (placed < 150) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const offsetX = (RNG() - 0.5) * 7.0
      const offsetZ = (RNG() - 0.5) * 7.0
      const x = anchor.x + offsetX
      const z = anchor.z + offsetZ
      
      const rotY = RNG() * Math.PI * 2
      
      const stemGeoms = []
      const stemCount = 6 + Math.floor(RNG() * 5)
      for (let i = 0; i < stemCount; i++) {
        const height = 0.6 + RNG() * 0.8
        const leanAngle = RNG() * (15 * Math.PI / 180)
        const leanDir = RNG() * Math.PI * 2
        
        const m = new THREE.Matrix4()
        const euler = new THREE.Euler(Math.cos(leanDir) * leanAngle, 0, Math.sin(leanDir) * leanAngle)
        m.makeRotationFromEuler(euler)
        m.scale(new THREE.Vector3(1, height, 1))
        
        const clone = baseCyl.clone()
        clone.applyMatrix4(m)
        stemGeoms.push(clone)
      }
      
      const mergedGeom = BufferGeometryUtils.mergeGeometries(stemGeoms)
      items.push({ x, z, rotY, geom: mergedGeom })
      placed++
    }
    return items
  }, [])


  // === GRASS INSTANCES SETUP ===
  useEffect(() => {
    if (!grassRef.current) return
    const mesh = grassRef.current
    const RNG = createSeededRandom(98765)
    
    const countTotal = 10000
    const dummy = new THREE.Object3D()
    const validAnchors = PERIMETER_ANCHORS.filter(p => p.z <= 40)
    
    let instanceIdx = 0
    while (instanceIdx < countTotal) {
      const anchor = validAnchors[Math.floor(RNG() * validAnchors.length)]
      const isSouth = anchor.z < -15
      
      // South perimeter anchors: triple anchor density
      if (!isSouth && RNG() > 0.33) continue
      
      // radius 3.5 around anchor -> span is 7.0
      const offsetX = (RNG() - 0.5) * 7.0
      const offsetZ = (RNG() - 0.5) * 7.0
      
      dummy.position.set(anchor.x + offsetX, 0, anchor.z + offsetZ)
      dummy.rotation.y = RNG() * Math.PI * 2
      
      // Scale X: 0.7–1.2, Scale Y: 1.4–2.0 (ragged real reeds)
      const scaleX = 0.7 + RNG() * 0.5
      const scaleY = 1.4 + RNG() * 0.6
      dummy.scale.set(scaleX, scaleY, scaleX)
      dummy.updateMatrix()
      mesh.setMatrixAt(instanceIdx, dummy.matrix)
      
      instanceIdx++
    }
    
    mesh.instanceMatrix.needsUpdate = true
  }, [])


  // === SHADERS & UNIFORMS ===
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWindStrength: { value: 0.06 },
  }), [])

  const onBeforeCompileCattail = useMemo(() => (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uWindStrength = uniforms.uWindStrength
    shader.uniforms.uWindFrequency = { value: 0.8 }

    shader.vertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindFrequency;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float swayFactor = max(0.0, position.y - 0.3);
      float sway = sin(uTime * uWindFrequency + (modelMatrix * vec4(position, 1.0)).x * 2.1) * uWindStrength * swayFactor;
      transformed.x += sway;
      transformed.z += sway * 0.3;
      `
    )
  }, [uniforms])

  const onBeforeCompileFlower = useMemo(() => (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uWindStrength = uniforms.uWindStrength
    shader.uniforms.uWindFrequency = { value: 1.2 }

    shader.vertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindFrequency;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float swayFactor = modelMatrix[3][1];
      float sway = sin(uTime * uWindFrequency + (modelMatrix * vec4(position, 1.0)).x * 2.1) * uWindStrength * swayFactor;
      transformed.x += sway;
      transformed.z += sway * 0.3;
      `
    )
  }, [uniforms])

  const onBeforeCompileGrass = useMemo(() => (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uWindStrength = uniforms.uWindStrength
    shader.uniforms.uWindFrequency = { value: 0.9 }

    shader.vertexShader = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindFrequency;
    ` + shader.vertexShader

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float swayFactor = max(0.0, position.y - 0.4);
      float worldX = (instanceMatrix * vec4(position, 1.0)).x;
      float sway = sin(uTime * uWindFrequency + worldX * 2.1) * uWindStrength * swayFactor;
      transformed.x += sway;
      transformed.z += sway * 0.3;
      `
    )
  }, [uniforms])

  // === GEOMETRIES ===
  const headTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(16, 32, 0, 16, 32, 32)
    gradient.addColorStop(0, '#3a2010')
    gradient.addColorStop(1, '#1a0c04')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(16, 32, 12, 30, 0, 0, Math.PI * 2)
    ctx.fill()
    
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])

  const headGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.16, 0.42)
    g.translate(0, 2.5, 0)
    return g
  }, [])

  const { flowerPetalsGeom, flowerCenterGeom } = useMemo(() => {
    const petals = []
    for (let i = 0; i < 6; i++) {
      const g = new THREE.PlaneGeometry(0.12, 0.18)
      const angle = (i / 6) * Math.PI * 2
      
      const m = new THREE.Matrix4()
      m.makeRotationY(angle)
      
      const tilt = new THREE.Matrix4()
      tilt.makeRotationX(-35 * Math.PI / 180)
      
      const trans = new THREE.Matrix4()
      trans.makeTranslation(0, 0.09, 0)
      
      // Pivot at base, tilt, then rotate around center
      const finalMat = m.multiply(tilt).multiply(trans)
      g.applyMatrix4(finalMat)
      petals.push(g)
    }
    const center = new THREE.SphereGeometry(0.04, 8, 8)
    center.translate(0, 0.02, 0) // bump up slightly
    
    return {
      flowerPetalsGeom: BufferGeometryUtils.mergeGeometries(petals),
      flowerCenterGeom: center
    }
  }, [])

  const grassGeom = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const rows = 5
    const height = 1.0
    const verts = []
    const indices = []
    const leanDir = 1

    for (let r = 0; r < rows; r++) {
      const t = r / rows
      const y = t * height
      const halfW = (1 - t) * 0.05
      const curve = Math.sin((r / 4) * Math.PI) * 0.12 * leanDir
      
      verts.push(-halfW + curve, y, 0)
      verts.push(halfW + curve, y, 0)
      
      if (r < rows - 1) {
        const rowStart = r * 2
        indices.push(rowStart, rowStart + 1, rowStart + 2)
        indices.push(rowStart + 2, rowStart + 1, rowStart + 3)
      }
    }
    
    const tipIndex = rows * 2
    verts.push(0, height, 0) // tip at exact center top
    
    const lastRowStart = (rows - 1) * 2
    indices.push(lastRowStart, lastRowStart + 1, tipIndex)
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
  }, [])

  // === MATERIALS ===
  const stemMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ 
      color: '#3d4a20', 
      roughness: 1.0, 
      metalness: 0, 
      depthWrite: false,
      transparent: true, 
      opacity: 0 
    })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail])

  const headMat = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({ 
      color: '#2a1608', 
      map: headTex,
      side: THREE.DoubleSide,
      transparent: true, 
      alphaTest: 0.4,
      opacity: 0,
      depthWrite: false
    })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail, headTex])

  const flowerPetalMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#d4c078', transparent: true, opacity: 0, side: THREE.DoubleSide })
    mat.onBeforeCompile = onBeforeCompileFlower
    return mat
  }, [onBeforeCompileFlower])
  
  const flowerCenterMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#c8a030', transparent: true, opacity: 0 })
    mat.onBeforeCompile = onBeforeCompileFlower
    return mat
  }, [onBeforeCompileFlower])

  const grassMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ 
      color: '#4a5e30', 
      roughness: 1.0, 
      metalness: 0, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0, 
      depthWrite: false 
    })
    mat.onBeforeCompile = onBeforeCompileGrass
    return mat
  }, [onBeforeCompileGrass])
  
  // New Flora Materials
  const reedMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#3d4a1a', roughness: 1.0, metalness: 0, transparent: true, opacity: 0 })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail])

  const reedPanicleMat = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#6b5a3a', transparent: true, opacity: 0 })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail])

  const sedgeMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#4a5828', roughness: 1.0, metalness: 0, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail])

  const rushMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({ color: '#2d3a1a', roughness: 1.0, metalness: 0, transparent: true, opacity: 0 })
    mat.onBeforeCompile = onBeforeCompileCattail
    return mat
  }, [onBeforeCompileCattail])

  // === ANIMATION LOOP ===
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
    if (windStrengthRef?.current !== undefined) {
      uniforms.uWindStrength.value = windStrengthRef.current.value
    }
    
    const t = scrollProgress?.current ?? 0
    const opacity = Math.min(1, t / 0.85)

    allMaterialRefs.current.forEach(mesh => {
      if (mesh.material) {
        mesh.material.opacity = opacity
      }
    })
  })

  return (
    <group>
      {/* Grass Tufts (InstancedMesh) */}
      <instancedMesh 
        ref={(el) => { grassRef.current = el; addMaterialRef(el); }} 
        args={[grassGeom, grassMat, 10000]}
        frustumCulled={false}
      >
      </instancedMesh>

      {/* Cattails (Unique Curves) */}
      {cattails.map((c, i) => (
        <group key={`cattail-${i}`} position={[c.x, 0, c.z]} rotation={[0, c.rotY, 0]} scale={c.scale}>
          <mesh material={stemMat} ref={addMaterialRef}>
            <tubeGeometry args={[c.curve, 8, 0.022, 4, false]} />
          </mesh>
          <group position={[c.headPos[0], 0, c.headPos[2]]}>
            <mesh geometry={headGeom} material={headMat} ref={addMaterialRef} />
            <mesh geometry={headGeom} material={headMat} rotation={[0, Math.PI / 2, 0]} ref={addMaterialRef} />
          </group>
        </group>
      ))}
      
      {/* Arctic Flowers */}
      {flowers.map((f, i) => (
        <group key={`flower-${i}`} position={[f.x, f.height, f.z]} rotation={[0, f.rotY, 0]} scale={f.scale}>
          <mesh geometry={flowerPetalsGeom} material={flowerPetalMat} ref={addMaterialRef} />
          <mesh geometry={flowerCenterGeom} material={flowerCenterMat} ref={addMaterialRef} />
        </group>
      ))}

      {/* Tall Reeds (Phragmites) */}
      {tallReeds.map((r, i) => (
        <group key={`reed-${i}`} position={[r.x, 0, r.z]} rotation={[0, r.rotY, 0]}>
          <mesh material={reedMat} ref={addMaterialRef}>
            <tubeGeometry args={[r.curve, 8, 0.018, 4, false]} />
          </mesh>
          <lineSegments ref={addMaterialRef}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={r.paniclePts.length / 3} array={r.paniclePts} itemSize={3} />
            </bufferGeometry>
            <primitive object={reedPanicleMat} attach="material" />
          </lineSegments>
        </group>
      ))}

      {/* Sedge Tufts (Carex) */}
      {sedgeTufts.map((s, i) => (
        <group key={`sedge-${i}`} position={[s.x, 0, s.z]} rotation={[0, s.rotY, 0]}>
          <mesh geometry={s.geom} material={sedgeMat} ref={addMaterialRef} />
        </group>
      ))}

      {/* Soft Rush Bundles (Juncus) */}
      {rushBundles.map((b, i) => (
        <group key={`rush-${i}`} position={[b.x, 0, b.z]} rotation={[0, b.rotY, 0]}>
          <mesh geometry={b.geom} material={rushMat} ref={addMaterialRef} />
        </group>
      ))}
    </group>
  )
}
