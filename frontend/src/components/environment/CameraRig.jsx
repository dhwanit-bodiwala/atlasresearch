import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

const START_POS = new THREE.Vector3(0, 2.5, 90)
const START_TARGET = new THREE.Vector3(0, 5, 0)
const END_POS = new THREE.Vector3(0, 3, 18)
const END_TARGET = new THREE.Vector3(0, 5, 0)

export default function CameraRig({ scrollProgress, targetProgress }) {
  const { camera } = useThree()

  const targetVec = useRef(new THREE.Vector3())

  useFrame(() => {
    scrollProgress.current = THREE.MathUtils.lerp(
     scrollProgress.current,
     targetProgress.current,
     0.15
  )
  const t = scrollProgress.current
  camera.position.lerpVectors(START_POS, END_POS, t)
  targetVec.current.lerpVectors(START_TARGET, END_TARGET, t)
  camera.lookAt(targetVec.current)
})

  return null
}
