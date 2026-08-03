import { useRef, useEffect } from 'react'

export function useScrollCamera(onThreshold, onLeaveThreshold, disabled) {

  const scrollProgress = useRef(0)
  const targetProgress = useRef(0)
  
  useEffect(() => {
    const handleWheel = (e) => {

      if (disabled?.current) return

  // Normalize between trackpad and mouse wheel
      const delta = Math.abs(e.deltaY) > 50
        ? Math.sign(e.deltaY) * 0.014   // mouse wheel: large steps
        : e.deltaY * 0.0001             // trackpad: small steps
    
      targetProgress.current = Math.max(0, Math.min(1,
        targetProgress.current + delta
      ))
      // Trigger callback when crossing 0.92 upward
      if (targetProgress.current >= 0.92 && onThreshold) {
        onThreshold()
      }
      // Trigger callback when crossing 0.88 downward (hysteresis)
      if (targetProgress.current < 0.88 && onLeaveThreshold) {
        onLeaveThreshold()
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [onThreshold, onLeaveThreshold])
  
  return { scrollProgress, targetProgress }
}
