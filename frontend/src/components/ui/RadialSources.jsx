import { useEffect, useState } from 'react'
import useAtlasStore from '../../store/atlasStore'

// Ellipse center is crystal position on screen during descent
const CENTER_X = 50  // vw
const CENTER_Y = 44  // vh
const ELLIPSE_W = 300 // px half-width
const ELLIPSE_H = 180 // px half-height

// 7 slots at these angles (degrees)
const SLOT_ANGLES = [330, 30, 80, 130, 210, 250, 290]

function getSlotPosition(slot) {
  const angle = (SLOT_ANGLES[slot] ?? 0) * Math.PI / 180
  return {
    x: Math.cos(angle) * ELLIPSE_W,
    y: Math.sin(angle) * ELLIPSE_H,
  }
}

function getLineProps(slotX, slotY) {
  // Line goes from tag toward crystal center (0,0 relative to ellipse center)
  const dx = -slotX
  const dy = -slotY
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  return { length, angle }
}

function SourceTag({ source }) {
  const [visible, setVisible] = useState(false)
  const [lineDrawn, setLineDrawn] = useState(false)

  useEffect(() => {
    // Fade in tag
    const t1 = setTimeout(() => setVisible(true), 30)
    // Start line trace after tag appears
    const t2 = setTimeout(() => setLineDrawn(true), 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const pos = getSlotPosition(source.slot)
  const { length, angle } = getLineProps(pos.x, pos.y)

  const isGhost = source.state === 'ghost'
  const isComplete = source.state === 'complete'

  const tagOpacity = isGhost ? 0.15 : isComplete ? 0.9 : 0.75
  const lineOpacity = isGhost ? 0.06 : isComplete ? 0.45 : 0.35

  // Absolute position relative to ellipse center
  // Center is at CENTER_X vw, CENTER_Y vh
  // Tag offset from center
  const tagLeft = `calc(${CENTER_X}vw + ${pos.x}px)`
  const tagTop = `calc(${CENTER_Y}vh + ${pos.y}px)`

  return (
    <>
      {/* Domain tag */}
      <div
        style={{
          position: 'fixed',
          left: tagLeft,
          top: tagTop,
          transform: 'translate(-50%, -50%)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          letterSpacing: '4px',
          color: `rgba(255,255,255,${tagOpacity})`,
          opacity: visible ? 1 : 0,
          transition: `opacity ${isGhost ? '1.5s' : '0.4s'} ease`,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 16,
        }}
      >
        {source.domain}
      </div>

      {/* Traced line from tag toward crystal center */}
      <div
        style={{
          position: 'fixed',
          left: tagLeft,
          top: tagTop,
          width: `${length - 24}px`,   // stop 24px short of crystal
          height: '1px',
          background: `rgba(200,220,240,${lineOpacity})`,
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg) scaleX(${lineDrawn ? 1 : 0})`,
          transition: lineDrawn
            ? `transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity ${isGhost ? '1.5s' : '0.3s'} ease`
            : 'none',
          opacity: visible ? 1 : 0,
          pointerEvents: 'none',
          zIndex: 16,
        }}
      />
    </>
  )
}

export default function RadialSources() {
  const sources = useAtlasStore((s) => s.sources)
  const pipelineStage = useAtlasStore((s) => s.pipelineStage)

  if (!pipelineStage) return null

  return (
    <>
      {sources.map((source) => (
        <SourceTag key={source.id} source={source} />
      ))}
    </>
  )
}
