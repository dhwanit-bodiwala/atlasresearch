import { forwardRef, useCallback, useEffect, useState, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  DepthOfField,
  ToneMapping,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import useAtlasStore from '../../store/atlasStore'
import CrystalMesh from './CrystalMesh'
import CrystalParticles from './CrystalParticles'

function GpuQualityDetector({ onDetect }) {
  const { gl } = useThree()
  useEffect(() => {
    const context = gl.getContext()
    const isLowEnd = context.getParameter(context.MAX_TEXTURE_SIZE) < 8192
    onDetect(isLowEnd)
  }, [gl, onDetect])
  return null
}

function SceneContents({ chromaticRef, isLowEnd }) {
  const currentScene = useAtlasStore((s) => s.currentScene)
  const crystalState = useAtlasStore((s) => s.crystalState)
  const dofRef = useRef()

  const samples = isLowEnd ? 4 : 6
  const resolution = isLowEnd ? 256 : 512

  return (
    <>
      <color attach="background" args={['#c8cdd6']} />
      <fog attach="fog" args={['#c8cdd6', 5, 15]} />

      <Environment files="/hdri/kloofendal_puresky.hdr" background={false} />

      <ambientLight color="#dde4ee" intensity={0.6} />
      <directionalLight color="#ffffff" intensity={2.2} position={[3, 6, 4]} />
      <directionalLight color="#7a8daa" intensity={1.0} position={[-4, -2, -3]} />

      <CrystalMesh
        crystalState={crystalState}
        samples={samples}
        resolution={resolution}
      />
      <CrystalParticles />

      <EffectComposer multisampling={isLowEnd ? 0 : 4}>
        <Bloom
          intensity={0.35}
          luminanceThreshold={0.82}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          ref={chromaticRef}
          offset={[0, 0]}
          blendFunction={BlendFunction.NORMAL}
          radialModulation
          modulationOffset={0.4}
        />
        <Vignette
          offset={0.15}
          darkness={0.4}
          eskil={false}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise opacity={0.018} blendFunction={BlendFunction.SCREEN} />
        <DepthOfField
          ref={dofRef}
          focusDistance={0.01}
          focalLength={0.04}
          bokehScale={2}
          enabled={currentScene === 'descent' && !isLowEnd}
        />
        {/* EffectComposer disables renderer tone mapping — ACES must be
            applied as the final effect (uses gl.toneMappingExposure = 0.9) */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  )
}

const CrystalScene = forwardRef(function CrystalScene(_props, chromaticRef) {
  const [isLowEnd, setIsLowEnd] = useState(false)
  const onDetect = useCallback((low) => setIsLowEnd(low), [])

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      dpr={[1, 2]}
      camera={{ fov: 50, position: [0, 0, 6], near: 0.1, far: 100 }}
      style={{ position: 'fixed', inset: 0, cursor: 'none' }}
    >
      <GpuQualityDetector onDetect={onDetect} />
      <SceneContents chromaticRef={chromaticRef} isLowEnd={isLowEnd} />
    </Canvas>
  )
})

export default CrystalScene
