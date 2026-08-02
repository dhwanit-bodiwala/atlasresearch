import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import useAtlasStore from '../../store/atlasStore'

export default function CrystalMesh({ crystalState = 'SEED' }) {
  const groupRef = useRef()
  const { scene } = useGLTF('/crystal.glb')
  const question = useAtlasStore((s) => s.question)

  const normalMap = useTexture('/textures/Snow013_2K-JPG_NormalGL.jpg')
  const roughnessMap = useTexture('/textures/Snow013_2K-JPG_Roughness.jpg')

  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping

  normalMap.repeat.set(1.5, 1.5)
  roughnessMap.repeat.set(1.5, 1.5)

  const meshes = useMemo(() => {    const clone = scene.clone(true)
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
        // Two-part crystal: frosted shell encasing a soft inner core
        if (child.name === 'CrystalCore') {
          found.core.push(entry)
        } else {
          found.shell.push(entry)
        }
      }
    })

    return found
  }, [scene])

  useFrame(() => {
    if (!groupRef.current) return

    if (crystalState === 'SEED') {
      groupRef.current.rotation.y += 0.002
      groupRef.current.rotation.x += 0.0005
    } else if (crystalState === 'CHARGING') {
      groupRef.current.rotation.y += 0.002 + question.length * 0.0003
      groupRef.current.rotation.x += 0.0005
    } else if (crystalState === 'EMERGED') {
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef} scale={1.1}>
      {meshes.shell.map((mesh, i) => (
        <mesh
          key={`shell-${i}`}
          geometry={mesh.geometry}
          matrix={mesh.matrix}
          matrixAutoUpdate={false}
        >
          <MeshTransmissionMaterial
            transmission={0.25}
            thickness={1.8}
            roughness={0.4}
            ior={1.31}
            color="#c8d4e8"
            envMapIntensity={0.4}
            samples={1}
            resolution={256}
            frames={1}
            flatShading={true}
            normalMap={normalMap}
            normalScale={[1.2, 1.2]}
            roughnessMap={roughnessMap}
          />        </mesh>
      ))}
      {meshes.core.map((mesh, i) => (
        <mesh
          key={`core-${i}`}
          geometry={mesh.geometry}
          matrix={mesh.matrix}
          matrixAutoUpdate={false}
        >
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
