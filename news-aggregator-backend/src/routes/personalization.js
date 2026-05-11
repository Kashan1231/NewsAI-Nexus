import express from 'express'
import pool from '../db/pool.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

// TRACK READ / CLICK / SEARCH
router.post('/track', authMiddleware, async (req, res) => {
  const { articleId, category, query } = req.body
  const userId = req.user.userId

  try {
    if (articleId) {
      // 1. Log reading history
      await pool.query(
        `INSERT INTO reading_history (user_id, article_id)
         VALUES ($1, $2) ON CONFLICT (user_id, article_id) DO UPDATE SET clicked_at = NOW()`,
        [userId, articleId]
      )

      // Increment view_count for trending
      await pool.query(
        'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
        [articleId]
      )

      // 2. Update user interests (bump weight for this category)
      if (category) {
        await pool.query(
          `INSERT INTO user_interests (user_id, category, weight)
           VALUES ($1, $2, 2.0)
           ON CONFLICT (user_id, category) 
           DO UPDATE SET weight = LEAST(user_interests.weight + 0.5, 15.0), updated_at = NOW()`,
          [userId, category]
        )
      }
    }

    if (query) {
      // 3. Log search history
      await pool.query(
        `INSERT INTO search_history (user_id, query) VALUES ($1, $2)`,
        [userId, query]
      )
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET "FOR YOU" FEED
router.get('/for-you', authMiddleware, async (req, res) => {
  const userId = req.user.userId

  try {
    // Get user interests
    const { rows: interests } = await pool.query(
      'SELECT category, weight FROM user_interests WHERE user_id = $1 ORDER BY weight DESC LIMIT 5',
      [userId]
    )

    // Get recent search terms
    const { rows: recentSearches } = await pool.query(
      'SELECT query FROM search_history WHERE user_id = $1 ORDER BY searched_at DESC LIMIT 5',
      [userId]
    )
    
    // Create a flexible search condition
    const searchTerms = recentSearches.map(s => s.query.trim()).filter(q => q.length > 2)
    const searchPattern = searchTerms.length > 0 ? `%(${searchTerms.join('|')})%` : '%none%'

    if (interests.length === 0 && searchTerms.length === 0) {
      const { rows } = await pool.query(
        'SELECT * FROM articles ORDER BY published_at DESC LIMIT 30'
      )
      return res.json({ articles: rows, type: 'general' })
    }

    // Personalized ranking query
    // Boosts:
    // 1. Category match (ui.weight)
    // 2. Search keyword match (SIMILAR TO regex)
    // 3. Trending score
    // 4. Recency (but with a softer decay)
    const { rows } = await pool.query(
      `SELECT a.*, 
       (
         1.0 + 
         COALESCE(ui.weight, 0) * 0.8 + 
         (CASE WHEN a.title SIMILAR TO $2 OR a.description SIMILAR TO $2 THEN 3.0 ELSE 0 END) +
         (a.trending_score * 0.2)
       ) * (1.0 - (EXTRACT(EPOCH FROM (NOW() - a.published_at)) / 864000)) AS rank_score
       FROM articles a
       LEFT JOIN user_interests ui ON a.category = ui.category AND ui.user_id = $1
       WHERE a.published_at > NOW() - INTERVAL '10 days'
       ORDER BY rank_score DESC
       LIMIT 40`,
      [userId, searchPattern]
    )

    res.json({ articles: rows, type: 'personalized' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET USER STATS
router.get('/stats', authMiddleware, async (req, res) => {
  const userId = req.user.userId
  try {
    const [readCount, savedCount, topInterests] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM reading_history WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*) FROM saved_articles WHERE user_id = $1', [userId]),
      pool.query('SELECT category, weight FROM user_interests WHERE user_id = $1 ORDER BY weight DESC LIMIT 3', [userId])
    ])

    res.json({
      reads: parseInt(readCount.rows[0].count),
      saved: parseInt(savedCount.rows[0].count),
      interests: topInterests.rows
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET READING HISTORY
router.get('/history', authMiddleware, async (req, res) => {
  const userId = req.user.userId
  try {
    const { rows } = await pool.query(
      `SELECT a.*, h.clicked_at
       FROM reading_history h
       JOIN articles a ON h.article_id = a.id
       WHERE h.user_id = $1
       ORDER BY h.clicked_at DESC
       LIMIT 30`,
      [userId]
    )
    res.json({ history: rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
