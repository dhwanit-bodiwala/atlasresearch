import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import useAtlasStore from '../store/atlasStore'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import CrystalMesh from '../components/crystal/CrystalMesh'
import AmbientParticles from '../components/environment/AmbientParticles'
import GodRays from '../components/environment/GodRays'
import CrystalHUD from '../components/ui/CrystalHUD'

function ZoneAtmosphere({ crystalYRef }) {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const currentScene = useAtlasStore((s) => s.currentScene)
  const ambientRef = useRef()
  const targetFog = useRef(new THREE.Color('#9ec4d4'))
  const densityTarget = useRef(0.022)

  useEffect(() => {
    if (pipelineStage === 'gatherer') {
      targetFog.current.set('#9ec4d4')
      densityTarget.current = 0.022
    }
    if (pipelineStage === 'synthesizer') {
      targetFog.current.set('#1a3a5a')
      densityTarget.current = 0.038
    }
    if (pipelineStage === 'critic') {
      targetFog.current.set('#080418')
      densityTarget.current = 0.06
    }
  }, [pipelineStage])

  useFrame(({ scene }) => {
    if (!scene.fog) return

    if (currentScene === 'emergence' && crystalYRef?.current) {
      const y = crystalYRef.current.value
      if (y > -8) {
        targetFog.current.set('#9ec4d4')
        densityTarget.current = 0.022
      } else if (y > -21) {
        targetFog.current.set('#1a3a5a')
        densityTarget.current = 0.038
      } else {
        targetFog.current.set('#080418')
        densityTarget.current = 0.06
      }
    }

    scene.fog.color.lerp(targetFog.current, 0.008)
    scene.fog.density += (densityTarget.current - scene.fog.density) * 0.008
  })

  return <ambientLight ref={ambientRef} color="#8ab8cc" intensity={1.8} />
}

const ZONE_COLORS = {
  gatherer:    { top: '#d8eaf2', mid: '#9ec4d4', bot: '#7aafc2' },
  synthesizer: { top: '#0a1828', mid: '#0d2035', bot: '#081525' },
  critic:      { top: '#080418', mid: '#050310', bot: '#0a0520' },
}

function getZoneFromY(y) {
  if (y > -8) return 'gatherer'
  if (y > -21) return 'synthesizer'
  return 'critic'
}

function EnvSphere({ crystalYRef }) {
  const meshRef = useRef()
  const pipelineStage = useAtlasStore(s => s.pipelineStage)
  const currentScene = useAtlasStore(s => s.currentScene)

  const targetTop = useRef(new THREE.Color('#d8eaf2'))
  const targetMid = useRef(new THREE.Color('#9ec4d4'))
  const targetBot = useRef(new THREE.Color('#7aafc2'))

  const uniforms = useRef({
    uTime: { value: 0 },
    uTopColor: { value: new THREE.Color('#c8dde8') },
    uMidColor: { value: new THREE.Color('#9ec4d4') },
    uBotColor: { value: new THREE.Color('#7aafc2') },
  })

  useEffect(() => {
    if (pipelineStage === 'gatherer') {
      targetTop.current.set('#d8eaf2')
      targetMid.current.set('#9ec4d4')
      targetBot.current.set('#7aafc2')
    } else if (pipelineStage === 'synthesizer') {
      targetTop.current.set('#0a1828')
      targetMid.current.set('#0d2035')
      targetBot.current.set('#081525')
    } else if (pipelineStage === 'critic') {
      targetTop.current.set('#080418')
      targetMid.current.set('#050310')
      targetBot.current.set('#0a0520')
    }
  }, [pipelineStage])

  useFrame((_, delta) => {
    uniforms.current.uTime.value += delta

    if (currentScene === 'emergence' && crystalYRef?.current) {
      const zone = getZoneFromY(crystalYRef.current.value)
      const colors = ZONE_COLORS[zone]
      targetTop.current.set(colors.top)
      targetMid.current.set(colors.mid)
      targetBot.current.set(colors.bot)
    }

    uniforms.current.uTopColor.value.lerp(targetTop.current, 0.008)
    uniforms.current.uMidColor.value.lerp(targetMid.current, 0.008)
    uniforms.current.uBotColor.value.lerp(targetBot.current, 0.008)
  })

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[80, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={uniforms.current}
        vertexShader={`
          varying vec3 vPosition;
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uTopColor;
          uniform vec3 uMidColor;
          uniform vec3 uBotColor;
          varying vec3 vPosition;
          void main() {
            float t = (normalize(vPosition).y + 1.0) * 0.5;
            vec3 col = mix(uBotColor, uMidColor, smoothstep(0.0, 0.5, t));
            col = mix(col, uTopColor, smoothstep(0.4, 1.0, t));
            // Subtle haze noise
            float haze = 0.04 * sin(vPosition.x * 0.08 + uTime * 0.12) * sin(vPosition.z * 0.06 + uTime * 0.09);
            col += haze;
            gl_FragColor = vec4(col, 1.0);
          }
        `}
        depthWrite={false}
      />
    </mesh>
  )
}

function ParallaxDust({ crystalYRef }) {
  const pointsRef = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 15
    }
    return pos
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    // Move at 30% of crystal speed — creates parallax depth
    pointsRef.current.position.y = crystalYRef.current.value * 0.3
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={200} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#c8dde8"
        transparent
        opacity={0.25}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function SpeedStreaks({ crystalYRef }) {
  const groupRef = useRef()
  const prevY = useRef(0)

  const lines = useMemo(() => {
    return Array.from({ length: 12 }, () => ({
      x: (Math.random() - 0.5) * 8,
      z: (Math.random() - 0.5) * 6 + 2,
      length: 0.3 + Math.random() * 0.8,
    }))
  }, [])

  useFrame(() => {
    if (!groupRef.current) return
    const speed = Math.abs(crystalYRef.current.value - prevY.current)
    prevY.current = crystalYRef.current.value
    // Stretch streaks based on speed
    groupRef.current.scale.y = 1 + speed * 8
    groupRef.current.position.y = crystalYRef.current.value
  })

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={[line.x, 0, line.z]}>
          <planeGeometry args={[0.01, line.length]} />
          <meshBasicMaterial
            color="#a8cce0"
            transparent
            opacity={0.08}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function DescentInner({ crystalYRef }) {
  const currentScene = useAtlasStore((s) => s.currentScene)

  useFrame((_, delta) => {
    if (currentScene !== 'descent') return
    crystalYRef.current.value -= delta * 3.5
    if (crystalYRef.current.value < -34) crystalYRef.current.value = 4
  })

  return null
}

function ResurfaceInner({ crystalYRef, onBreachFlash }) {
  const currentScene = useAtlasStore((s) => s.currentScene)
  const setScene = useAtlasStore((s) => s.setScene)
  const setCrystalState = useAtlasStore((s) => s.setCrystalState)
  const tweenRef = useRef(null)
  const breachFlashed = useRef(false)

  useEffect(() => {
    if (currentScene !== 'emergence') {
      breachFlashed.current = false
      if (tweenRef.current) {
        tweenRef.current.kill()
        tweenRef.current = null
      }
      return
    }

    tweenRef.current = gsap.to(crystalYRef.current, {
      value: 4,
      duration: 3.5,
      ease: 'power2.inOut',
      onComplete: () => {
        setScene('entry')
        setCrystalState('EMERGED')
      },
    })

    return () => {
      if (tweenRef.current) {
        tweenRef.current.kill()
        tweenRef.current = null
      }
    }
  }, [currentScene, crystalYRef, setScene, setCrystalState])

  useFrame(() => {
    if (currentScene !== 'emergence') return
    if (crystalYRef.current.value > 0 && !breachFlashed.current) {
      breachFlashed.current = true
      onBreachFlash?.()
    }
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
  const [breachFlash, setBreachFlash] = useState(false)

  const handleBreachFlash = () => {
    setBreachFlash(true)
    // After the CSS transition finishes, unmount the overlay
    setTimeout(() => setBreachFlash(false), 700)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh',
                  background: '#060a12' }}>
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        camera={{ fov: 60, position: [0, 8, 4], near: 0.1, far: 200 }}
        style={{ position: 'fixed', inset: 0 }}
      >
        <fogExp2 attach="fog" color="#9ec4d4" density={0.022} />
        <pointLight color="#ffffff" intensity={3.0} position={[0, 10, 5]} />

        <EnvSphere crystalYRef={crystalYRef} />
        <ZoneAtmosphere crystalYRef={crystalYRef} />
        <Environment preset="dawn" background={false} />
        <DescentInner crystalYRef={crystalYRef} />
        <ResurfaceInner crystalYRef={crystalYRef} onBreachFlash={handleBreachFlash} />
        <DescentCamera crystalYRef={crystalYRef} />
        <CrystalMesh crystalState="FORMING" position={[0, 0, 0]} scale={2.5} crystalYRef={crystalYRef} falling={true} />
        <ParallaxDust crystalYRef={crystalYRef} />
        <SpeedStreaks crystalYRef={crystalYRef} />
        <AmbientParticles crystalYRef={crystalYRef} />
        <GodRays crystalYRef={crystalYRef} />

        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0012, 0.0008]}
          />
          <Vignette offset={0.3} darkness={0.6} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>

      {breachFlash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'white',
            pointerEvents: 'none',
            zIndex: 50,
            opacity: 0,
            transition: 'opacity 0.6s ease',
            animation: 'breachFlash 0.6s ease forwards',
          }}
        />
      )}

      <style>{`
        @keyframes breachFlash {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }
      `}</style>

      <PipelineLabel />
      <CrystalHUD />
    </div>
  )
}
