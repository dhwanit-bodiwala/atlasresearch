import { useRef, useState, useEffect, useCallback } from 'react'
import TundraScene from '../components/environment/TundraScene'
import ProjectTagPill from '../components/ui/ProjectTagPill'
import useAtlasStore from '../store/atlasStore'
import { useScrollCamera } from '../hooks/useScrollCamera'

export default function EntryScene() {
  const [hasClicked, setHasClicked] = useState(false)
  const hasClickedRef = useRef(false)
  const [inputMode, setInputMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [atThreshold, setAtThreshold] = useState(false)
  const inputRef = useRef()
  const scrollDisabledRef = useRef(false)
  const setQuestion = useAtlasStore((s) => s.setQuestion)
  const setCrystalState = useAtlasStore((s) => s.setCrystalState)
  const setScene = useAtlasStore((s) => s.setScene)
  const { scrollProgress, targetProgress } = useScrollCamera(
    useCallback(() => setAtThreshold(true), []),
    useCallback(() => {
      // Only reset if user hasn't clicked yet
      if (!hasClickedRef.current) setAtThreshold(false)
    }, []),
    scrollDisabledRef
  )

  useEffect(() => {
    scrollDisabledRef.current = inputMode
    if (inputMode) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [inputMode])

  const handleCrystalClick = () => {
    if (hasClickedRef.current) return
    hasClickedRef.current = true
    setHasClicked(true)
    setInputMode(true)
  }

  const handleClose = () => {
    setInputMode(false)
    setHasClicked(false)
    hasClickedRef.current = false
    setInputValue('')
    // Don't reset atThreshold — user is still close enough
  }

  const handleSubmit = () => {
    if (!inputValue.trim()) return
    setQuestion(inputValue.trim())
    setInputMode(false)
    setCrystalState('DESCENDING')
    setScene('descent')
    console.log('Transitioning to descent...')
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <TundraScene scrollProgress={scrollProgress} targetProgress={targetProgress} />
      
      <ProjectTagPill />
      
      {atThreshold && !inputMode && (
        <>
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '340px',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(8,10,14,0.68) 0%, transparent 70%)',
              pointerEvents: 'none',
              opacity: 1,
              transition: 'opacity 0.6s ease',
              zIndex: 15,
            }}
          />
          <div
            onClick={handleCrystalClick}
            className="crystallise-hint"
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '8px',
              color: 'rgba(255, 255, 255, 0.82)',
              opacity: 1,
              pointerEvents: 'auto',
              cursor: 'pointer',
              userSelect: 'none',
              zIndex: 20,
              textShadow: '0 0 18px rgba(255,255,255,0.45)',
            }}
          >
            CLICK TO CRYSTALLISE
          </div>
        </>
      )}

      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 10, 14, 0.84)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inputMode ? 1 : 0,
          pointerEvents: inputMode ? 'auto' : 'none',
          transition: 'opacity 0.45s ease',
        }}
      >
        {/* Close button — top right */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '32px',
            right: '40px',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            letterSpacing: '3px',
            cursor: 'pointer',
            padding: '8px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          ✕ CLOSE
        </button>

        {/* Label above input */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '6px',
            color: 'rgba(255,255,255,0.35)',
            marginBottom: '32px',
          }}
        >
          WHAT DO YOU WANT TO RESEARCH?
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
            if (e.key === 'Escape') {
              handleClose()
            }
          }}
          placeholder=""
          className="atlas-input-overlay"
          style={{
            width: '520px',
            maxWidth: '88vw',
            fontSize: '22px',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 300,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.92)',
            textAlign: 'center',
            padding: '12px 0',
            outline: 'none',
            caretColor: 'rgba(255,255,255,0.55)',
          }}
        />

        {/* Submit hint — only shows when user has typed something */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '4px',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '28px',
            opacity: inputValue.length > 0 ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          PRESS ENTER TO CRYSTALLISE →
        </div>
      </div>
    </div>
  )
}
