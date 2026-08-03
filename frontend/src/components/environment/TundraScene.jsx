import { Canvas, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useState, useCallback, useEffect } from 'react'
import useAtlasStore from '../../store/atlasStore'
import CrystalMesh from '../crystal/CrystalMesh'
import CrystalParticles from '../crystal/CrystalParticles'
import TundraSky from './TundraSky'
import TundraGround from './TundraGround'
import FrozenLake from './FrozenLake'
import IceCrack from './IceCrack'
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

function SceneContents({ scrollProgress, targetProgress, isLowEnd }) {
  const crystalState = useAtlasStore((s) => s.crystalState)

  return (
    <>
      <color attach="background" args={['#8a9aa8']} />
      <fog attach="fog" args={['#9aaab8', 40, 180]} />

      <TundraSky />
      <TundraGround />
      <FrozenLake />
      <IceCrack scrollProgress={scrollProgress.current} />
      <CrystalMesh crystalState={crystalState} position={[0, 5.5, 0]} scale={2.5} />
      <CrystalParticles />

      <ambientLight color="#c8d8e8" intensity={1.4} />
      <directionalLight color="#f0e8d8" intensity={2.0} position={[-80, 12, -100]} />
      <directionalLight color="#c8ddf0" intensity={0.8} position={[30, 20, 30]} />

      <CameraRig scrollProgress={scrollProgress} targetProgress={targetProgress} />

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
      <SceneContents scrollProgress={scrollProgress} targetProgress={targetProgress} isLowEnd={isLowEnd} />
    </Canvas>
  )
}
