import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import useAtlasStore from '../../store/atlasStore'

export default function CrystalMesh({ crystalState = 'SEED', position = [0, 0, 0], scale = 2.5, crystalYRef = null, falling = false }) {
  const groupRef = useRef()
  const { scene } = useGLTF('/crystal.glb')
  const question = useAtlasStore((s) => s.question)

  const normalMap = useTexture('/textures/Snow013_2K-JPG_NormalGL.jpg')
  const roughnessMap = useTexture('/textures/Snow013_2K-JPG_Roughness.jpg')

  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(1.5, 1.5)
  roughnessMap.repeat.set(1.5, 1.5)

  const meshes = useMemo(() => {
    const clone = scene.clone(true)
    const found = { shell: [], core: [] }
    clone.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach((m) => m.dispose?.())
        }
        child.updateWorldMatrix(true, false)
        const entry = {
          geometry: child.geometry,
          matrix: child.matrixWorld.clone(),
        }
        if (child.name === 'CrystalCore') {
          found.core.push(entry)
        } else {
          found.shell.push(entry)
        }
      }
    })
    return found
  }, [scene])

  const runicTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 512, 512)

    const runeChars = [
      'ᚷ','ᚨ','ᚦ','ᛖ','ᚱ','ᛊ','ᛏ','ᚺ','ᛁ','ᚾ','ᚲ','ᛃ','ᚠ','ᛚ','ᚢ','ᛞ',
      'ᚾ','ᛟ','ᛗ','ᚡ','ᛒ','ᛈ','ᛉ','ᛜ','ᛝ','ᛞ','ᛟ','ᚩ','ᚪ','ᚫ','ᚬ','ᚭ',
    ]

    const FONT_SIZE = 7
    const LINE_HEIGHT = 10
    const CHAR_WIDTH = 8
    ctx.font = `${FONT_SIZE}px serif`

    for (let row = 0; row < Math.ceil(512 / LINE_HEIGHT); row++) {
      for (let col = 0; col < Math.ceil(512 / CHAR_WIDTH); col++) {
        // Skip ~55% of cells to leave breathing room (density ~45%)
        if (Math.random() < 0.55) continue
        
        const char = runeChars[Math.floor(Math.random() * runeChars.length)]
        const x = col * CHAR_WIDTH + (Math.random() - 0.5) * 2
        const y = row * LINE_HEIGHT + (Math.random() - 0.5) * 2 + FONT_SIZE
        
        // Vary opacity per character for carved depth variation
        const opacity = 0.92 + Math.random() * 0.08  // 0.92–1.0
        ctx.fillStyle = `rgba(15, 25, 50, ${opacity})`
        ctx.fillText(char, x, y)
      }
    }

    // Add occasional slightly larger accent runes for depth
    ctx.font = `10px serif`
    for (let i = 0; i < 40; i++) {
      const char = runeChars[Math.floor(Math.random() * runeChars.length)]
      ctx.fillStyle = `rgba(10, 18, 40, 0.98)`
      ctx.fillText(char, Math.random() * 500 + 6, Math.random() * 500 + 6)
    }

    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return

    if (falling) {
      const t = state.clock.elapsedTime

      // Fast primary spin
      groupRef.current.rotation.y += 0.018

      // Irregular tilt — two sine waves at different frequencies simulate off-center gravity
      groupRef.current.rotation.x = Math.sin(t * 0.6) * 0.28 + Math.sin(t * 1.3) * 0.12

      // Slow Z wobble
      groupRef.current.rotation.z = Math.sin(t * 0.4 + 1.8) * 0.18 + Math.sin(t * 0.9) * 0.08

      // Apply Y position from crystalYRef as before
      if (crystalYRef?.current?.value !== null && crystalYRef?.current?.value !== undefined) {
        groupRef.current.position.y = crystalYRef.current.value
      }
    } else {
      if (crystalState === 'SEED') {
        groupRef.current.rotation.y += 0.002
        groupRef.current.rotation.x += 0.0005
      } else if (crystalState === 'CHARGING') {
        groupRef.current.rotation.y += 0.002 + question.length * 0.0003
        groupRef.current.rotation.x += 0.0005
      } else if (crystalState === 'EMERGED') {
        groupRef.current.rotation.y += 0.001
      }
      if (crystalYRef?.current?.value !== null && crystalYRef?.current?.value !== undefined) {
        groupRef.current.position.y = crystalYRef.current.value
      }
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {meshes.shell.map((mesh, i) => (
        <mesh key={`shell-${i}`} geometry={mesh.geometry}>
          <MeshTransmissionMaterial
            transmission={0.15}
            thickness={1.8}
            roughness={0.25}
            ior={1.31}
            color="#8899aa"
            envMapIntensity={0.4}
            samples={1}
            resolution={256}
            frames={1}
            flatShading={true}
            normalMap={normalMap}
            normalScale={[1.2, 1.2]}
            roughnessMap={roughnessMap}
          />
        </mesh>
      ))}
      {meshes.core.map((mesh, i) => (
        <mesh key={`core-${i}`} geometry={mesh.geometry}>
          <meshStandardMaterial
            color="#e8edf2"
            emissive="#c5d3e0"
            emissiveIntensity={0.4}
            roughness={0.6}
            metalness={0}
          />
        </mesh>
      ))}
      {falling && meshes.shell.map((mesh, i) => (
        <mesh
          key={`rune-overlay-${i}`}
          geometry={mesh.geometry}
          scale={1.02}
        >
          <meshBasicMaterial
            map={runicTexture}
            transparent
            opacity={0.88}
            depthWrite={false}
            blending={THREE.NormalBlending}
            alphaTest={0.01}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  )
}

useGLTF.preload('/crystal.glb')