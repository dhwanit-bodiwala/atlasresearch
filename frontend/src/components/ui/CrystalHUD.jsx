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

const baseText = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '13px',
  color: 'rgba(255,255,255,0.88)',
  letterSpacing: '3px',
  lineHeight: '1.8',
  fontWeight: 500,
  textTransform: 'uppercase',
  pointerEvents: 'none',
}

const connectorBase = {
  position: 'absolute',
  width: '80px',
  height: '1px',
  background: 'rgba(255,255,255,0.45)',
  pointerEvents: 'none',
}

export default function CrystalHUD() {
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)
  const pipelineError = useAtlasStore((s) => s.pipelineError)
  const activeSource = useAtlasStore((s) => s.activeSource)
  const sourceCount = useAtlasStore((s) => s.sourceCount)
  const findingCount = useAtlasStore((s) => s.findingCount)
  const flagCount = useAtlasStore((s) => s.flagCount)

  const [depthCount, setDepthCount] = useState(0)
  const [visible, setVisible] = useState(false)

  const depthInterval = useRef(null)

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

  if (!pipelineStage) return null

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
        <div>AGENT_STATUS</div>
        <div>{pipelineStage?.toUpperCase()}</div>
        <div style={{ ...baseText, fontSize: '10px', opacity: 0.45, marginTop: '2px' }}>
          {pipelineStage === 'gatherer' && 'SCANNING'}
          {pipelineStage === 'synthesizer' && 'FORMING'}
          {pipelineStage === 'critic' && 'VERIFYING'}
        </div>
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

      {/* BOTTOM LEFT — Live Activity */}
      <div style={{ position: 'fixed', top: '62%', left: '24%', ...baseText }}>
        <div style={{ fontSize: '11px', letterSpacing: '2px' }}>
          {pipelineStage === 'gatherer' && (activeSource ?? '—')}
          {pipelineStage === 'synthesizer' && 'SYNTHESIS FORMING'}
          {pipelineStage === 'critic' && 'CLAIMS UNDER REVIEW'}
        </div>
        <div style={{ ...connectorBase, top: '50%', right: '-68px' }} />
      </div>

      {/* BOTTOM RIGHT — Stage-aware counter */}
      <div style={{ position: 'fixed', top: '60%', right: '22%', textAlign: 'right', ...baseText }}>
        <div>
          {pipelineStage === 'gatherer' && 'FACTS'}
          {pipelineStage === 'synthesizer' && 'CORPUS'}
          {pipelineStage === 'critic' && 'FLAGS'}
        </div>
        <div>
          {pipelineStage === 'gatherer' && sourceCount}
          {pipelineStage === 'synthesizer' && findingCount}
          {pipelineStage === 'critic' && flagCount}
        </div>
        <div style={{ ...connectorBase, top: '50%', left: '-68px' }} />
      </div>
    </div>
  )
}
