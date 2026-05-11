import { getEmbedding } from './embeddings.js'
import { analyzeArticle } from './groqAnalysis.js'
import pool from '../db/pool.js'
import axios from 'axios'
import Parser from 'rss-parser'

const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['media:content', 'mediaContent'],
    ],
  },
})




// Category mapping to keep things normalized
const CATEGORY_MAP = {
  'tech': 'technology',
  'science': 'science',
  'health': 'health',
  'sports': 'sports',
  'business': 'business',
  'entertainment': 'entertainment',
  'world': 'politics',
  'nation': 'politics',
}

// Only these 8 values are allowed in the DB. Everything else maps to 'general'.
const VALID_CATEGORIES = new Set(['politics','sports','entertainment','general','business','health','technology','science'])

function sanitizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return 'general'
  const lower = raw.trim().toLowerCase()
  // Direct match
  if (VALID_CATEGORIES.has(lower)) return lower
  // CATEGORY_MAP lookup
  if (CATEGORY_MAP[lower]) return CATEGORY_MAP[lower]
  // If the AI returned a compound like "politics/business", take the first token
  const first = lower.split(/[\/\|,{} ]+/).find(t => VALID_CATEGORIES.has(t.trim()))
  return first || 'general'
}

// Quality Filter Helpers
function isLowQuality(article) {
  const title = article.title || "";
  const desc = article.description || "";
  
  // 1. Filter out Gallery/Image variants (common in DVIDS)
  if (title.match(/\[Image \d+ of \d+\]/i)) return true;
  if (title.toLowerCase().match(/gallery|slideshow|photo collection|in pictures|pictures of/)) return true;
  if (desc.toLowerCase().match(/gallery|slideshow|photo collection/)) return true;

  
  // 2. Filter out noisy sources explicitly
  const noisySources = ['dvidshub', 'dvidshub.net', 'defense visual information distribution service'];
  if (noisySources.some(s => article.source.toLowerCase().includes(s))) return true;
  
  // 3. Length checks (Relaxed for high-authority sources)
  const authoritySources = [
    'bbc', 'reuters', 'guardian', 'ap', 'associated press', 
    'npr', 'cnbc', 'the verge', 'techcrunch', 'wired', 'phys.org', 'sciencedaily'
  ];
  const isAuthority = authoritySources.some(s => article.source.toLowerCase().includes(s));
  
  if (!isAuthority) {
    if (title.length < 20) return true;
    if (desc.length < 60) return true;
  }

  
  // 4. Content spam markers & Live blogs
  if (desc.includes("Subscribe to") || desc.includes("Sign up for")) {
    if (desc.length < 100) return true; // Only filter if it's mostly just a CTA
  }
  
  if (title.toLowerCase().includes("live update") || title.toLowerCase().includes("live blog")) {
    return true; // Live blogs often have broken/missing metadata
  }

  return false;
}

// Check if a URL looks like a direct image link
function isProperImage(url) {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || 
         cleanUrl.endsWith('.jpeg') || 
         cleanUrl.endsWith('.png') || 
         cleanUrl.endsWith('.webp') || 
         cleanUrl.endsWith('.avif') || 
         url.includes('unsplash.com');
}

function getHashIndex(str, max) {
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % max;
}

function getNormalizedTitle(title) {
  return title.toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Simple similarity check (word overlap)
function calculateSimilarity(t1, t2) {
  const words1 = new Set(getNormalizedTitle(t1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(getNormalizedTitle(t2).split(' ').filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}


export async function fetchAndStoreNews() {
  try {
    const fetchPromises = [
      // NewsAPI - US
      axios.get(`https://newsapi.org/v2/top-headlines?language=en&country=us&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`).catch(() => null),
      // NewsAPI - GB
      axios.get(`https://newsapi.org/v2/top-headlines?language=en&country=gb&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`).catch(() => null),
      // The Guardian
      axios.get(`https://content.guardianapis.com/search?show-fields=thumbnail,trailText&page-size=30&api-key=${process.env.GUARDIAN_API_KEY}`).catch(() => null),
      // NewsCatcher API (New)
      process.env.NEWSCATCHER_API_KEY ? 
        axios.get(`https://api.newscatcherapi.com/v2/latest_headlines?lang=en&limit=25`, {
          headers: { 'x-api-key': process.env.NEWSCATCHER_API_KEY }
        }).catch(() => null) : null,
      // RSS - Reuters
      parser.parseURL('https://www.reuters.com/rss/worldNews').catch(() => null),
      // RSS - The Verge (Tech)
      parser.parseURL('https://www.theverge.com/rss/index.xml').catch(() => null),
      // RSS - TechCrunch (Tech)
      parser.parseURL('https://techcrunch.com/feed/').catch(() => null),
      // RSS - Wired (Tech)
      parser.parseURL('https://www.wired.com/feed/rss').catch(() => null),
      // RSS - Phys.org (Science)
      parser.parseURL('https://phys.org/rss-feed/').catch(() => null),
      // RSS - NPR (General/US)
      parser.parseURL('https://feeds.npr.org/1001/rss.xml').catch(() => null),
      // RSS - CNBC (Business)
      parser.parseURL('https://search.cnbc.com/rs/search/view.rss?partnerId=2000&keywords=top+news').catch(() => null)
    ]







    const responses = await Promise.all(fetchPromises)
    const allArticles = []

    // 1. Process NewsAPI
    const newsApiData = [responses[0]?.data?.articles, responses[1]?.data?.articles].flat().filter(Boolean)
    newsApiData.forEach(a => {
      if (a.title && a.description) {
        const article = {
          title: a.title,
          description: a.description,
          url: a.url,
          image_url: a.urlToImage,
          source: a.source?.name || 'NewsAPI',
          published_at: a.publishedAt,
        }
        if (!isLowQuality(article)) allArticles.push(article)
      }
    })


    // 2. Process The Guardian
    const guardianData = responses[2]?.data?.response?.results || []
    guardianData.forEach(a => {
      if (a.webTitle && a.fields?.trailText) {
        const article = {
          title: a.webTitle,
          description: a.fields?.trailText,
          url: a.webUrl,
          image_url: a.fields?.thumbnail,
          source: 'The Guardian',
          published_at: a.webPublicationDate,
        }
        if (!isLowQuality(article)) allArticles.push(article)
      }
    })    // 3. Process NewsCatcher
    const newsCatcherData = responses[3]?.data?.articles || []
    newsCatcherData.forEach(a => {
      const article = {
        title: a.title,
        description: a.summary || a.excerpt,
        url: a.link,
        image_url: a.media,
        source: a.rights || a.author || 'NewsCatcher',
        published_at: a.published_date,
      }
      if (article.title && article.description && !isLowQuality(article)) {
        allArticles.push(article)
      }
    })

    // 4. Process RSS - BBC
    const bbcRss = responses[4]?.items || []
    bbcRss.forEach(item => {
      const article = {
        title: item.title,
        description: item.contentSnippet || item.content,
        url: item.link,
        image_url: item.thumbnail?.$.url || item.mediaContent?.$.url || null, 
        source: 'BBC News',
        published_at: item.pubDate,
      }
      if (article.title && article.description && !isLowQuality(article)) {
        allArticles.push(article)
      }
    })

    // 5. Process RSS - Al Jazeera
    const ajRss = responses[5]?.items || []
    ajRss.forEach(item => {
      const article = {
        title: item.title,
        description: item.contentSnippet || item.content,
        url: item.link,
        image_url: item.thumbnail?.$.url || item.mediaContent?.$.url || null,
        source: 'Al Jazeera',
        published_at: item.pubDate,
      }
      if (article.title && article.description && !isLowQuality(article)) {
        allArticles.push(article)
      }
    })

    // 6. Process RSS - Reuters
    const reutersRss = responses[6]?.items || []
    reutersRss.forEach(item => {
      const article = {
        title: item.title,
        description: item.contentSnippet || item.content,
        url: item.link,
        image_url: item.thumbnail?.$.url || item.mediaContent?.$.url || null,
        source: 'Reuters',
        published_at: item.pubDate,
      }
      if (article.title && article.description && !isLowQuality(article)) {
        allArticles.push(article)
      }
    })

    console.log(`Fetched: NewsAPI(${newsApiData.length}), Guardian(${guardianData.length}), NewsCatcher(${newsCatcherData.length}), BBC(${responses[4]?.items?.length || 0}), AJ(${responses[5]?.items?.length || 0}), Reuters(${responses[6]?.items?.length || 0}), NewSources(${ (responses[7]?.items?.length || 0) + (responses[8]?.items?.length || 0) + (responses[9]?.items?.length || 0) + (responses[10]?.items?.length || 0) + (responses[11]?.items?.length || 0) + (responses[12]?.items?.length || 0) })`)

    // 7. Process New RSS Feeds (Indices 7 to 12)
    const newRssFeeds = [
      { name: 'The Verge', index: 7 },
      { name: 'TechCrunch', index: 8 },
      { name: 'Wired', index: 9 },
      { name: 'Phys.org', index: 10 },
      { name: 'NPR', index: 11 },
      { name: 'CNBC', index: 12 }
    ]

    newRssFeeds.forEach(feed => {
      const items = responses[feed.index]?.items || []
      items.forEach(item => {
        const article = {
          title: item.title,
          description: item.contentSnippet || item.content || item.summary,
          url: item.link,
          image_url: item.thumbnail?.$.url || item.mediaContent?.$.url || item.enclosure?.url || null,
          source: feed.name,
          published_at: item.pubDate,
        }
        if (article.title && article.description && !isLowQuality(article)) {
          allArticles.push(article)
        }
      })
    })


    // Remove duplicates from the batch

    // Deduplicate by: 1. URL, 2. Lowercase Title, 3. Image URL (to prevent visual repeats)
    const uniqueMap = new Map()
    const usedImages = new Set()
    
    allArticles.forEach(article => {
      const normalizedTitle = article.title.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim()
      const urlKey = article.url.split('?')[0]
      const imageUrl = article.image_url
      
      const isTitleDuplicate = uniqueMap.has(normalizedTitle)
      const isUrlDuplicate = uniqueMap.has(urlKey)
      const isImageDuplicate = imageUrl && usedImages.has(imageUrl)

      if (!isTitleDuplicate && !isUrlDuplicate && !isImageDuplicate) {
        uniqueMap.set(urlKey, article)
        uniqueMap.set(normalizedTitle, article)
        if (imageUrl) usedImages.add(imageUrl)
      }
    })


    const uniqueBatch = Array.from(new Set(uniqueMap.values()))
    
    // Fetch recent titles from DB for cross-batch deduplication
    const { rows: recentArticles } = await pool.query(
      'SELECT title FROM articles WHERE published_at > NOW() - INTERVAL \'24 hours\''
    )
    const recentTitles = recentArticles.map(r => r.title)

    console.log(`Fetched ${uniqueBatch.length} unique articles from sources. Checking against ${recentTitles.length} recent database articles.`)

    const filteredBatch = uniqueBatch.filter(article => {
      // Check for fuzzy title similarity with recent DB articles
      const isDuplicate = recentTitles.some(existingTitle => {
        const sim = calculateSimilarity(article.title, existingTitle)
        return sim > 0.75 // 75% overlap threshold
      })
      return !isDuplicate
    })

    console.log(`Final batch size after fuzzy deduplication: ${filteredBatch.length}`)

    const processedResults = await Promise.allSettled(
      filteredBatch.slice(0, 60).map(async (article) => {

        try {
          // Check if article already exists and has AI analysis
          const { rows: existing } = await pool.query('SELECT summary FROM articles WHERE url = $1', [article.url])
          
          if (existing.length > 0 && existing[0].summary) {
            // Just update timestamp/stats if needed, or skip
            return { skipped: true }
          }

          const [ai, embedding] = await Promise.all([
            analyzeArticle(article.title, article.description),
            getEmbedding(`${article.title} ${article.description}`)
          ])

          if (!embedding) return null

          // Normalize category
          const rawCategory = typeof ai.category === 'string' ? ai.category : 'general'
          const normalizedCategory = sanitizeCategory(rawCategory)

          // Use diverse fallback image based on category if missing
          const CATEGORY_FALLBACKS = {
            technology: [
              'https://images.unsplash.com/photo-1518770660439-4636190af475', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
              'https://images.unsplash.com/photo-1550751827-4bd374c3f58b', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
              'https://images.unsplash.com/photo-1531297484001-80022131f5a1', 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
              'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
              'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5'
            ],
            sports: [
              'https://images.unsplash.com/photo-1508098682722-e99c43a406b2', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
              'https://images.unsplash.com/photo-1517649763962-0c623066013b', 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e',
              'https://images.unsplash.com/photo-1504450758481-7338eba7524a', 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402',
              'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d', 'https://images.unsplash.com/photo-1516567727245-ad8c68f3ec93',
              'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8', 'https://images.unsplash.com/photo-1505235687559-28b5f54645b7'
            ],
            politics: [
              'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620', 'https://images.unsplash.com/photo-1541872703-74c5e443d1f9',
              'https://images.unsplash.com/photo-1523995462485-3d171b5c8fb9', 'https://images.unsplash.com/photo-1450149632596-3ef25a620117',
              'https://images.unsplash.com/photo-1555848962-6e79363ec58f', 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c',
              'https://images.unsplash.com/photo-1575320181282-9afab399332c', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
              'https://images.unsplash.com/photo-1521791136064-7986c2959210', 'https://images.unsplash.com/photo-1494172961521-33799dab43a5'
            ],
            business: [
              'https://images.unsplash.com/photo-1460925895917-afdab827c52f', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
              'https://images.unsplash.com/photo-1507679799987-c73779587ccf', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f',
              'https://images.unsplash.com/photo-1454165833222-d1d724630d67', 'https://images.unsplash.com/photo-1556761175-b413da4baf72',
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f', 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa',
              'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'https://images.unsplash.com/photo-1552664730-d307ca884978'
            ],
            science: [
              'https://images.unsplash.com/photo-1507413245164-6160d8298b31', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
              'https://images.unsplash.com/photo-1532094349884-543bb1198343', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',
              'https://images.unsplash.com/photo-1530210124550-912dc1381cb8', 'https://images.unsplash.com/photo-1518152006812-edab29bb0a6a',
              'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45', 'https://images.unsplash.com/photo-1564325724739-bae0bd08bc62',
              'https://images.unsplash.com/photo-1507668077129-56e32842fceb', 'https://images.unsplash.com/photo-1519681393784-d120267933ba'
            ],
            health: [
              'https://images.unsplash.com/photo-1505751172107-573225a9120e', 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7',
              'https://images.unsplash.com/photo-1576091160550-2173dba999ef', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
              'https://images.unsplash.com/photo-1535914223966-332a7e4400a0', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
              'https://images.unsplash.com/photo-1551076805-e1869033e561', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', 'https://images.unsplash.com/photo-1445510861639-5651173bc5d5'
            ],
            entertainment: [
              'https://images.unsplash.com/photo-1499364615650-ec385728efce', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
              'https://images.unsplash.com/photo-1514525253361-bee8a19740c1', 'https://images.unsplash.com/photo-1586899028174-e7098604235b',
              'https://images.unsplash.com/photo-1485846234645-a62644f84728', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
              'https://images.unsplash.com/photo-1536440136628-849c177e76a1', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26',
              'https://images.unsplash.com/photo-1510511459019-5dee995d3ff4', 'https://images.unsplash.com/photo-1496337589254-7e19d01ced44'
            ],
            general: [
              'https://images.unsplash.com/photo-1504711434969-e33886168f5c', 'https://images.unsplash.com/photo-1495020689067-958852a7765e',
              'https://images.unsplash.com/photo-1476242906366-d8eb64c2f661', 'https://images.unsplash.com/photo-1585829365234-78d2b9ff0447',
              'https://images.unsplash.com/photo-1524178232363-1fb2b075b655', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
              'https://images.unsplash.com/photo-1503694978374-8a2fa686963a', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d',
              'https://images.unsplash.com/photo-1508921334172-b1fad99033b8', 'https://images.unsplash.com/photo-1511649475669-e278d2c67b72'
            ]
          }

          const imagePool = CATEGORY_FALLBACKS[normalizedCategory] || CATEGORY_FALLBACKS.general
          
          // Use source image only if it looks like a real image, else use our high-quality hashed pool
          const imageUrl = isProperImage(article.image_url) 
            ? article.image_url 
            : imagePool[getHashIndex(article.title, imagePool.length)] + '?auto=format&fit=crop&q=80&w=800'



          await pool.query(
            `INSERT INTO articles (title, description, url, image_url, source, published_at, category, sentiment, bias_score, bias_reason, summary, embedding)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (url) DO UPDATE SET
               category = EXCLUDED.category,
               sentiment = EXCLUDED.sentiment,
               bias_score = EXCLUDED.bias_score,
               summary = EXCLUDED.summary,
               embedding = EXCLUDED.embedding`,
            [
              article.title, article.description, article.url,
              imageUrl, article.source, article.published_at,
              normalizedCategory, ai.sentiment, ai.bias_score, ai.bias_reason,
              ai.summary,
              JSON.stringify(embedding)
            ]
          )
          return { saved: true }
        } catch (e) {
          console.error(`Error processing article: ${article.url}`, e.message)
          return null
        }
      })
    )

    const savedCount = processedResults.filter(r => r.status === 'fulfilled' && r.value?.saved).length
    const skippedCount = processedResults.filter(r => r.status === 'fulfilled' && r.value?.skipped).length

    return { success: true, savedCount, skippedCount, totalFetched: uniqueBatch.length }
  } catch (err) {
    console.error('Fetch and Store News Error:', err)
    throw new Error(err.message)
  }
}