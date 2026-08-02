import { useRef, useState, useEffect } from 'react'
import { gsap } from 'gsap'
import CrystalScene from '../components/crystal/CrystalScene'
import RingText from '../components/ui/RingText'
import ProjectTagPill from '../components/ui/ProjectTagPill'
import { TextScramble } from '../utils/textScramble'
import useAtlasStore from '../store/atlasStore'

export default function EntryScene() {
  const chromaticRef = useRef()
  const [hasClicked, setHasClicked] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const clickTextRef = useRef()
  const textScrambleRef = useRef()
  const setQuestion = useAtlasStore((s) => s.setQuestion)
  const setCrystalState = useAtlasStore((s) => s.setCrystalState)

  useEffect(() => {
    if (clickTextRef.current) {
      textScrambleRef.current = new TextScramble(clickTextRef.current)
    }
  }, [])

  const handleCrystalClick = () => {
    if (hasClicked) return
    setHasClicked(true)

    // (a) Trigger chromatic aberration spike
    if (chromaticRef.current) {
      gsap.to(chromaticRef.current.offset, {
        x: 0.02,
        y: 0.02,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to(chromaticRef.current.offset, {
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'power2.out'
          })
        }
      })
    }

    // (b) RingText fades out
    const ringTextElement = document.querySelector('[data-ring-text]')
    if (ringTextElement) {
      gsap.to(ringTextElement, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out'
      })
    }

    // (c) "CLICK TO CRYSTALLISE" text scrambles then reveals input placeholder
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

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <CrystalScene ref={chromaticRef} />
      
      <div data-ring-text>
        <RingText />
      </div>
      
      <ProjectTagPill />
      
      {!showInput && (
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
      
      {showInput && (
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
