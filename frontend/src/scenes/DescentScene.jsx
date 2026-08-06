import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import useAtlasStore from '../store/atlasStore'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import CrystalMesh from '../components/crystal/CrystalMesh'
import AmbientParticles from '../components/environment/AmbientParticles'
import GodRays from '../components/environment/GodRays'
import CrystalHUD from '../components/ui/CrystalHUD'

function ZoneAtmosphere() {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const ambientRef = useRef()
  const targetBg = useRef(new THREE.Color('#8ab8cc'))
  const targetFog = useRef(new THREE.Color('#9ec4d4'))

  useEffect(() => {
    if (pipelineStage === 'gatherer') {
      targetBg.current.set('#8ab8cc')
      targetFog.current.set('#9ec4d4')
    }
    if (pipelineStage === 'synthesizer') {
      targetBg.current.set('#0d2035')
      targetFog.current.set('#1a3a5a')
    }
    if (pipelineStage === 'critic') {
      targetBg.current.set('#030508')
      targetFog.current.set('#06080f')
    }
  }, [pipelineStage])

  useFrame(({ scene }) => {
    if (scene.fog) {
      scene.fog.color.lerp(targetFog.current, 0.008)
    }
    if (scene.background) {
      scene.background.lerp(targetBg.current, 0.008)
    }
  })

  return <ambientLight ref={ambientRef} color="#8ab8cc" intensity={1.8} />
}

function DescentInner({ crystalYRef }) {
  useFrame((_, delta) => {
    crystalYRef.current.value -= delta * 3.5
    if (crystalYRef.current.value < -34) crystalYRef.current.value = 4
  })

  return null
}

function DescentCamera({ crystalYRef }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 4, 12)
    camera.lookAt(0, 0, 0)
  }, [])

  useFrame(() => {
    const targetY = crystalYRef.current.value + 7
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1)
    camera.position.z = 12
    camera.lookAt(0, crystalYRef.current.value, 0)
  })

  return null
}

function PipelineLabel() {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const pipelineError = useAtlasStore((s) => s.pipelineError)

  const label = pipelineError
    ? 'ERROR — ' + pipelineError
    : pipelineStage
      ? pipelineStage.toUpperCase()
      : 'INITIATING'

  return (
    <div style={{
      position: 'fixed',
      top: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px',
      letterSpacing: '6px',
      color: 'rgba(255,255,255,0.3)',
      zIndex: 20,
      pointerEvents: 'none',
    }}>
      {label}
    </div>
  )
}

export default function DescentScene() {
  const crystalYRef = useRef({ value: 4 })

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh',
                  background: '#060a12' }}>
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{ fov: 60, position: [0, 8, 4], near: 0.1, far: 200 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <color attach="background" args={['#8ab8cc']} />
        <fog attach="fog" args={['#9ec4d4', 20, 70]} />
        <pointLight color="#ffffff" intensity={3.0} position={[0, 10, 5]} />

        <ZoneAtmosphere />
        <DescentInner crystalYRef={crystalYRef} />
        <DescentCamera crystalYRef={crystalYRef} />
        <CrystalMesh crystalState="FORMING" position={[0, 0, 0]} scale={2.5} crystalYRef={crystalYRef} />
        <AmbientParticles crystalYRef={crystalYRef} />
        <GodRays crystalYRef={crystalYRef} />

        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>

      <PipelineLabel />
      <CrystalHUD />
    </div>
  )
}
