import { useRef } from 'react'
import { Water } from 'three/addons/objects/Water.js'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMemo } from 'react'

extend({ Water })

export default function LakeBody() {
  const waterRef = useRef()

  const shoreShape = useMemo(() => {
    const outer = new THREE.Shape()
    outer.moveTo(0, -36)
    outer.bezierCurveTo(20, -42, 46, -26, 47, -7)
    outer.bezierCurveTo(49, 10, 55, 30, 33, 40)
    outer.bezierCurveTo(14, 49, -13, 52, -34, 38)
    outer.bezierCurveTo(-51, 26, -46, 1, -49, -17)
    outer.bezierCurveTo(-52, -33, -30, -38, -14, -40)
    outer.bezierCurveTo(-6, -42, -10, -32, 0, -36)
    
    const hole = new THREE.Path()
    hole.moveTo(0, -33)
    hole.bezierCurveTo(18, -39, 42, -24, 43, -6)
    hole.bezierCurveTo(45, 9, 51, 27, 30, 37)
    hole.bezierCurveTo(12, 45, -12, 48, -31, 35)
    hole.bezierCurveTo(-47, 23, -42, 0, -45, -15)
    hole.bezierCurveTo(-48, -30, -27, -35, -12, -37)
    hole.bezierCurveTo(-5, -39, -9, -29, 0, -33)
    outer.holes.push(hole)
    return outer
  }, [])

  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -33)
    s.bezierCurveTo(18, -39, 42, -24, 43, -6)
    s.bezierCurveTo(45, 9, 51, 27, 30, 37)
    s.bezierCurveTo(12, 45, -12, 48, -31, 35)
    s.bezierCurveTo(-47, 23, -42, 0, -45, -15)
    s.bezierCurveTo(-48, -30, -27, -35, -12, -37)
    s.bezierCurveTo(-5, -39, -9, -29, 0, -33)
    return s
  }, [])

  const geom = useMemo(() => new THREE.ShapeGeometry(shape), [shape])

  const waterConfig = useMemo(() => ({
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      'https://threejs.org/examples/textures/waternormals.jpg',
      (t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping }
    ),
    sunDirection: new THREE.Vector3(-1, 0.5, -1).normalize(),
    sunColor: 0xffffff,
    waterColor: 0x0d2137,
    distortionScale: 1.8,
    fog: false,
  }), [])

  useFrame((_, delta) => {
    if (waterRef.current) {
      waterRef.current.material.uniforms['time'].value += delta * 0.4
    }
  })

  return (
    <group>
      <water
        ref={waterRef}
        args={[geom, waterConfig]}
        position={[0, -0.4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <shapeGeometry args={[shoreShape]} />
        <meshStandardMaterial
          color="#a8b8c4"
          roughness={0.95}
          metalness={0}
          depthWrite={true}
        />
      </mesh>
    </group>
  )
}
