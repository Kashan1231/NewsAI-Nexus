import cron from 'node-cron'
import pool from '../db/pool.js'
import { fetchAndStoreNews } from './fetchNews.js'

export function initCronJobs() {
  console.log('⏰ Initializing NewsAI Cron Jobs...')

  // Fetch news every 20 minutes (Staggered variety)
  cron.schedule('*/20 * * * *', async () => {


    console.log('🗞️ Running scheduled news fetch...')
    try {
      const result = await fetchAndStoreNews()
      console.log(`✅ Cron Fetch Complete: ${result.savedCount} saved, ${result.skippedCount} skipped.`)
    } catch (err) {
      console.error('❌ Cron Fetch Failed:', err.message)
    }
  })

  // Update trending scores every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('📈 Updating trending scores...')
    try {
      await pool.query(`
        UPDATE articles 
        SET trending_score = (view_count * 1.0) + (save_count * 5.0)
        WHERE published_at > NOW() - INTERVAL '3 days'
      `)
      console.log('✅ Trending scores updated.')
    } catch (err) {
      console.error('❌ Trending score update failed:', err.message)
    }
  })

  // Optional: Run a cleanup job
  cron.schedule('0 0 * * *', () => {
    console.log('🧹 Running daily maintenance...')
  })
}
