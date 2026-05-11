import express from 'express'
import pool from '../db/pool.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// Get saved articles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.id, a.* FROM saved_articles s
       JOIN articles a ON s.article_id = a.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [req.user.userId]
    )
    res.json({ saved: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Save article
router.post('/', authMiddleware, async (req, res) => {
  const { article_id } = req.body
  try {
    await pool.query(
      `INSERT INTO saved_articles (user_id, article_id, created_at)
       VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
      [req.user.userId, article_id]
    )
    // Update save_count for trending
    await pool.query(
      'UPDATE articles SET save_count = save_count + 1 WHERE id = $1',
      [article_id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Unsave article
router.delete('/', authMiddleware, async (req, res) => {
  const { article_id } = req.body
  try {
    await pool.query(
      'DELETE FROM saved_articles WHERE user_id = $1 AND article_id = $2',
      [req.user.userId, article_id]
    )
    // Decrement save_count
    await pool.query(
      'UPDATE articles SET save_count = GREATEST(save_count - 1, 0) WHERE id = $1',
      [article_id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router