import { useEffect, useRef, useState } from 'react'
import useAtlasStore from '../../store/atlasStore'

const RUNE_MAP = {
  G: 'ᚷ', A: 'ᚨ', T: 'ᛏ', H: 'ᚺ', E: 'ᛖ', R: 'ᚱ',
  I: 'ᛁ', S: 'ᛊ', Y: 'ᛃ', N: 'ᚾ', C: 'ᚲ',
}

function toRunes(str) {
  return str
    .toUpperCase()
    .split('')
    .map((ch) => RUNE_MAP[ch] || ch)
    .join('')
}

const GIBBERISH_LINES = [
  'ᛞᛖᚾᛊᛁᛏᚨᛊ // ᚾᛟᚱᛗ',
  'ᚠᛚᚢᛪ_ᚢᚾᛊᛏᚨᛒᛚᛖ',
  'ᚲᚱᛃᛊᛏᚨᛚ_ᛊᛃᚾᚲ',
]

const baseText = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '11px',
  color: 'rgba(255,255,255,0.55)',
  letterSpacing: '2px',
  lineHeight: '1.8',
  pointerEvents: 'none',
}

const connectorBase = {
  position: 'absolute',
  width: '60px',
  height: '1px',
  background: 'rgba(255,255,255,0.2)',
  pointerEvents: 'none',
}

export default function CrystalHUD() {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const pipelineError = useAtlasStore((s) => s.pipelineError)

  const [depthCount, setDepthCount] = useState(0)
  const [gibberishLine, setGibberishLine] = useState(GIBBERISH_LINES[0])
  const [sourceCount, setSourceCount] = useState(0)
  const [visible, setVisible] = useState(false)

  const depthInterval = useRef(null)
  const sourceInterval = useRef(null)
  const gibberishInterval = useRef(null)
  const sourceStart = useRef(null)

  // Fade in when pipelineStage first appears
  useEffect(() => {
    if (pipelineStage) {
      setVisible(true)
    }
  }, [pipelineStage])

  // Depth counter — increments while pipeline runs
  useEffect(() => {
    if (pipelineStage) {
      depthInterval.current = setInterval(() => {
        setDepthCount((c) => c + 1)
      }, 1000)
    } else {
      setDepthCount(0)
    }
    return () => clearInterval(depthInterval.current)
  }, [pipelineStage])

  // Gibberish flicker every 2 seconds
  useEffect(() => {
    gibberishInterval.current = setInterval(() => {
      setGibberishLine(
        GIBBERISH_LINES[Math.floor(Math.random() * GIBBERISH_LINES.length)]
      )
    }, 2000)
    return () => clearInterval(gibberishInterval.current)
  }, [])

  // Source counter — animate 0→3 over 35 seconds during gatherer
  useEffect(() => {
    clearInterval(sourceInterval.current)
    if (pipelineStage === 'gatherer') {
      sourceStart.current = Date.now()
      setSourceCount(0)
      sourceInterval.current = setInterval(() => {
        const elapsed = (Date.now() - sourceStart.current) / 1000
        const count = Math.min(3, Math.floor((elapsed / 35) * 4))
        setSourceCount(count)
      }, 500)
    }
    return () => clearInterval(sourceInterval.current)
  }, [pipelineStage])

  if (!pipelineStage) return null

  const runicStage = toRunes(pipelineStage)
  const depthFormatted = `▼ 00.${String(depthCount).padStart(2, '0')}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 15,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1s ease-in-out',
      }}
    >
      {/* TOP LEFT — Runic stage status */}
      <div style={{ position: 'fixed', top: '38%', left: '28%', ...baseText }}>
        <div>ᚷᚨᚦᛖᚱᛖᚱ_ᛊᛏᚨᛏᚢᛊ</div>
        <div>{runicStage}</div>
        {/* Connector line → right toward center */}
        <div
          style={{
            ...connectorBase,
            top: '50%',
            right: '-68px',
          }}
        />
      </div>

      {/* TOP RIGHT — Depth counter */}
      <div
        style={{
          position: 'fixed',
          top: '35%',
          right: '26%',
          textAlign: 'right',
          ...baseText,
        }}
      >
        <div>DEPTH</div>
        <div>{depthFormatted}</div>
        {/* Connector line → left toward center */}
        <div
          style={{
            ...connectorBase,
            top: '50%',
            left: '-68px',
          }}
        />
      </div>

      {/* BOTTOM LEFT — Gibberish cycling */}
      <div style={{ position: 'fixed', top: '62%', left: '24%', ...baseText }}>
        <div>{gibberishLine}</div>
        {/* Connector line → right toward center */}
        <div
          style={{
            ...connectorBase,
            top: '50%',
            right: '-68px',
          }}
        />
      </div>

      {/* BOTTOM RIGHT — Sources counter */}
      <div
        style={{
          position: 'fixed',
          top: '60%',
          right: '22%',
          textAlign: 'right',
          ...baseText,
        }}
      >
        <div>SOURCES</div>
        <div>{sourceCount}</div>
        {/* Connector line → left toward center */}
        <div
          style={{
            ...connectorBase,
            top: '50%',
            left: '-68px',
          }}
        />
      </div>
    </div>
  )
}
