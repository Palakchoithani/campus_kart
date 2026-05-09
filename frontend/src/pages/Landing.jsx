import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DarkModeToggle from '../components/DarkModeToggle'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const heroRef = useRef(null)
  const glowRef = useRef(null)
  const mouseRefPos = useRef({ x: 0, y: 0 })
  const animationRef = useRef(null)
  const lastTrailRef = useRef(0)
  const [mouseTrails, setMouseTrails] = useState([])
  const [showGlow, setShowGlow] = useState(false)

  // RAF loop for smooth glow positioning
  const smoothGlowUpdate = () => {
    if (glowRef.current && showGlow && heroRef.current) {
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

  // Trail cleanup
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
    if (!heroRef.current) return

    const rect = heroRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    mouseRefPos.current = { x, y }

    const now = Date.now()
    if (now - lastTrailRef.current > 16) {
      setMouseTrails((prev) => {
        const newTrail = {
          x,
          y,
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

  const handleExploreClick = () => {
    navigate(user ? '/home' : '/auth')
  }

  const landingActions = [
    {
      icon: '🔍',
      title: 'Browse Listings',
      description: 'Explore verified items from your campus community.',
      onClick: () => navigate(user ? '/home' : '/auth'),
    },
    {
      icon: '💬',
      title: 'Messages',
      description: 'Connect and negotiate with other campus members.',
      onClick: () => navigate(user ? '/inbox' : '/auth'),
    },
    {
      icon: '✏️',
      title: 'Add Listing',
      description: 'Post items you want to sell or trade quickly.',
      onClick: () => navigate(user ? '/create' : '/auth'),
    },
  ]

  return (
    <div className="home-landing" onMouseMove={handleMouseMove}>
      {/* Navbar */}
      <nav className="navbar navbar--landing">
        <div className="navbar__brand">
          <span className="navbar__eyebrow">Campus Node</span>
          <span className="navbar__logo">CampusKart</span>
        </div>

        <div className="navbar__nav">
          {user && (
            <>
              <button className="nav-tab" onClick={() => navigate('/home')}>
                Browse
              </button>
              <button className="nav-tab" onClick={() => navigate('/inbox')}>
                Inbox
              </button>
            </>
          )}
        </div>

        <div className="navbar__meta">
          {user && (
            <span className="navbar__user">{user.name || user.email}</span>
          )}
          <DarkModeToggle />
          {user && (
            <button className="logout-btn" onClick={() => navigate('/auth')}>
              Logout
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="home-hero"
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background Effects */}
        <div className="hero-background-gradient" />

        {/* Cursor Spotlight */}
        <div
          ref={glowRef}
          className="hero-glow"
          style={{
            transform: 'translate(-50%, -50%)',
            opacity: showGlow ? 1 : 0,
            transition: 'opacity 200ms ease-out',
            pointerEvents: 'none',
          }}
        />

        {/* Mouse Trails */}
        <div className="hero-trails">
          {mouseTrails.map((trail, idx) => {
            const age = Date.now() - trail.createdAt
            const maxAge = 280
            const progress = Math.min(age / maxAge, 1)
            const opacity = Math.max(0, (1 - progress) * 0.8 * (1 - idx * 0.14))

            return (
              <div
                key={trail.id}
                className="hero-trail"
                style={{
                  left: `${trail.x}px`,
                  top: `${trail.y}px`,
                  transform: 'translate(-50%, -50%)',
                  opacity,
                  willChange: 'opacity',
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </div>

        {/* Hero Content */}
        <div className="home-hero__stage">
          <div className="home-hero__content">
            <div className="home-hero__eyebrow">
              ✨ Premium Campus Marketplace
            </div>

            <h1 className="home-hero__title">
              Campus
              <br />
              Marketplace
            </h1>

            <p className="home-hero__subtitle">
              Buy, sell, and trade within your college network. Find what you need
              and post what you don't.
            </p>

            <div className="home-hero__actions">
              <button className="home-hero__explore-btn" onClick={handleExploreClick}>
                <span>Explore</span>
                <span className="explore-arrow">→</span>
              </button>
            </div>

            <div className="home-hero__quick-stats">
              <span>✓ Verified Members</span>
              <span>⚡ Instant Messaging</span>
              <span>🎓 Campus Verified</span>
            </div>
          </div>

          <div className="home-hero__visual">
            <div className="campus-card">
              <div className="campus-card__topline">
                <span className="campus-card__label">Campus Node</span>
                <span className="campus-card__status">LIVE</span>
              </div>

              <div className="campus-card__icon">🏫</div>

              <h2 className="campus-card__title">Campus Network</h2>

              <p className="campus-card__copy">
                Connect with verified students on your campus. Trade, buy, and sell
                with confidence in your trusted community.
              </p>

              <div className="campus-card__metrics">
                <div>
                  <strong>24/7</strong>
                  <span>Marketplace Active</span>
                </div>
                <div>
                  <strong>Neon</strong>
                  <span>Premium Focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <div className="home-shell-wrap">
        <div className="home-action-strip">
          <div className="home-action-strip__grid">
            {landingActions.map((action, idx) => (
              <button key={idx} className="feature-card" onClick={action.onClick}>
                <span className="feature-card__icon">{action.icon}</span>
                <span className="feature-card__title">{action.title}</span>
                <span className="feature-card__copy">{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
