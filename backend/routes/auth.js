const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { verifyToken } = require('../middleware/auth')
const User = require('../models/User')

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:5173'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isStrongPassword(password) {
  return typeof password === 'string' && password.trim().length >= 8
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    collegeName: user.collegeName,
    location: user.location,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    ratingAverage: user.ratingAverage,
    ratingCount: user.ratingCount,
  }
}

router.post('/signup', async (req, res) => {
  const {
    email,
    password,
    name = '',
    collegeName = '',
    location = '',
    avatarUrl = '',
    bio = '',
  } = req.body
  
  const normalizedEmail = normalizeEmail(email)
  const trimmedName = String(name || '').trim()

  if (!trimmedName) {
    return res.status(400).json({ error: 'Name is required' })
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' })
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10)
    
    const newUser = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      passwordHash: hashed,
      collegeName,
      location,
      avatarUrl,
      bio,
    })

    // Generate JWT
    const token = jwt.sign({ id: newUser._id.toString(), email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' })

    return res.status(201).json({
      token,
      user: serializeUser(newUser),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Signup failed' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  const normalizedEmail = normalizeEmail(email)

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  if (!password || !String(password).trim()) {
    return res.status(400).json({ error: 'Password is required' })
  }

  try {
    // Find user
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    return res.json({
      token,
      user: serializeUser(user),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  const normalizedEmail = normalizeEmail(email)

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  try {
    const user = await User.findOne({ email: normalizedEmail })

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex')
      user.passwordResetTokenHash = hashResetToken(resetToken)
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)
      await user.save()

      const resetLink = `${FRONTEND_URL}/?resetToken=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`

      return res.json({
        message: 'If an account exists, a reset link has been generated.',
        ...(process.env.NODE_ENV !== 'production' ? { resetLink } : {}),
      })
    }

    return res.json({ message: 'If an account exists, a reset link has been generated.' })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to request password reset' })
  }
})

router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body
  const normalizedEmail = normalizeEmail(email)

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address' })
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Reset token is required' })
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' })
  }

  try {
    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetTokenHash: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({ error: 'Reset token is invalid or expired' })
    }

    user.passwordHash = await bcrypt.hash(password, 10)
    user.passwordResetTokenHash = ''
    user.passwordResetExpires = null
    await user.save()

    const authToken = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    return res.json({
      message: 'Password updated successfully',
      token: authToken,
      user: serializeUser(user),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password' })
  }
})

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ user: serializeUser(user) })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load user' })
  }
})

module.exports = router