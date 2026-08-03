import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

const START_POS = new THREE.Vector3(0, 2.5, 90)
const START_TARGET = new THREE.Vector3(0, 5, 0)
const END_POS = new THREE.Vector3(0, 3, 18)
const END_TARGET = new THREE.Vector3(0, 5, 0)

export default function CameraRig({ scrollProgress, targetProgress, crystalYRef = null, fallPhaseRef = null }) {
  const { camera } = useThree()

  const targetVec = useRef(new THREE.Vector3())

  useFrame(() => {
    if (fallPhaseRef?.current === 'follow' && crystalYRef?.current) {
      const cy = crystalYRef.current.value
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.1)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, cy + 6, 0.08)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5, 0.08)
      camera.lookAt(0, cy, 0)
      return
    }

    if (fallPhaseRef?.current === 'parallel' && crystalYRef?.current) {
      const cy = crystalYRef.current.value
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 5, 0.06)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, cy + 1, 0.1)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 3, 0.06)
      camera.lookAt(0, cy, 0)
      return
    }

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
