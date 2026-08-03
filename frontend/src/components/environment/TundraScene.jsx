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
import FrozenLake from './FrozenLake'
import IceCrack from './IceCrack'
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
const FOG_NEAR_START = 40
const FOG_FAR_START  = 180
const FOG_NEAR_END   = 10
const FOG_FAR_END    = 42

const FOG_COLOR_START = new THREE.Color('#9aaab8')
const FOG_COLOR_END   = new THREE.Color('#c8d8e2')
const BG_COLOR_START  = new THREE.Color('#8a9aa8')
const BG_COLOR_END    = new THREE.Color('#8fa0ae')

const _bgColor  = new THREE.Color()

function FogController({ scrollProgress, ambientRef }) {
  const { scene } = useThree()

  useFrame(() => {
    const t = scrollProgress.current
    const fog = scene.fog

    if (fog) {
      fog.near = THREE.MathUtils.lerp(FOG_NEAR_START, FOG_NEAR_END, t)
      fog.far  = THREE.MathUtils.lerp(FOG_FAR_START,  FOG_FAR_END,  t)
      fog.color.lerpColors(FOG_COLOR_START, FOG_COLOR_END, t)
    }

    _bgColor.lerpColors(BG_COLOR_START, BG_COLOR_END, t)
    scene.background = _bgColor.clone()

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(1.4, 2.2, t)
    }
  })

  return null
}

function FallSequencer({ crystalYRef, crackScaleRef, fallPhaseRef }) {
  const crystalState = useAtlasStore((s) => s.crystalState)
  const setScene = useAtlasStore((s) => s.setScene)
  const hasRun = useRef(false)

  useEffect(() => {
    if (crystalState !== 'DESCENDING') return
    if (hasRun.current) return
    hasRun.current = true

    crystalYRef.current.value = 5.5
    crackScaleRef.current.value = 1.6

    const tl = gsap.timeline()

    tl.to(crackScaleRef.current, {
      value: 9.0,
      duration: 1.4,
      ease: 'power2.inOut',
    }, 0)

    tl.call(() => {
      fallPhaseRef.current = 'follow'
    }, null, 0.6)

    tl.to(crystalYRef.current, {
      value: -55,
      duration: 4.0,
      ease: 'power2.in',
    }, 0.9)

    tl.call(() => {
      fallPhaseRef.current = 'parallel'
    }, null, 2.2)

    tl.call(() => {
      setScene('descent')
    }, null, 4.8)

  }, [crystalState])

  return null
}

function SceneContents({ scrollProgress, targetProgress, isLowEnd, crystalYRef, crackScaleRef, fallPhaseRef }) {
  const crystalState = useAtlasStore((s) => s.crystalState)
  const ambientRef = useRef()

  return (
    <>
      <color attach="background" args={['#8a9aa8']} />
      <fog attach="fog" args={['#9aaab8', 40, 180]} />

      <TundraSky />
      <TundraGround />
      <HorizonRidge />
      <FrozenLake />
      <IceCrack scrollProgress={scrollProgress} crackScaleRef={crackScaleRef} />
      <CrystalMesh crystalState={crystalState} position={[0, 5.5, 0]} scale={2.5} crystalYRef={crystalYRef} />
      <CrystalParticles />

      <ambientLight ref={ambientRef} color="#c8d8e8" intensity={1.4} />
      <directionalLight color="#f0e8d8" intensity={2.0} position={[-80, 12, -100]} />
      <directionalLight color="#c8ddf0" intensity={0.8} position={[30, 20, 30]} />

      <CameraRig scrollProgress={scrollProgress} targetProgress={targetProgress} crystalYRef={crystalYRef} fallPhaseRef={fallPhaseRef} />

      <FallSequencer crystalYRef={crystalYRef} crackScaleRef={crackScaleRef} fallPhaseRef={fallPhaseRef} />

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
  const crackScaleRef = useRef({ value: null })
  const fallPhaseRef = useRef(null)

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      dpr={[1, 2]}
      camera={{ fov: 45, position: [0, 2.5, 90], near: 0.1, far: 500 }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <GpuQualityDetector onDetect={onDetect} />
      <SceneContents scrollProgress={scrollProgress} targetProgress={targetProgress} isLowEnd={isLowEnd} crystalYRef={crystalYRef} crackScaleRef={crackScaleRef} fallPhaseRef={fallPhaseRef} />
    </Canvas>
  )
}
