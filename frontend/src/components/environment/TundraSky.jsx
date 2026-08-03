import { Sky } from '@react-three/drei'

export default function TundraSky() {
  return (
    <Sky
      distance={450000}
      sunPosition={[-0.5, 0.06, -1]}
      inclination={0.502}
      azimuth={0.25}
      turbidity={12}
      rayleigh={0.8}
      mieCoefficient={0.003}
      mieDirectionalG={0.92}
    />
  )
}
