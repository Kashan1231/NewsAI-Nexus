import express from 'express'
import pool from '../db/pool.js'
import { sendDigestEmail } from '../services/brevo.js'

const router = express.Router()

// GET /api/newsletter/stats — lightweight admin check
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status = 'active')          AS active,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS new_this_week
      FROM newsletter_subscribers
    `)
    res.json({ stats: rows[0] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/newsletter/unsubscribe — mark subscriber as inactive
router.post('/unsubscribe', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  try {
    await pool.query(
      `UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE email = $1`,
      [email.toLowerCase().trim()]
    )
    res.json({ success: true, message: "You've been unsubscribed." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/newsletter/send-digest — future: trigger an AI digest to all active subscribers
// Protect this with an internal secret in production
router.post('/send-digest', async (req, res) => {
  const { secret, subject, htmlContent } = req.body

  if (secret !== process.env.DIGEST_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  if (!subject || !htmlContent) {
    return res.status(400).json({ error: 'subject and htmlContent are required' })
  }

  try {
    const { rows } = await pool.query(
      `SELECT email FROM newsletter_subscribers WHERE status = 'active'`
    )
    const emails = rows.map(r => r.email)

    if (emails.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No active subscribers' })
    }

    const result = await sendDigestEmail(subject, htmlContent, emails)
    res.json({ success: true, sent: emails.length, result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
