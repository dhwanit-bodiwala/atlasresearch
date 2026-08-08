import { useEffect, useState } from 'react'
import useAtlasStore from '../../store/atlasStore'

export default function EmergenceHUD() {
  const crystalState = useAtlasStore((s) => s.crystalState)
  const currentScene = useAtlasStore((s) => s.currentScene)
  const processedInfo = useAtlasStore((s) => s.processedInfo)
  const flaggedItems = useAtlasStore((s) => s.flaggedItems)
  const synthesisId = useAtlasStore((s) => s.synthesisId)
  const resetPipeline = useAtlasStore((s) => s.resetPipeline)

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (crystalState === 'EMERGED' && currentScene === 'entry') {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [crystalState, currentScene])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (crystalState !== 'EMERGED' || currentScene !== 'entry') {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 10, 14, 0.84)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 50,
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 1.5s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '72px 48px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: '64px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingBottom: '24px',
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '6px',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            ATLAS RESEARCH // SYNTHESIS
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '4px',
              color: 'rgba(255,255,255,0.12)',
            }}
          >
            {synthesisId ?? 'COMPLETE'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '60fr 40fr',
            gap: '64px',
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                letterSpacing: '5px',
                color: 'rgba(255,255,255,0.2)',
                marginBottom: '28px',
              }}
            >
              SYNTHESIS
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                letterSpacing: '0.3px',
                lineHeight: '2.4',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 400,
              }}
            >
              {processedInfo}
            </div>
          </div>

          <div
            style={{
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              paddingLeft: '48px',
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                letterSpacing: '5px',
                color: 'rgba(255,160,80,0.35)',
                marginBottom: '28px',
              }}
            >
              FLAGGED DISCREPANCIES
            </div>
            {(!flaggedItems || flaggedItems.length === 0) ? (
              <div
                style={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  color: 'rgba(255,255,255,0.15)',
                }}
              >
                NO FLAGS RAISED
              </div>
            ) : (
              <div>
                {flaggedItems.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.3px',
                      lineHeight: '2.0',
                      color: 'rgba(255,160,80,0.6)',
                      paddingBottom: '20px',
                      marginBottom: '20px',
                      borderBottom: i < flaggedItems.length - 1 ? '1px solid rgba(255,160,80,0.08)' : 'none',
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => resetPipeline()}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '6px',
              color: 'rgba(255,255,255,0.2)',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '10px 28px',
              transition: 'color 0.2s, border-color 0.2s',
              background: 'transparent',
            }}
          >
            NEW RESEARCH
          </button>
        </div>
      </div>
    </div>
  )
}
