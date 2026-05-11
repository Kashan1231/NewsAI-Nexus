import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import pool from './db/pool.js'
import authRoutes from './routes/auth.js'
import articleRoutes from './routes/articles.js'
import searchRoutes from './routes/search.js'
import savedRoutes from './routes/saved.js'
import newsRoutes from './routes/news.js'
import aiRoutes from './routes/ai.js'
import personalizationRoutes from './routes/personalization.js'
import newsletterRoutes from './routes/newsletter.js'
import { initCronJobs } from './services/cron.js'

const app = express()

// Initialize background jobs
initCronJobs()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())

// Rate Limiters
import { createRateLimiter } from './middleware/rateLimiter.js'

// 1. General API Limiter (100 req / 1 min)
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  message: 'General API limit reached. Slow down!'
})
app.use(generalLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/saved', savedRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/personalization', personalizationRoutes)
app.use('/api/newsletter', newsletterRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'NewsAI Backend Running!' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ DB Connection Failed:', err.message, err.code, err)
  } else {
    console.log('✅ DB Connected:', res.rows[0].now)
  }
})

export default app