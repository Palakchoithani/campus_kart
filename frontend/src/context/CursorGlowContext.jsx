import { createContext, useContext, useState, useRef, useEffect } from 'react'

const CursorGlowContext = createContext(null)

export function CursorGlowProvider({ children }) {
  const [mouseTrails, setMouseTrails] = useState([])
  const [showGlow, setShowGlow] = useState(false)
  const glowRef = useRef(null)
  const mouseRefPos = useRef({ x: 0, y: 0 })
  const animationRef = useRef(null)
  const lastTrailRef = useRef(0)

  // Smooth animation loop using requestAnimationFrame
  const smoothGlowUpdate = () => {
    if (glowRef.current && showGlow) {
      const { x, y } = mouseRefPos.current
      glowRef.current.style.left = `${x}px`
      glowRef.current.style.top = `${y}px`
    }
    animationRef.current = requestAnimationFrame(smoothGlowUpdate)
  }

  useEffect(() => {
    animationRef.current = requestAnimationFrame(smoothGlowUpdate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [showGlow])

  // Clean up old trails
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setMouseTrails((prev) =>
        prev.filter((trail) => now - trail.createdAt < 280)
      )
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e
    mouseRefPos.current = { x: clientX, y: clientY }

    const now = Date.now()
    if (now - lastTrailRef.current > 16) {
      setMouseTrails((prev) => {
        const newTrail = {
          x: clientX,
          y: clientY,
          id: `${now}-${Math.random()}`,
          createdAt: now,
        }
        return [newTrail, ...prev.slice(0, 5)]
      })
      lastTrailRef.current = now
    }

    if (!showGlow) setShowGlow(true)
  }

  const handleMouseEnter = () => setShowGlow(true)
  const handleMouseLeave = () => {
    setShowGlow(false)
    setMouseTrails([])
  }

  return (
    <CursorGlowContext.Provider
      value={{
        glowRef,
        mouseTrails,
        showGlow,
        setShowGlow,
        handleMouseMove,
        handleMouseEnter,
        handleMouseLeave,
      }}
    >
      <div onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
        {/* Global Cursor Glow */}
        <div
          ref={glowRef}
          className="global-cursor-glow"
          style={{
            position: 'fixed',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 9999,
            opacity: showGlow ? 1 : 0,
            transition: 'opacity 200ms ease-out',
          }}
        />
        {/* Global Mouse Trails */}
        <div className="global-cursor-trails">
          {mouseTrails.map((trail, idx) => {
            const age = Date.now() - trail.createdAt
            const maxAge = 280
            const progress = Math.min(age / maxAge, 1)
            const opacity = Math.max(0, (1 - progress) * 0.8 * (1 - idx * 0.14))

            return (
              <div
                key={trail.id}
                className="global-cursor-trail"
                style={{
                  position: 'fixed',
                  left: `${trail.x}px`,
                  top: `${trail.y}px`,
                  transform: 'translate(-50%, -50%)',
                  opacity,
                  pointerEvents: 'none',
                  zIndex: 9998,
                }}
              />
            )
          })}
        </div>
      </div>
    </CursorGlowContext.Provider>
  )
}

export function useCursorGlow() {
  const context = useContext(CursorGlowContext)
  if (!context) {
    throw new Error('useCursorGlow must be used within CursorGlowProvider')
  }
  return context
}
