import express from 'express'
import pool from '../db/pool.js'
import { createRateLimiter } from '../middleware/rateLimiter.js'
import { getEmbedding } from '../services/embeddings.js'
import { understandQuery, rerankArticles } from '../services/groqAnalysis.js'

const router = express.Router()

// 2. Search Limiter (25 req / 1 min)
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  message: 'Search limit reached. Please search more slowly.'
})

router.use(searchLimiter)

router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) return res.json({ articles: [] })

    // Step 1: Understand query
    const understood = await understandQuery(q)
    
    // Gibberish / Nonsense Gate
    if (understood.is_gibberish) {
      console.log(`🚫 Gibberish query detected: "${q}". Returning empty results.`)
      return res.json({ articles: [], type: 'hybrid', note: 'Nonsense query' })
    }

    const expandedQuery = understood.expanded_query || q
    const contextKeywords = Array.isArray(understood.contextual_keywords) ? understood.contextual_keywords.join(' ') : (understood.contextual_keywords || '')
    const embedding = await getEmbedding(`${expandedQuery} ${understood.context_domain || ''}`)
    
    const isExploratory = understood.is_exploratory || false
    const specificity = understood.specificity || 5
    const targetCategory = understood.suggested_category

    // Tighter thresholds for precision
    const semanticThreshold = isExploratory ? 0.32 : (specificity >= 7 ? 0.45 : 0.38)
    const minSearchScore = isExploratory ? 0.05 : 0.15

    let { rows: articles } = await pool.query(
      `WITH semantic_search AS (
        SELECT id, 
               1 - (embedding <=> $2::vector) AS rank,
               (CASE WHEN category = $6 THEN 1.2 ELSE 0.7 END) AS context_multiplier
        FROM articles
        WHERE embedding IS NOT NULL
        AND 1 - (embedding <=> $2::vector) > $4
        ORDER BY embedding <=> $2::vector
        LIMIT 60
      ),
      keyword_search AS (
        SELECT id, 
               ts_rank_cd(search_vector, websearch_to_tsquery('english', $1)) * 2.0 + 
               (CASE WHEN title ILIKE $3 THEN 3.0 ELSE 0 END) +
               (CASE WHEN category = $6 THEN 1.5 ELSE -2.0 END) AS rank -- Penalty for wrong category
        FROM articles
        WHERE (search_vector @@ websearch_to_tsquery('english', $1) OR title ILIKE $3)
        LIMIT 60
      )
      SELECT a.id, a.title, a.description, a.summary, a.url, a.image_url, a.source, 
             a.category, a.sentiment, a.bias_score, a.published_at,
             (COALESCE(s.rank, 0) * COALESCE(s.context_multiplier, 1) * 0.5) + 
             (COALESCE(k.rank, 0) * 0.5) AS search_score
      FROM articles a
      LEFT JOIN semantic_search s ON a.id = s.id
      LEFT JOIN keyword_search k ON a.id = k.id
      WHERE (s.id IS NOT NULL OR k.id IS NOT NULL)
      AND ((COALESCE(s.rank, 0) * 0.5) + (COALESCE(k.rank, 0) * 0.5)) > $5
      ORDER BY search_score DESC
      LIMIT 25`,
      [q, `[${embedding.join(',')}]`, `%${q}%`, semanticThreshold, minSearchScore, targetCategory]
    )

    // Stage 2: Intelligent Expansion (Only if results are truly low)
    if (articles.length < 3 && understood.contextual_keywords) {
      console.log(`[Search] Precision pass low (${articles.length}). Attempting contextual expansion...`)
      const { rows: expanded } = await pool.query(
        `SELECT a.id, a.title, a.description, a.summary, a.url, a.image_url, a.source, 
                a.category, a.sentiment, a.bias_score, a.published_at,
                (ts_rank_cd(search_vector, plainto_tsquery('english', $1)) * 1.5) AS search_score
         FROM articles a
         WHERE search_vector @@ plainto_tsquery('english', $1)
         AND category = $2 -- Lock to target category for expansion
         LIMIT 15`,
        [contextKeywords, targetCategory]
      )
      
      // Filter out duplicates
      const existingIds = new Set(articles.map(a => a.id))
      const uniqueExpanded = expanded.filter(a => !existingIds.has(a.id))
      articles = [...articles, ...uniqueExpanded]
    }

    // Final AI Reranking for human-level precision
    if (articles.length > 0) {
      articles = await rerankArticles(q, articles)
    }

    res.json({ articles: articles || [], type: 'hybrid' })





  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ suggestions: [] })

  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT title 
       FROM articles 
       WHERE title ILIKE $1 
       LIMIT 5`,
      [`%${q}%`]
    )
    res.json({ suggestions: rows.map(r => r.title) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router