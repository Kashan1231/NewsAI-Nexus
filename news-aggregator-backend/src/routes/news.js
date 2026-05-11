import express from 'express'
import pool from '../db/pool.js'
import { fetchAndStoreNews } from '../services/fetchNews.js'

const router = express.Router()

router.get('/fetch', async (req, res) => {
  try {
    // Basic protection: Only allow internal/admin calls via a secret header
    const secret = req.headers['x-internal-secret']
    if (process.env.DIGEST_SECRET && secret !== process.env.DIGEST_SECRET) {
      return res.status(403).json({ error: 'Unauthorized: Internal ingestion only' })
    }

    const result = await fetchAndStoreNews()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get Trending News
router.get('/trending', async (req, res) => {
  try {
    // 1. Try recent trending (7 days)
    let { rows } = await pool.query(
      `SELECT * FROM articles 
       WHERE published_at > NOW() - INTERVAL '7 days'
       ORDER BY (view_count * 5 + save_count * 10) DESC, published_at DESC 
       LIMIT 10`
    )

    // 2. Fallback to all-time if needed
    if (rows.length < 5) {
      const { rows: fallback } = await pool.query(
        `SELECT * FROM articles 
         ORDER BY (view_count * 5 + save_count * 10) DESC, published_at DESC 
         LIMIT 10`
      )
      rows = fallback
    }

    res.json({ articles: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


export default router