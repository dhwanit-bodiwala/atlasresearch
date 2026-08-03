import { useRef, useEffect } from 'react'

export function useScrollCamera() {
  const scrollProgress = useRef(0)
  const targetProgress = useRef(0)
  
  useEffect(() => {
    const handleWheel = (e) => {
  // Normalize between trackpad and mouse wheel
      const delta = Math.abs(e.deltaY) > 50
        ? Math.sign(e.deltaY) * 0.014   // mouse wheel: large steps
        : e.deltaY * 0.0001             // trackpad: small steps
    
      targetProgress.current = Math.max(0, Math.min(1,
        targetProgress.current + delta
      ))
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])
  
  return { scrollProgress, targetProgress }
}
