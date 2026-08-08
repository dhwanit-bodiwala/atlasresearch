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
            transmission={0.92}
            thickness={2.4}
            roughness={0.08}
            ior={1.45}
            color="#c8d8e8"
            envMapIntensity={1.2}
            samples={2}
            resolution={512}
            frames={Infinity}
            flatShading={false}
            normalMap={normalMap}
            normalScale={[0.6, 0.6]}
            roughnessMap={roughnessMap}
            chromaticAberration={0.04}
            anisotropy={0.15}
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

    </group>
  )
}

useGLTF.preload('/crystal.glb')