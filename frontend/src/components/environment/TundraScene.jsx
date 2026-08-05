import { Canvas, useThree, useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useState, useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import useAtlasStore from '../../store/atlasStore'
import CrystalMesh from '../crystal/CrystalMesh'
import CrystalParticles from '../crystal/CrystalParticles'
import TundraSky from './TundraSky'
import TundraGround from './TundraGround'
import LakeBody from './LakeBody'
import LakeRipple from './LakeRipple'
import WaterEntry from './WaterEntry'
import LakeIceShards from './LakeIceShards'
import HorizonRidge from './HorizonRidge'
import CameraRig from './CameraRig'

function GpuQualityDetector({ onDetect }) {
  const { gl } = useThree()
  useEffect(() => {
    const context = gl.getContext()
    const isLowEnd = context.getParameter(context.MAX_TEXTURE_SIZE) < 8192
    onDetect(isLowEnd)
  }, [gl, onDetect])
  return null
}

// Fog states
const FOG_NEAR_START = 80
const FOG_FAR_START = 320
const FOG_NEAR_END = 60
const FOG_FAR_END = 200

const FOG_COLOR_START = new THREE.Color('#9aaab8')
const FOG_COLOR_END = new THREE.Color('#c8d8e2')
const BG_COLOR_START = new THREE.Color('#8a9aa8')
const BG_COLOR_END = new THREE.Color('#8fa0ae')

const _bgColor = new THREE.Color()

function FogController({ scrollProgress, ambientRef }) {
  const { scene, gl } = useThree()
  const crystalState = useAtlasStore((s) => s.crystalState)

  useFrame(() => {
    const t = scrollProgress.current
    const fog = scene.fog

    if (fog) {
      fog.near = THREE.MathUtils.lerp(FOG_NEAR_START, FOG_NEAR_END, t)
      fog.far = THREE.MathUtils.lerp(FOG_FAR_START, FOG_FAR_END, t)
      fog.color.lerpColors(FOG_COLOR_START, FOG_COLOR_END, t)
    }

    _bgColor.lerpColors(BG_COLOR_START, BG_COLOR_END, t)
    scene.background = _bgColor.clone()

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(1.4, 2.2, t)
    }

    if (crystalState === 'DESCENDING') {
      _bgColor.lerp(new THREE.Color('#060a12'), 0.04)
      scene.background = _bgColor.clone()
      if (scene.fog) {
        scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 5, 0.04)
        scene.fog.color.lerp(new THREE.Color('#060a12'), 0.04)
      }
    }

    // Dynamic exposure — dip at mid-scroll to kill sun glare
    // Peak glare is around t=0.4–0.6, pull exposure down there
    const glare = Math.sin(t * Math.PI) // 0→1→0 bell curve peaking at t=0.5
    gl.toneMappingExposure = THREE.MathUtils.lerp(0.72, 0.52, glare * 0.7)
  })

  return null
}

function FallSequencer({ crystalYRef, fallPhaseRef }) {
  const crystalState = useAtlasStore((s) => s.crystalState)
  const setScene = useAtlasStore((s) => s.setScene)
  const hasRun = useRef(false)

  useEffect(() => {
    if (crystalState !== 'DESCENDING') return
    if (hasRun.current) return
    hasRun.current = true

    crystalYRef.current.value = 9

    const tl = gsap.timeline()

    // t=1.6 → camera starts following, crystal plunges Y:9 → Y:-0.4 in 1.4s
    tl.call(() => {
      fallPhaseRef.current = 'follow'
    }, null, 1.6)

    tl.to(crystalYRef.current, {
      value: -0.4,
      duration: 1.4,
      ease: 'power2.in',
    }, 1.6)

    // t=3.0 → crystal hits water, first ripple triggers
    tl.call(() => {
      fallPhaseRef.current = 'water_entry'
    }, null, 3.0)

    tl.call(() => {
      fallPhaseRef.current = 'ripple_1'
    }, null, 3.05)

    // t=3.2 → parallel camera phase
    tl.call(() => {
      fallPhaseRef.current = 'parallel'
    }, null, 3.2)

    // t=3.85 → second ripple as water closes
    tl.call(() => {
      fallPhaseRef.current = 'ripple_2'
    }, null, 3.85)

    // t=4.8 → transition to descent scene
    tl.call(() => {
      setScene('descent')
    }, null, 4.8)

  }, [crystalState, setScene])

  return null
}

function SceneContents({ scrollProgress, targetProgress, isLowEnd, crystalYRef, fallPhaseRef }) {
  const crystalState = useAtlasStore((s) => s.crystalState)
  const ambientRef = useRef()

  return (
    <>
      <color attach="background" args={['#8a9aa8']} />
      <fog attach="fog" args={['#9aaab8', 80, 320]} />

      <TundraSky />
      {/* Pass scrollProgress to TundraGround so it can fade out */}
      <TundraGround scrollProgress={scrollProgress} />
      <HorizonRidge />
      <LakeBody scrollProgress={scrollProgress} />
      <LakeRipple scrollProgress={scrollProgress} fallPhaseRef={fallPhaseRef} />
      <WaterEntry fallPhaseRef={fallPhaseRef} />
      <LakeIceShards scrollProgress={scrollProgress} />
      <CrystalMesh crystalState={crystalState} position={[0, 9, 0]} scale={2.5} crystalYRef={crystalYRef} />
      <CrystalParticles />

      <ambientLight ref={ambientRef} color="#c8d8e8" intensity={1.4} />
      <directionalLight color="#f0e8d8" intensity={1.1} position={[-80, 12, -100]} />
      <directionalLight color="#c8ddf0" intensity={0.8} position={[30, 20, 30]} />

      <CameraRig scrollProgress={scrollProgress} targetProgress={targetProgress} crystalYRef={crystalYRef} fallPhaseRef={fallPhaseRef} />

      <FallSequencer crystalYRef={crystalYRef} fallPhaseRef={fallPhaseRef} />

      <FogController scrollProgress={scrollProgress} ambientRef={ambientRef} />

      <EffectComposer multisampling={isLowEnd ? 0 : 4}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <Vignette
          offset={0.15}
          darkness={0.4}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise opacity={0.018} blendFunction={BlendFunction.SCREEN} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

export default function TundraScene({ scrollProgress, targetProgress }) {
  const [isLowEnd, setIsLowEnd] = useState(false)
  const onDetect = useCallback((low) => setIsLowEnd(low), [])

  const crystalYRef = useRef({ value: null })
  const fallPhaseRef = useRef(null)

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.72,
      }}
      dpr={[1, 2]}
      camera={{ fov: 45, position: [0, 2.5, 90], near: 0.1, far: 500 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <GpuQualityDetector onDetect={onDetect} />
      <SceneContents
        scrollProgress={scrollProgress}
        targetProgress={targetProgress}
        isLowEnd={isLowEnd}
        crystalYRef={crystalYRef}
        fallPhaseRef={fallPhaseRef}
      />
    </Canvas>
  )
}