import { useEffect, useRef } from 'react'
import EntryScene from './scenes/EntryScene'

export default function App() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    const onMove = (e) => {
      cursor.style.left = `${e.clientX}px`
      cursor.style.top = `${e.clientY}px`
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        className="cursor"
        style={{
          position: 'fixed',
          width: 6,
          height: 6,
          background: '#4fc3f7',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)',
          left: 0,
          top: 0,
        }}
      />
      <EntryScene />
    </>
  )
}
