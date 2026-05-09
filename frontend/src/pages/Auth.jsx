import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import './Auth.css'

const initialErrors = { name: '', email: '', password: '', resetToken: '', confirmPassword: '' }

const FEATURES = [
  { icon: '🛒', title: 'Buy & Sell', desc: 'Trade items with your campus community instantly' },
  { icon: '💬', title: 'Real-time Chat', desc: 'Message sellers directly within listings' },
  { icon: '⚡', title: 'Urgent Boost', desc: 'Mark listings urgent for faster visibility' },
  { icon: '⭐', title: 'Premium Listings', desc: 'Stand out with premium placement' },
  { icon: '🔒', title: 'Secure Auth', desc: 'JWT-powered secure campus access' },
  { icon: '📸', title: 'Photo Uploads', desc: 'Multi-image listings with drag & drop' },
]

const STATS = [
  { value: '500+', label: 'Active Listings', icon: '🛍️' },
  { value: '1K+', label: 'Students', icon: '🎓' },
  { value: 'Free', label: 'Always', icon: '✦' },
]

export default function Auth() {
  const { user, login, signup, requestPasswordReset, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState(initialErrors)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const incomingToken = params.get('resetToken')
    const incomingEmail = params.get('email')
    if (location.pathname === '/signup') { setMode('signup'); return }
    if (location.pathname === '/forgot') { setMode('forgot'); return }
    if (location.pathname === '/login' || location.pathname === '/') setMode('login')
    if (incomingToken && incomingEmail) { setMode('reset'); setEmail(incomingEmail); setResetToken(incomingToken) }
  }, [location.pathname])

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    setFieldErrors(initialErrors)
  }, [mode])

  useEffect(() => {
    if (location.pathname === '/') navigate('/login', { replace: true })
  }, [location.pathname, navigate])

  const title = useMemo(() => {
    if (mode === 'signup') return 'Create Account'
    if (mode === 'forgot') return 'Reset Password'
    if (mode === 'reset') return 'New Password'
    return 'Welcome back'
  }, [mode])

  const subtext = useMemo(() => {
    if (mode === 'signup') return 'Join your campus marketplace today'
    if (mode === 'forgot') return 'Enter your email to receive a reset link'
    if (mode === 'reset') return 'Set your new password below'
    return 'Sign in with your college email'
  }, [mode])

  const validate = () => {
    const next = { ...initialErrors }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const safeEmail = email.trim()
    if (mode === 'signup') {
      if (!name.trim()) next.name = 'Name is required'
      if (!safeEmail) next.email = 'Email is required'
      else if (!emailRe.test(safeEmail)) next.email = 'Enter a valid email'
      if (!password.trim()) next.password = 'Password is required'
      else if (password.length < 8) next.password = 'Min 8 characters'
    } else if (mode === 'reset') {
      if (!safeEmail) next.email = 'Email is required'
      if (!resetToken.trim()) next.resetToken = 'Token is required'
      if (!password.trim()) next.password = 'Password is required'
      else if (password.length < 8) next.password = 'Min 8 characters'
      if (!confirmPassword.trim()) next.confirmPassword = 'Confirm your password'
      else if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    } else if (mode === 'forgot') {
      if (!safeEmail) next.email = 'Email is required'
      else if (!emailRe.test(safeEmail)) next.email = 'Enter a valid email'
    } else {
      if (!safeEmail) next.email = 'Email is required'
      else if (!emailRe.test(safeEmail)) next.email = 'Enter a valid email'
      if (!password.trim()) next.password = 'Password is required'
      else if (password.length < 8) next.password = 'Min 8 characters'
    }
    setFieldErrors(next)
    return Object.values(next).every(v => !v)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email, password })
        toast.success('Welcome back!')
      } else if (mode === 'signup') {
        await signup({ name, email, password })
        toast.success('Account created! Welcome to CampusKart 🎉')
      } else if (mode === 'reset') {
        await resetPassword({ email, token: resetToken, password })
        toast.success('Password updated! You are now signed in.')
      } else {
        const result = await requestPasswordReset(email)
        toast.info(result?.message || 'If the account exists, a reset link has been sent.')
        if (result?.resetLink) toast.info(`Dev link: ${result.resetLink}`, 8000)
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-root">
      {/* Animated background orbs */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      <div className="auth-split">
        {/* Left panel — branding */}
        <aside className="auth-left">
          <div className="auth-left__brand">
            <p className="auth-left__eyebrow"><span className="auth-left__eyebrow-icon">✦</span> Campus Marketplace</p>
            <h2 className="auth-left__title">CampusKart</h2>
            <p className="auth-left__tag">Trade smarter within your campus community.</p>
          </div>

          <div className="auth-features">
            {FEATURES.map((f) => (
              <div className="auth-feature-card" key={f.title}>
                <span className="auth-feature-card__icon">{f.icon}</span>
                <div>
                  <p className="auth-feature-card__title">{f.title}</p>
                  <p className="auth-feature-card__desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-left__stats" aria-label="Marketplace stats">
            {STATS.map((stat) => (
              <button type="button" key={stat.label} className="auth-stat-card">
                <span className="auth-stat-card__icon icon icon-lg">{stat.icon}</span>
                <span className="auth-stat-card__value">{stat.value}</span>
                <span className="auth-stat-card__label">{stat.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Right panel — form */}
        <section className="auth-right" aria-labelledby="auth-heading">
          <div className="auth-right__inner">
            <div className="auth-right__header">
              <h1 id="auth-heading" className="auth-right__title">{title}</h1>
              <p className="auth-right__sub">{subtext}</p>
            </div>

            {/* Mode tabs */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="auth-tabs" role="tablist">
                <button
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </button>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-name">Full Name</label>
                  <input
                    id="auth-name"
                    className={`auth-input ${fieldErrors.name ? 'auth-input--error' : ''}`}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'err-name' : undefined}
                  />
                  {fieldErrors.name && <span id="err-name" className="auth-field-error">{fieldErrors.name}</span>}
                </div>
              )}

              {mode === 'reset' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-token">Reset Token</label>
                  <input
                    id="auth-token"
                    className={`auth-input ${fieldErrors.resetToken ? 'auth-input--error' : ''}`}
                    type="text"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    placeholder="Token from reset link"
                    autoComplete="one-time-code"
                    aria-invalid={!!fieldErrors.resetToken}
                  />
                  {fieldErrors.resetToken && <span className="auth-field-error">{fieldErrors.resetToken}</span>}
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  className={`auth-input ${fieldErrors.email ? 'auth-input--error' : ''}`}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
              </div>

              {mode !== 'forgot' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-password">
                    {mode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      id="auth-password"
                      className={`auth-input ${fieldErrors.password ? 'auth-input--error' : ''}`}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'reset' ? 'New password' : '8+ characters'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      aria-invalid={!!fieldErrors.password}
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="icon icon-md">{showPassword ? '🙈' : '👁️'}</span>
                    </button>
                  </div>
                  {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
                </div>
              )}

              {mode === 'reset' && (
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-confirm">Confirm Password</label>
                  <input
                    id="auth-confirm"
                    className={`auth-input ${fieldErrors.confirmPassword ? 'auth-input--error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                  {fieldErrors.confirmPassword && <span className="auth-field-error">{fieldErrors.confirmPassword}</span>}
                </div>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="auth-forgot-row">
                  <button type="button" className="auth-link" onClick={() => navigate('/forgot')}>
                    Forgot password?
                  </button>
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading} aria-busy={loading}>
                {loading ? (
                  <span className="auth-submit__loading">
                    <span className="spinner" />
                    Working...
                  </span>
                ) : (
                  mode === 'signup' ? 'Create Account →' :
                  mode === 'forgot' ? 'Send Reset Link →' :
                  mode === 'reset' ? 'Update Password →' : 'Sign In →'
                )}
              </button>

              {(mode === 'login' || mode === 'signup') && (
                <div className="auth-secondary-actions">
                  <button type="button" className="auth-secondary-link" onClick={() => navigate('/forgot')}>
                    Forgot Password
                  </button>
                </div>
              )}
            </form>

            <div className="auth-switch">
              {(mode === 'forgot' || mode === 'reset') ? (
                <p>Remembered it? <button className="auth-link" onClick={() => navigate('/login')}>Back to login</button></p>
              ) : mode === 'signup' ? (
                <p>Already have an account? <button className="auth-link" onClick={() => navigate('/login')}>Sign in</button></p>
              ) : (
                <p>New here? <button className="auth-link" onClick={() => navigate('/signup')}>Create account</button></p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}