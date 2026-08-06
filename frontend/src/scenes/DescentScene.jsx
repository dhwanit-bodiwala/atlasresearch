import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import useAtlasStore from '../store/atlasStore'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import fluidFrag from '../components/crystal/shaders/fluid.frag.glsl'
import frostFrag from '../components/crystal/shaders/frost.frag.glsl'
import CrystalMesh from '../components/crystal/CrystalMesh'

const SHAFT_VERTEX = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function DescentCamera() {
  const { camera } = useThree()
  const targetY = useRef(8)
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)

  useEffect(() => {
    if (pipelineStage === 'gatherer')    targetY.current = -2
    if (pipelineStage === 'synthesizer') targetY.current = -14
    if (pipelineStage === 'critic')      targetY.current = -26
  }, [pipelineStage])

  useEffect(() => {
    camera.position.set(0, 4, 12)
    camera.lookAt(0, 0, 0)
  }, [])

  useFrame(() => {
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      targetY.current,
      0.008
    )
    camera.lookAt(0, camera.position.y - 2, 0)
  })

  return null
}

function DepthShaft() {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const timeRef = useRef(0)

  const gatherUniforms = useRef({
    uTime: { value: 0 },
    uIntensity: { value: 0.4 },
    uColorA: { value: new THREE.Color('#031a1a') },
    uColorB: { value: new THREE.Color('#0a4a4a') },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  })
  const synthUniforms = useRef({
    uTime: { value: 0 },
    uFrostAmount: { value: 0.3 },
    uColorA: { value: new THREE.Color('#0a1a2a') },
    uColorB: { value: new THREE.Color('#0a6a8a') },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  })
  const criticUniforms = useRef({
    uTime: { value: 0 },
    uIntensity: { value: 0.5 },
    uColorA: { value: new THREE.Color('#0e0420') },
    uColorB: { value: new THREE.Color('#3a0a8a') },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  })

  useEffect(() => {
    const handleResize = () => {
      const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
      gatherUniforms.current.uResolution.value = resolution
      synthUniforms.current.uResolution.value = resolution
      criticUniforms.current.uResolution.value = resolution
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useFrame((_, delta) => {
    timeRef.current += delta
    gatherUniforms.current.uTime.value = timeRef.current
    synthUniforms.current.uTime.value = timeRef.current
    criticUniforms.current.uTime.value = timeRef.current

    const targetGather = pipelineStage === 'gatherer' ? 1.2 : 0.4
    const targetCritic = pipelineStage === 'critic' ? 1.4 : 0.5
    gatherUniforms.current.uIntensity.value = THREE.MathUtils.lerp(
      gatherUniforms.current.uIntensity.value, targetGather, 0.02
    )
    criticUniforms.current.uIntensity.value = THREE.MathUtils.lerp(
      criticUniforms.current.uIntensity.value, targetCritic, 0.02
    )
  })

  const shaftGeom = new THREE.CylinderGeometry(3.2, 2.2, 12, 48, 8, true)

  return (
    <group>
      <mesh geometry={shaftGeom} position={[0, -4, 0]}>
        <shaderMaterial
          vertexShader={SHAFT_VERTEX}
          fragmentShader={fluidFrag}
          uniforms={gatherUniforms.current}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={shaftGeom} position={[0, -16, 0]}>
        <shaderMaterial
          vertexShader={SHAFT_VERTEX}
          fragmentShader={frostFrag}
          uniforms={synthUniforms.current}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={shaftGeom} position={[0, -28, 0]}>
        <shaderMaterial
          vertexShader={SHAFT_VERTEX}
          fragmentShader={fluidFrag}
          uniforms={criticUniforms.current}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  )
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
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh',
                  background: '#060a12' }}>
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{ fov: 60, position: [0, 8, 4], near: 0.1, far: 200 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <color attach="background" args={['#060a12']} />
        <fog attach="fog" args={['#060a12', 25, 80]} />
        <ambientLight color="#1a2a3a" intensity={0.8} />
        <pointLight color="#3a6a9a" intensity={2.0} position={[0, 0, 0]} />

        <DescentCamera />
        <DepthShaft />
        <CrystalMesh crystalState="FORMING" position={[0, 0, 0]} scale={2.5} />

        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette offset={0.2} darkness={0.8} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>

      <PipelineLabel />
    </div>
  )
}
