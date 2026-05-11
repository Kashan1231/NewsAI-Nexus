import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import pool from '../db/pool.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import { addContactToBrevo, sendWelcomeEmail, sendPasswordResetEmail } from '../services/brevo.js'

const router = express.Router()

// 4. Auth Limiters (Stricter windows)
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.'
})

const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many reset requests. Please check your email or try again in 15 minutes.'
})

// SIGNUP
router.post('/signup', loginLimiter, async (req, res) => {
  const { email, password, fullName } = req.body

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Account already exists with this email' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, username, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, email, full_name`,
      [email.toLowerCase(), hashedPassword, fullName, email.split('@')[0]]
    )

    const user = result.rows[0]

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// LOGIN
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET PROFILE
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query(
      'SELECT id, email, full_name, username, created_at FROM users WHERE id = $1',
      [decoded.userId]
    )

    res.json({ user: result.rows[0] })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})

// FORGOT PASSWORD - Request Reset
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists, but user wants to see error in MVP
      return res.status(404).json({ error: 'No account found with this email' })
    }

    const userId = userResult.rows[0].id
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Hash the token so we don't store the raw secret in DB
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiry = new Date(Date.now() + 3600000) // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expiry = $2 WHERE id = $3',
      [tokenHash, expiry, userId]
    )

    // Send real email via Brevo
    await sendPasswordResetEmail(email.toLowerCase().trim(), resetToken)

    res.json({ success: true, message: 'Recovery email sent' })
  } catch (err) {
    console.error('[Forgot Password] Error:', err.message)
    res.status(500).json({ error: 'Failed to process request' })
  }
})

// RESET PASSWORD - Apply New Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password required' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const result = await pool.query(
      `SELECT id FROM users 
       WHERE reset_token = $1 AND reset_expiry > NOW()`,
      [tokenHash]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' })
    }

    const userId = result.rows[0].id
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and clear token
    await pool.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, userId]
    )

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    console.error('[Reset Password] Error:', err.message)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})


// NEWSLETTER SUBSCRIBE
router.post('/subscribe', async (req, res) => {
  const { email } = req.body
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required' })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // 1. Save to DB (dedup via ON CONFLICT)
    const { rowCount } = await pool.query(
      `INSERT INTO newsletter_subscribers (email, created_at)
       VALUES ($1, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [normalizedEmail]
    )

    const isNew = rowCount > 0

    if (!isNew) {
      return res.json({
        success: true,
        message: "You're already subscribed! We'll keep you in the loop."
      })
    }

    // 2. Add to Brevo contact list (non-fatal if Brevo fails)
    try {
      await addContactToBrevo(normalizedEmail)
    } catch (brevoErr) {
      console.error('[Subscribe] Brevo contact add failed (non-fatal):', brevoErr.message)
    }

    // 3. Send welcome email (non-fatal if it fails)
    try {
      await sendWelcomeEmail(normalizedEmail)
    } catch (emailErr) {
      console.error('[Subscribe] Welcome email failed (non-fatal):', emailErr.message)
    }

    res.json({
      success: true,
      message: "Welcome aboard! Check your inbox for a confirmation email."
    })
  } catch (err) {
    console.error('[Subscribe] DB error:', err.message)
    res.status(500).json({ error: 'Subscription failed. Please try again.' })
  }
})

export default router