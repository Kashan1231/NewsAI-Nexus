import express from 'express'
import pool from '../db/pool.js'
import Groq from 'groq-sdk'
import { createRateLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

// 3. Ask AI Limiter (8 req / 1 min)
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 8,
  message: 'AI inquiry limit reached. Please wait a minute before asking more questions.'
})

router.use(aiLimiter)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ASK AI about a specific article
router.post('/ask/:articleId', async (req, res) => {
  const { articleId } = req.params
  const { question } = req.body

  if (!question) return res.status(400).json({ error: 'Question is required' })

  try {
    const { rows } = await pool.query(
      'SELECT title, description, summary FROM articles WHERE id = $1',
      [articleId]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Article not found' })

    const article = rows[0]
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an AI news assistant. Answer questions based on the article provided.' },
        { role: 'user', content: `Article Title: ${article.title}\nContent: ${article.description}\nSummary: ${article.summary}\n\nQuestion: ${question}` }
      ]
    })

    res.json({ answer: completion.choices[0].message.content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET RELATED ARTICLES based on embedding similarity
router.get('/related/:articleId', async (req, res) => {
  const { articleId } = req.params
  try {
    const { rows: current } = await pool.query(
      'SELECT embedding FROM articles WHERE id = $1',
      [articleId]
    )
    if (current.length === 0 || !current[0].embedding) {
      return res.json({ related: [] })
    }

    const { rows: related } = await pool.query(
      `SELECT id, title, description, url, image_url, source, category, published_at,
       1 - (embedding <=> $1::vector) AS similarity
       FROM articles
       WHERE id != $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 4`,
      [current[0].embedding, articleId]
    )

    res.json({ related })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
