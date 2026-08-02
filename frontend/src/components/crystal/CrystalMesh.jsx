import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei'
import useAtlasStore from '../../store/atlasStore'

export default function CrystalMesh({
  crystalState = 'SEED',
  samples = 6,
  resolution = 512,
}) {
  const groupRef = useRef()
  const { scene } = useGLTF('/crystal.glb')
  const question = useAtlasStore((s) => s.question)

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
    <group ref={groupRef} scale={1.4}>
      {meshes.shell.map((mesh, i) => (
        <mesh
          key={`shell-${i}`}
          geometry={mesh.geometry}
          matrix={mesh.matrix}
          matrixAutoUpdate={false}
        >
          <MeshTransmissionMaterial
            transmission={0.65}
            thickness={1.4}
            roughness={0.45}
            ior={1.31}
            chromaticAberration={0.04}
            distortion={0.15}
            distortionScale={0.3}
            temporalDistortion={0.1}
            color="#eef1f5"
            envMapIntensity={0.6}
            samples={samples}
            resolution={resolution}
            flatShading={true}
          />
        </mesh>
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
