import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRef } from 'react'

const START_POS = new THREE.Vector3(0, 4, 90)
const START_TARGET = new THREE.Vector3(0, 0, 0)
const END_POS = new THREE.Vector3(0, 5, 28)
const END_TARGET = new THREE.Vector3(0, 8, 0)

// Camera-relevant phases only
const FOLLOW_PHASES = new Set(['follow'])
const WATER_ENTRY_PHASES = new Set(['water_entry', 'ripple_1', 'ripple_2', 'ripple_3'])
const PARALLEL_PHASES = new Set(['parallel'])

export default function CameraRig({ scrollProgress, targetProgress, crystalYRef = null, fallPhaseRef = null }) {
  const { camera } = useThree()

  const targetVec = useRef(new THREE.Vector3())
  const camMode = useRef('scroll')     // 'scroll' | 'follow' | 'parallel'
  const modeBlend = useRef(0)          // smooth 0→1 blend into new mode, never resets on ripple changes

  useFrame((_, delta) => {
    const phase = fallPhaseRef?.current

    // Resolve camera mode from phase — ripple phases hold camera in scroll,
    // only 'follow' and later phases move camera
    let desiredMode = 'scroll'
    if (phase && FOLLOW_PHASES.has(phase)) desiredMode = 'follow'
    if (phase && WATER_ENTRY_PHASES.has(phase)) desiredMode = 'water_entry'
    if (phase && PARALLEL_PHASES.has(phase)) desiredMode = 'parallel'

    // Only reset blend when mode actually changes (not on ripple sub-phase changes)
    if (desiredMode !== camMode.current) {
      camMode.current = desiredMode
      modeBlend.current = 0
    }

    // Ramp blend using delta for frame-rate independence, smooth ease
    // ~1.8s to fully blend at 60fps
    modeBlend.current = Math.min(1, modeBlend.current + delta * 0.55)
    const b = THREE.MathUtils.smoothstep(modeBlend.current, 0, 1)

    if (camMode.current === 'water_entry' && crystalYRef?.current) {
      const cy = crystalYRef.current.value

      const t = scrollProgress.current
      const scrollX = THREE.MathUtils.lerp(START_POS.x, END_POS.x, t)
      const scrollY = THREE.MathUtils.lerp(START_POS.y, END_POS.y, t)
      const scrollZ = THREE.MathUtils.lerp(START_POS.z, END_POS.z, t)

      // Pull back and lower so lake surface + rings are visible
      const targetX = 0
      const targetY = 4
      const targetZ = 22

      camera.position.x = THREE.MathUtils.lerp(scrollX, targetX, b)
      camera.position.y = THREE.MathUtils.lerp(scrollY, targetY, b)
      camera.position.z = THREE.MathUtils.lerp(scrollZ, targetZ, b)

      // Look at water surface, not crystal
      camera.lookAt(0, -0.4, 0)
      return
    }

    if (camMode.current === 'follow' && crystalYRef?.current) {
      const cy = crystalYRef.current.value

      // Scroll position at current t — blend FROM here when entering follow
      const t = scrollProgress.current
      const scrollX = THREE.MathUtils.lerp(START_POS.x, END_POS.x, t)
      const scrollY = THREE.MathUtils.lerp(START_POS.y, END_POS.y, t)
      const scrollZ = THREE.MathUtils.lerp(START_POS.z, END_POS.z, t)

      // Target follow position
      const followX = 0
      const followY = cy + 6
      const followZ = 8

      // Blend from scroll position to follow position using modeBlend
      camera.position.x = THREE.MathUtils.lerp(scrollX, followX, b)
      camera.position.y = THREE.MathUtils.lerp(scrollY, followY, b)
      camera.position.z = THREE.MathUtils.lerp(scrollZ, followZ, b)

      // LookAt: blend from scroll target to crystal
      const scrollLookY = THREE.MathUtils.lerp(START_TARGET.y, END_TARGET.y, t)
      camera.lookAt(0, THREE.MathUtils.lerp(scrollLookY, cy, b), 0)
      return
    }

    if (camMode.current === 'parallel' && crystalYRef?.current) {
      const cy = crystalYRef.current.value

      // Blend FROM follow position into parallel position
      const prevY = cy + 6
      const prevZ = 8

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 5, 0.04 + b * 0.04)
      camera.position.y = THREE.MathUtils.lerp(prevY, cy + 1, b)
      camera.position.z = THREE.MathUtils.lerp(prevZ, 10, b)
      camera.lookAt(0, cy, 0)
      return
    }

    // Scroll mode
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