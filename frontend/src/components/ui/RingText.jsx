import { useEffect, useRef } from 'react'

export default function RingText() {
  const cx = window.innerWidth / 2 - 60
  const cy = window.innerHeight / 2 - 50
  const r = 420

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <defs>
        <path
          id="ringPath"
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`}
        />
      </defs>
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'ringRotate 20s linear infinite' }}>
        <text
          fontFamily="JetBrains Mono, monospace"
          fontSize="17"
          letterSpacing="4"
          fill="#4a5060"
          opacity="0.6"
        >
          <textPath href="#ringPath">
            ATLAS · RESEARCH · FOCUS · YOUR · QUESTION · 
          </textPath>
        </text>
      </g>
    </svg>
  )
}