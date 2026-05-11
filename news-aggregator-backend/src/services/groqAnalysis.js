import dotenv from 'dotenv'
dotenv.config()

import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function sanitizeCategory(cat) {
  const categories = ['politics', 'sports', 'entertainment', 'general', 'business', 'health', 'technology', 'science']
  return categories.includes(cat?.toLowerCase()) ? cat.toLowerCase() : 'general'
}

/**
 * Analyzes a user search query to extract intent, topics, and contextual domain.
 */
export async function analyzeSearchQuery(query) {
  try {
    const prompt = `
      Analyze this news search query: "${query}"
      Return a JSON object with:
      - isExploratory: true if it's a broad/thematic topic (e.g., "AI breakthroughs", "Chess news"), false for specific names or very direct keywords.
      - mainTopic: The primary subject.
      - contextDomain: The specific niche/domain (e.g., "Chess/Board Games", "Film Industry/Hollywood").
      - relatedKeywords: 5-7 highly specific keywords that define this context (e.g., for Chess: "FIDE, Grandmaster, Tournament, Elo, Opening").
      - category: One of ['politics', 'sports', 'entertainment', 'general', 'business', 'health', 'technology', 'science'].
      
      CRITICAL: If the query is "Chess related news", do NOT just say Category: "sports". 
      Define the contextDomain strictly so we avoid drifting into generic sports like football.
    `

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: 'You are a search intent analyzer. Return ONLY JSON.' }, { role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(chatCompletion.choices[0].message.content)
    return {
      isExploratory: result.isExploratory || false,
      mainTopic: result.mainTopic || query,
      contextDomain: result.contextDomain || '',
      relatedKeywords: result.relatedKeywords || [],
      category: sanitizeCategory(result.category)
    }
  } catch (err) {
    console.error('Groq Search Analysis Error:', err.message)
    return { isExploratory: false, mainTopic: query, contextDomain: '', relatedKeywords: [], category: 'general' }
  }
}

export async function analyzeArticle(title, description) {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Analyze this news article and respond in JSON only:
Title: ${title}
Description: ${description}

Return exactly:
{
  "category": "ONE of: politics, sports, entertainment, general, business, health, technology, science",

  "sentiment": "positive/negative/neutral",
  "bias_score": "low/medium/high",
  "bias_reason": "one short sentence",
  "summary": "A 2-3 line concise summary focusing on key facts.",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`
      }]
    })

    const content = res.choices[0].message.content || '{}'
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return { category: 'general', sentiment: 'neutral', bias_score: 'low', bias_reason: 'None', summary: description, keywords: [] }
  } catch (e) {
    return { category: 'general', sentiment: 'neutral', bias_score: 'low', bias_reason: 'None', summary: description, keywords: [] }
  }
}

/**
 * Deeply analyzes a user search query for intent, specificity, and contextual domain.
 */
export async function understandQuery(query) {
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
        messages: [{
          role: 'system',
          content: `Analyze news search queries with high contextual precision.
          
          SPECIFICITY SCALE:
          - 1-3: Broad themes (e.g., "Tech news", "World economy", "Chess related").
          - 4-6: Topical areas (e.g., "AI breakthroughs", "US Elections").
          - 7-10: Specific entities/events (e.g., "Magnus Carlsen", "Nvidia earnings", "Gaza ceasefire").

          CRITICAL:
          - If query is "Chess related", context_domain is "Chess/Grandmaster/Board Games". 
          - Do NOT allow generic "Sports" drift if the domain is specific (like Chess).
          
          Return ONLY valid JSON:
          {
            "expanded_query": "highly relevant subjects for vector search",
            "contextual_keywords": "4-6 defining terms (e.g., for Chess: FIDE, Elo, Grandmaster, Tournament)",
            "intent": "entity_search/exploratory/thematic",
            "specificity": 1-10,
            "context_domain": "The specific niche (e.g. 'Chess', 'Semiconductors')",
            "is_exploratory": true/false, // true for topics, false for specific names
            "suggested_category": "technology/sports/politics/business/health/entertainment/science/general",
            "is_gibberish": false
          }`
      }, {
        role: 'user',
        content: `Query: "${query}"`
      }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(res.choices[0].message.content)
    return {
      ...result,
      suggested_category: sanitizeCategory(result.suggested_category)
    }
  } catch (err) {
    console.error('Groq Query Analysis Error:', err.message)
    return { expanded_query: query, intent: 'general', specificity: 5, is_exploratory: false, suggested_category: 'general' }
  }
}

export async function rerankArticles(query, articles) {
  if (!articles.length) return []
  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `You are a news search result ranker. Your job is to ORDER results by relevance, not filter them aggressively.
Query: "${query}"

Articles:
${articles.map((a, i) => `${i}. ${a.title} — ${a.description?.slice(0, 100)}`).join('\n')}

Instructions:
1. Sort articles from MOST to LEAST relevant to the query intent.
2. Direct keyword matches rank highest.
3. Thematically related articles (same topic area) rank in the middle.
4. Only EXCLUDE an article if it is clearly about a completely different topic with no meaningful connection (e.g. a cricket article when query is "stock market").
5. For broad/exploratory queries (e.g. "AI Tech", "Global Economy"), be generous — thematic neighbors are valid.
6. Return a JSON array of indexes in ranked order. Include all relevant and semi-relevant articles.

Return ONLY a JSON array: [2, 0, 5, 3]
If truly nothing is relevant, return: []`
      }],
      temperature: 0.1
    })



    const content = res.choices[0].message.content || '[]'
    const match = content.match(/\[[\s\S]*\]/)
    if (!match) return articles

    const order = JSON.parse(match[0])
    const sorted = order.map((i) => articles[i]).filter(Boolean)
    return sorted.length ? sorted : articles
  } catch {
    return articles
  }
}