import express from 'express'
import pool from '../db/pool.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { category } = req.query

    let query = `SELECT id, title, description, url, image_url, source, 
                 category, sentiment, bias_score, summary, published_at 
                 FROM articles ORDER BY published_at DESC LIMIT 20`
    let params = []

    if (category) {
      query = `SELECT id, title, description, url, image_url, source,
               category, sentiment, bias_score, summary, published_at
               FROM articles WHERE category = $1 
               ORDER BY published_at DESC LIMIT 20`
      params = [category]
    }

    const { rows } = await pool.query(query, params)
    res.json({ articles: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router