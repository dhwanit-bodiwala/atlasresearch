import { useRef, useState, useEffect } from 'react'
import TundraScene from '../components/environment/TundraScene'
import ProjectTagPill from '../components/ui/ProjectTagPill'
import { TextScramble } from '../utils/textScramble'
import useAtlasStore from '../store/atlasStore'
import { useScrollCamera } from '../hooks/useScrollCamera'

export default function EntryScene() {
  const [hasClicked, setHasClicked] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const clickTextRef = useRef()
  const textScrambleRef = useRef()
  const setQuestion = useAtlasStore((s) => s.setQuestion)
  const setCrystalState = useAtlasStore((s) => s.setCrystalState)
  const { scrollProgress, targetProgress } = useScrollCamera()

  useEffect(() => {
    if (clickTextRef.current) {
      textScrambleRef.current = new TextScramble(clickTextRef.current)
    }
  }, [])

  const handleCrystalClick = () => {
    if (hasClicked) return
    setHasClicked(true)

    // "CLICK TO CRYSTALLISE" text scrambles then reveals input placeholder
    if (textScrambleRef.current) {
      textScrambleRef.current.setText('WHAT DO YOU WANT TO RESEARCH?').then(() => {
        setTimeout(() => {
          setShowInput(true)
        }, 300)
      })
    }

    // Set crystal state to CHARGING
    setCrystalState('CHARGING')
  }

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setQuestion(inputValue.trim())
      // Transition to next scene would happen here
    }
  }

  const canShowUI = scrollProgress.current >= 0.95

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <TundraScene scrollProgress={scrollProgress} targetProgress={targetProgress} />
      
      <ProjectTagPill />
      
      {canShowUI && !showInput && (
        <div
          ref={clickTextRef}
          onClick={handleCrystalClick}
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            letterSpacing: '6px',
            color: '#4a5060',
            opacity: 0.7,
            cursor: 'pointer',
            zIndex: 20,
            transition: 'opacity 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.7'}
        >
          CLICK TO CRYSTALLISE
        </div>
      )}
      
      {canShowUI && showInput && (
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            zIndex: 20,
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="WHAT DO YOU WANT TO RESEARCH?"
            style={{
              width: '480px',
              fontSize: '14px',
              fontFamily: "'JetBrains Mono', monospace",
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#1a1e28',
              padding: '8px 0',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              background: 'transparent',
              border: '1px solid #4a5060',
              color: '#4a5060',
              padding: '8px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(74, 80, 96, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
            }}
          >
            CRYSTALLISE →
          </button>
        </div>
      )}
    </div>
  )
}
