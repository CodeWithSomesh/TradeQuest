import { GoogleGenerativeAI } from '@google/generative-ai'
import { Ollama } from 'ollama'
import { NextRequest, NextResponse } from 'next/server'

// Initialize AI providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const ollama = new Ollama({ 
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' 
})

// Fallback topics if API fails
const FALLBACK_TOPICS = [
  { value: 'market-highlights', label: 'Market Highlights & Analysis' },
  { value: 'educational-content', label: 'Trading Education & Concepts' },
  { value: 'market-psychology', label: 'Market Psychology & Risk Management' },
  { value: 'economic-indicators', label: 'Economic Indicators & Data' },
  { value: 'crypto-education', label: 'Cryptocurrency Education' },
  { value: 'forex-fundamentals', label: 'Forex Market Fundamentals' }
]

interface NewsItem {
  category: string
  headline: string
  summary: string
  datetime: number
  source: string
  url: string
  relevanceScore?: number
}

interface TopicItem {
  value: string
  label: string
  newsSource?: string
  actualSources?: string[]  // Array of actual news source names
  primarySource?: string    // Primary news source for display
  lastUpdated?: number      // When topic was generated
  newsReleaseDate?: number  // When the underlying news was released
  sourceNews?: NewsItem[]   // Store the news data that generated this topic
  context?: string         // Processed context summary for AI generation
}

// Financial news categories to fetch from Finnhub
const FINANCIAL_CATEGORIES = [
  'forex',      // Foreign exchange news
  'crypto',     // Cryptocurrency news  
  'merger',     // Merger and acquisition news
  'general'     // General financial news (includes trading, markets, etc.)
]

// Financial keywords to filter relevant news
const FINANCIAL_KEYWORDS = [
  // Trading & Markets
  'trading', 'trader', 'market', 'stock', 'share', 'equity', 'bond', 'commodity',
  'futures', 'options', 'derivatives', 'volatility', 'liquidity', 'volume',
  
  // Forex
  'forex', 'fx', 'currency', 'dollar', 'euro', 'yen', 'pound', 'exchange rate',
  'usd', 'eur', 'gbp', 'jpy', 'cad', 'aud', 'chf', 'nzd', 'central bank',
  
  // Crypto
  'bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency', 'crypto', 'blockchain',
  'defi', 'nft', 'altcoin', 'stablecoin', 'binance', 'coinbase', 'mining',
  
  // Corporate Finance
  'merger', 'acquisition', 'ipo', 'earnings', 'revenue', 'profit', 'dividend',
  'buyback', 'takeover', 'valuation', 'financial results', 'quarterly',
  
  // Economic Indicators
  'gdp', 'inflation', 'interest rate', 'federal reserve', 'fed', 'ecb', 'boe',
  'monetary policy', 'fiscal policy', 'unemployment', 'cpi', 'ppi', 'economic growth',
  
  // Investment
  'investment', 'investor', 'fund', 'etf', 'mutual fund', 'hedge fund', 'portfolio',
  'asset management', 'wealth management', 'financial advisor', 'broker'
]

// Check if news item is financial-related
function isFinancialNews(item: any): boolean {
  const text = `${item.headline || ''} ${item.summary || ''}`.toLowerCase()
  
  // Check if any financial keyword appears in the text
  return FINANCIAL_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  )
}

// Fetch latest financial news from Finnhub
async function fetchMarketNews(): Promise<NewsItem[]> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new Error('Finnhub API key not configured')
  }

  let allNews: any[] = []

  // Fetch news from multiple financial categories
  for (const category of FINANCIAL_CATEGORIES) {
    try {
      console.log(`📰 Fetching ${category} news...`)
      
      const response = await fetch(`https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`, {
        headers: {
          'X-Finnhub-Token': apiKey
        }
      })

      if (response.ok) {
        const categoryNews = await response.json()
        if (Array.isArray(categoryNews)) {
          // Filter for financial relevance and add category info
          const filteredNews = categoryNews
            .filter(item => isFinancialNews(item))
            .slice(0, 5) // Max 5 items per category to avoid overwhelming
            .map(item => ({
              ...item,
              category: category,
              relevanceScore: calculateRelevanceScore(item)
            }))
          
          allNews.push(...filteredNews)
          console.log(`✅ Found ${filteredNews.length} relevant ${category} news items`)
        }
      } else {
        console.warn(`⚠️ Failed to fetch ${category} news: ${response.status}`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Error fetching ${category} news:`, error.message)
    }
  }

  // Sort by relevance score and recency, then take top 15 items
  allNews.sort((a, b) => {
    // First sort by relevance score (higher is better)
    const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0)
    if (relevanceDiff !== 0) return relevanceDiff
    
    // Then by recency (newer is better)
    return (b.datetime || 0) - (a.datetime || 0)
  })

  // Remove duplicates based on headline similarity
  const uniqueNews = removeDuplicateNews(allNews.slice(0, 15))
  
  console.log(`📊 Final selection: ${uniqueNews.length} unique financial news items`)

  // Return processed news items
  return uniqueNews.slice(0, 12).map((item: any) => ({
    category: item.category || 'general',
    headline: item.headline || '',
    summary: item.summary || item.headline || '',
    datetime: item.datetime || Date.now() / 1000,
    source: item.source || 'Unknown',
    url: item.url || '',
    relevanceScore: item.relevanceScore || 0
  }))
}

// Calculate relevance score based on financial keywords
function calculateRelevanceScore(item: any): number {
  const text = `${item.headline || ''} ${item.summary || ''}`.toLowerCase()
  let score = 0
  
  // High-value keywords (trading, markets, major currencies, crypto)
  const highValueKeywords = [
    'trading', 'forex', 'bitcoin', 'ethereum', 'merger', 'acquisition', 
    'federal reserve', 'interest rate', 'earnings', 'market', 'usd', 'eur'
  ]
  
  // Medium-value keywords
  const mediumValueKeywords = [
    'investment', 'crypto', 'currency', 'stock', 'economic', 'financial'
  ]
  
  // Count keyword occurrences and weight them
  highValueKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 3
  })
  
  mediumValueKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 2
  })
  
  FINANCIAL_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) score += 1
  })
  
  return score
}

// Remove duplicate news based on headline similarity
function removeDuplicateNews(newsItems: any[]): any[] {
  const unique: any[] = []
  
  for (const item of newsItems) {
    const headline = item.headline?.toLowerCase() || ''
    
    // Check if similar headline already exists
    const isDuplicate = unique.some(existing => {
      const existingHeadline = existing.headline?.toLowerCase() || ''
      return calculateSimilarity(headline, existingHeadline) > 0.7
    })
    
    if (!isDuplicate) {
      unique.push(item)
    }
  }
  
  return unique
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  
  const words1 = str1.split(/\s+/)
  const words2 = str2.split(/\s+/)
  const commonWords = words1.filter(word => 
    word.length > 3 && words2.includes(word)
  )
  
  return commonWords.length / Math.max(words1.length, words2.length)
}

// Generate topic using Ollama
async function generateTopicWithOllama(newsItems: NewsItem[], previousTopics: string[] = []): Promise<{ topics: string[], newsContext: Record<string, NewsItem[]> }> {
  // Diversify news selection first
  const diversifiedNews = diversifyNewsSelection(newsItems)
  
  const newsText = diversifiedNews.map((item, index) => 
    `[${item.category.toUpperCase()}] ${item.headline} - ${item.summary.substring(0, 180)}`
  ).join('\n\n')

  // Create dynamic focus areas based on news categories
  const categories = [...new Set(diversifiedNews.map(item => item.category))]
  const focusAreas = []
  if (categories.includes('forex')) focusAreas.push('- Forex/Currency market education')
  if (categories.includes('crypto')) focusAreas.push('- Cryptocurrency market analysis')
  if (categories.includes('merger')) focusAreas.push('- Merger & acquisition insights')
  if (categories.includes('general')) focusAreas.push('- Trading psychology & risk management')
  focusAreas.push('- Economic indicators impact', '- Market volatility patterns')

  const avoidTopics = previousTopics.length > 0 ? `\nAVOID GENERATING TOPICS SIMILAR TO THESE RECENT ONES:\n${previousTopics.slice(-10).join(', ')}\n` : ''

  const prompt = `Analyze the following FINANCIAL news from forex, crypto, merger, and trading markets. Generate exactly 12 short topic phrases (3-5 words each) for educational social media content.

FINANCIAL NEWS:
${newsText}

DYNAMIC FOCUS AREAS:
${focusAreas.join('\n')}

${avoidTopics}

REQUIREMENTS:
1. Each topic must be 3-5 words maximum
2. Focus on EDUCATIONAL financial content
3. Ensure DIVERSITY across different financial areas
4. Cover different aspects: psychology, analysis, education, trends
5. Avoid any buy/sell recommendations
6. Make topics engaging but neutral
7. Generate exactly 12 DIVERSE topics, one per line
8. Prioritize variety over similarity - avoid repetitive themes
9. Base topics on the actual news provided above to avoid hallucination

TOPIC VARIETY EXAMPLES:
- "Central Bank Policy Shifts"
- "Crypto Adoption Trends" 
- "Market Psychology Insights"
- "Currency Correlation Analysis"
- "Risk Management Strategies"
- "Economic Data Interpretation"
- "Volatility Trading Concepts"
- "Financial News Impact"

Format: Return only the 12 topic phrases, one per line, nothing else. Each topic should relate to specific news items above.`

  const response = await ollama.generate({
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    prompt: prompt,
    options: {
      temperature: 0.8, // Higher temperature for more creativity/diversity
      num_predict: 180,
    }
  })

  let topics = response.response
    .split('\n')
    .map(line => line.trim().replace(/^[-\d.)\s]+/, '')) // Remove bullet points/numbers
    .filter(line => line.length > 0 && line.length <= 50)
    .slice(0, 12) // Get 12 topics initially

  // Remove duplicates against previous topics
  topics = removeDuplicateTopics(topics, previousTopics)

  // If we don't have enough unique topics, pad with fallback topics
  while (topics.length < 10) {
    const fallbackIndex = topics.length % FALLBACK_TOPICS.length
    const fallbackTopic = FALLBACK_TOPICS[fallbackIndex].label
    if (!topics.some(t => calculateTopicSimilarity(t.toLowerCase(), fallbackTopic.toLowerCase()) > 0.6)) {
      topics.push(fallbackTopic)
    } else {
      // Find a different fallback topic
      const altIndex = (fallbackIndex + 1) % FALLBACK_TOPICS.length
      topics.push(FALLBACK_TOPICS[altIndex].label)
    }
  }

  // Create news context mapping for each topic
  const finalTopics = topics.slice(0, 10)
  const newsContext: Record<string, NewsItem[]> = {}
  
  finalTopics.forEach((topic, index) => {
    // Assign 2-3 most relevant news items to each topic
    const topicKey = topicToValue(topic)
    const startIdx = (index * 2) % diversifiedNews.length
    const relevantNews = diversifiedNews.slice(startIdx, startIdx + 3).concat(
      diversifiedNews.slice(Math.max(0, startIdx - 1), startIdx)
    ).slice(0, 3)
    
    newsContext[topicKey] = relevantNews.length > 0 ? relevantNews : diversifiedNews.slice(0, 3)
  })

  return { topics: finalTopics, newsContext }
}

// Generate topic using Gemini (fallback)
async function generateTopicWithGemini(newsItems: NewsItem[], previousTopics: string[] = []): Promise<{ topics: string[], newsContext: Record<string, NewsItem[]> }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  
  // Diversify news selection first
  const diversifiedNews = diversifyNewsSelection(newsItems)
  
  const newsText = diversifiedNews.map((item, index) => 
    `[${item.category.toUpperCase()}] ${item.headline} - ${item.summary.substring(0, 180)}`
  ).join('\n\n')

  // Create dynamic focus areas based on news categories
  const categories = [...new Set(diversifiedNews.map(item => item.category))]
  const focusAreas = []
  if (categories.includes('forex')) focusAreas.push('- Forex/Currency market education')
  if (categories.includes('crypto')) focusAreas.push('- Cryptocurrency market analysis')
  if (categories.includes('merger')) focusAreas.push('- Merger & acquisition insights')
  if (categories.includes('general')) focusAreas.push('- Trading psychology & risk management')
  focusAreas.push('- Economic indicators impact', '- Market volatility patterns')

  const avoidTopics = previousTopics.length > 0 ? `\nAVOID GENERATING TOPICS SIMILAR TO THESE RECENT ONES:\n${previousTopics.slice(-10).join(', ')}\n` : ''

  const prompt = `Analyze the following FINANCIAL news from forex, crypto, merger, and trading markets. Generate exactly 12 short topic phrases (3-5 words each) for educational social media content.

FINANCIAL NEWS:
${newsText}

DYNAMIC FOCUS AREAS:
${focusAreas.join('\n')}

${avoidTopics}

REQUIREMENTS:
1. Each topic must be 3-5 words maximum
2. Focus on EDUCATIONAL financial content
3. Ensure DIVERSITY across different financial areas
4. Cover different aspects: psychology, analysis, education, trends
5. Avoid any buy/sell recommendations
6. Make topics engaging but neutral
7. Generate exactly 12 DIVERSE topics, one per line
8. Prioritize variety over similarity - avoid repetitive themes

TOPIC VARIETY EXAMPLES:
- "Central Bank Policy Shifts"
- "Crypto Adoption Trends" 
- "Market Psychology Insights"
- "Currency Correlation Analysis"
- "Risk Management Strategies"
- "Economic Data Interpretation"
- "Volatility Trading Concepts"
- "Financial News Impact"

Format: Return only the 8 topic phrases, one per line, nothing else.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()
  
  let topics = response
    .split('\n')
    .map(line => line.trim().replace(/^[-\d.)\s]+/, '')) // Remove bullet points/numbers
    .filter(line => line.length > 0 && line.length <= 50)
    .slice(0, 12) // Get 12 topics initially

  // Remove duplicates against previous topics
  topics = removeDuplicateTopics(topics, previousTopics)

  // If we don't have enough unique topics, pad with fallback topics
  while (topics.length < 10) {
    const fallbackIndex = topics.length % FALLBACK_TOPICS.length
    const fallbackTopic = FALLBACK_TOPICS[fallbackIndex].label
    if (!topics.some(t => calculateTopicSimilarity(t.toLowerCase(), fallbackTopic.toLowerCase()) > 0.6)) {
      topics.push(fallbackTopic)
    } else {
      // Find a different fallback topic
      const altIndex = (fallbackIndex + 1) % FALLBACK_TOPICS.length
      topics.push(FALLBACK_TOPICS[altIndex].label)
    }
  }

  // Create news context mapping for each topic
  const finalTopics = topics.slice(0, 10)
  const newsContext: Record<string, NewsItem[]> = {}
  
  finalTopics.forEach((topic, index) => {
    // Assign 2-3 most relevant news items to each topic
    const topicKey = topicToValue(topic)
    const startIdx = (index * 2) % diversifiedNews.length
    const relevantNews = diversifiedNews.slice(startIdx, startIdx + 3).concat(
      diversifiedNews.slice(Math.max(0, startIdx - 1), startIdx)
    ).slice(0, 3)
    
    newsContext[topicKey] = relevantNews.length > 0 ? relevantNews : diversifiedNews.slice(0, 3)
  })

  return { topics: finalTopics, newsContext }
}

// Convert topic labels to values (URL-friendly)
function topicToValue(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single
    .trim()
}

// Create context summary from news items for AI content generation
function createTopicContext(newsItems: NewsItem[]): string {
  if (!newsItems || newsItems.length === 0) {
    return 'General financial market context and educational content.'
  }

  const contextParts = newsItems.map((item, index) => {
    const headline = item.headline || 'Market Update'
    const summary = item.summary ? item.summary.substring(0, 200) : 'Financial market development'
    const category = item.category ? `[${item.category.toUpperCase()}]` : ''
    
    return `${category} ${headline}: ${summary}`
  }).join('\n\n')

  return `CURRENT MARKET CONTEXT:\n${contextParts}`
}

// Extract actual news sources and release date from news items
function extractNewsSources(newsItems: NewsItem[]): { actualSources: string[], primarySource: string, newsReleaseDate: number } {
  if (!newsItems || newsItems.length === 0) {
    return { actualSources: [], primarySource: 'Default Topics', newsReleaseDate: Date.now() }
  }

  // Get unique sources with their occurrence count
  const sourceCount = newsItems.reduce((acc, item) => {
    if (item.source) {
      acc[item.source] = (acc[item.source] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const sources = Object.keys(sourceCount)
  
  // Clean up source names for better display
  const cleanedSources = sources.map(source => {
    // Handle common news source patterns
    let cleaned = source
      .replace(/^www\./, '')
      .replace(/\.com$/, '')
      .replace(/\.net$/, '')
      .replace(/\.org$/, '')
      .replace(/\.co\.uk$/, '')
    
    // Split on dots and take the main domain name
    const parts = cleaned.split('.')
    if (parts.length > 1) {
      cleaned = parts[0]
    }
    
    // Capitalize properly for known sources
    const knownSources: Record<string, string> = {
      'reuters': 'Reuters',
      'bloomberg': 'Bloomberg',
      'marketwatch': 'MarketWatch',
      'wsj': 'Wall Street Journal',
      'cnbc': 'CNBC',
      'cnn': 'CNN Business',
      'yahoo': 'Yahoo Finance',
      'forbes': 'Forbes',
      'ft': 'Financial Times',
      'ap': 'Associated Press',
      'bbc': 'BBC',
      'nyt': 'New York Times',
      'guardian': 'The Guardian',
      'techcrunch': 'TechCrunch',
      'coindesk': 'CoinDesk',
      'cointelegraph': 'Cointelegraph',
      'benzinga': 'Benzinga',
      'seeking': 'Seeking Alpha'
    }
    
    const lowerCleaned = cleaned.toLowerCase()
    const knownSource = Object.keys(knownSources).find(key => 
      lowerCleaned.includes(key) || key.includes(lowerCleaned)
    )
    
    if (knownSource) {
      return knownSources[knownSource]
    }
    
    // Default formatting: capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
  })

  // Remove duplicates and sort by count (most frequent first)
  const uniqueSources = [...new Set(cleanedSources)]
  uniqueSources.sort((a, b) => {
    const countA = Object.keys(sourceCount).filter(original => 
      cleanedSources[sources.indexOf(original)] === a
    ).reduce((sum, original) => sum + sourceCount[original], 0)
    
    const countB = Object.keys(sourceCount).filter(original => 
      cleanedSources[sources.indexOf(original)] === b
    ).reduce((sum, original) => sum + sourceCount[original], 0)
    
    return countB - countA
  })

  // Primary source is the most frequent one
  const primarySource = uniqueSources.length > 0 ? uniqueSources[0] : 'Financial News'

  // Get the most recent news release date (convert from seconds to milliseconds if needed)
  const newsReleaseDate = newsItems.length > 0 ? 
    Math.max(...newsItems.map(item => {
      // Finnhub API returns datetime in seconds, convert to milliseconds
      const timestamp = item.datetime * 1000
      return timestamp > Date.now() ? item.datetime : timestamp
    })) : Date.now()

  return {
    actualSources: uniqueSources,
    primarySource: primarySource,
    newsReleaseDate: newsReleaseDate
  }
}

// Format source display for UI
function formatSourceDisplay(primarySource: string, actualSources: string[], maxLength: number = 20): string {
  if (!primarySource || primarySource === 'Default Topics') {
    return 'Default'
  }

  // If primary source is short enough, use it
  if (primarySource.length <= maxLength) {
    // Add count if multiple sources
    if (actualSources.length > 1) {
      return `${primarySource} +${actualSources.length - 1}`
    }
    return primarySource
  }

  // Truncate long source names
  const truncated = primarySource.substring(0, maxLength - 3) + '...'
  if (actualSources.length > 1) {
    return `${truncated} +${actualSources.length - 1}`
  }
  return truncated
}

// Diversify news selection for better topic variety
function diversifyNewsSelection(newsItems: NewsItem[]): NewsItem[] {
  const diversified: NewsItem[] = []
  const categories = [...new Set(newsItems.map(item => item.category))]
  
  // Take at least 2 items from each category if available
  categories.forEach(category => {
    const categoryItems = newsItems
      .filter(item => item.category === category)
      .slice(0, 3) // Max 3 per category
    diversified.push(...categoryItems)
  })
  
  // Add random selection from remaining items
  const remaining = newsItems.filter(item => 
    !diversified.some(selected => selected.url === item.url)
  )
  
  // Shuffle and take some random items
  const shuffled = remaining.sort(() => Math.random() - 0.5)
  diversified.push(...shuffled.slice(0, 3))
  
  return diversified.slice(0, 12) // Ensure we don't exceed limit
}

// Remove duplicate topics based on similarity
function removeDuplicateTopics(topics: string[], previousTopics: string[] = []): string[] {
  const unique: string[] = []
  const allExisting = [...previousTopics, ...unique]
  
  for (const topic of topics) {
    const topicLower = topic.toLowerCase()
    
    // Check if similar topic already exists
    const isDuplicate = allExisting.some(existing => {
      const existingLower = existing.toLowerCase()
      return calculateTopicSimilarity(topicLower, existingLower) > 0.6
    })
    
    if (!isDuplicate) {
      unique.push(topic)
      allExisting.push(topic)
    }
  }
  
  return unique
}

// Calculate similarity between topics
function calculateTopicSimilarity(topic1: string, topic2: string): number {
  if (!topic1 || !topic2) return 0
  
  const words1 = topic1.split(/\s+/).filter(w => w.length > 2)
  const words2 = topic2.split(/\s+/).filter(w => w.length > 2)
  
  const commonWords = words1.filter(word => words2.includes(word))
  const similarity = commonWords.length / Math.max(words1.length, words2.length)
  
  // Also check for partial word matches for similar concepts
  let partialMatches = 0
  words1.forEach(w1 => {
    words2.forEach(w2 => {
      if (w1.length > 3 && w2.length > 3 && 
          (w1.includes(w2) || w2.includes(w1) || 
           levenshteinDistance(w1, w2) <= 2)) {
        partialMatches += 0.5
      }
    })
  })
  
  return Math.max(similarity, partialMatches / Math.max(words1.length, words2.length))
}

// Simple Levenshtein distance for word similarity
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

// Simple in-memory cache for recent topics (to avoid repetition)
let recentTopicsCache: string[] = []

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching dynamic topics from financial news (forex, crypto, merger, trading)...')
    
    // Fetch latest financial market news
    const newsItems = await fetchMarketNews()
    console.log(`✅ Fetched ${newsItems.length} filtered financial news items`)
    
    // Log news categories distribution
    const categoryCount = newsItems.reduce((acc: any, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {})
    console.log('📊 News distribution by category:', categoryCount)
    
    let topicLabels: string[] = []
    let newsContext: Record<string, NewsItem[]> = {}
    
    // Try Ollama first (primary for topic generation)
    try {
      console.log('🤖 Generating diverse topics with Ollama...')
      const result = await generateTopicWithOllama(newsItems, recentTopicsCache)
      topicLabels = result.topics
      newsContext = result.newsContext
      console.log('✅ Ollama topic generation successful')
    } catch (ollamaError: any) {
      console.log('❌ Ollama failed, trying Gemini:', ollamaError.message)
      
      // Fallback to Gemini
      try {
        console.log('🔄 Falling back to Gemini for diverse topics...')
        const result = await generateTopicWithGemini(newsItems, recentTopicsCache)
        topicLabels = result.topics
        newsContext = result.newsContext
        console.log('✅ Gemini topic generation successful')
      } catch (geminiError: any) {
        console.error('❌ Both AI providers failed:', {
          ollama: ollamaError.message,
          gemini: geminiError.message
        })
        
        // Use fallback topics (but still check against recent topics)
        let fallbackLabels = FALLBACK_TOPICS.map(topic => topic.label)
        fallbackLabels = removeDuplicateTopics(fallbackLabels, recentTopicsCache)
        
        // If too few unique fallbacks, rotate through them
        while (fallbackLabels.length < 10) {
          const additionalFallbacks = FALLBACK_TOPICS.map(topic => `${topic.label} Insights`)
          fallbackLabels.push(...additionalFallbacks)
          fallbackLabels = fallbackLabels.slice(0, 10)
        }
        
        topicLabels = fallbackLabels
        
        // Create basic context for fallback topics using available news
        topicLabels.forEach((topic, index) => {
          const topicKey = topicToValue(topic)
          const startIdx = (index * 2) % newsItems.length
          newsContext[topicKey] = newsItems.slice(startIdx, startIdx + 3)
        })
        
        console.log('⚠️ Using diversified fallback topics')
      }
    }
    
    // Update recent topics cache (keep last 30 topics for comparison)
    recentTopicsCache = [...recentTopicsCache, ...topicLabels].slice(-30)
    console.log(`💾 Updated topics cache with ${topicLabels.length} new topics (cache size: ${recentTopicsCache.length})`)
    
    // Convert to structured topics with news context
    const topics: TopicItem[] = topicLabels.map(label => {
      const topicKey = topicToValue(label)
      const sourceNews = newsContext[topicKey] || []
      const context = createTopicContext(sourceNews)
      const { actualSources, primarySource, newsReleaseDate } = extractNewsSources(sourceNews)
      
      return {
        value: topicKey,
        label: label,
        newsSource: 'Live Financial News', // Keep for backward compatibility
        actualSources: actualSources,
        primarySource: primarySource,
        lastUpdated: Date.now(),
        newsReleaseDate: newsReleaseDate,
        sourceNews: sourceNews,
        context: context
      }
    })
    
    return NextResponse.json({
      topics,
      lastUpdated: Date.now(),
      source: 'dynamic',
      newsCount: newsItems.length,
      categories: FINANCIAL_CATEGORIES,
      message: 'Live topics with actual news sources and timestamps from latest financial news (Reuters, Bloomberg, MarketWatch, etc.)'
    })
    
  } catch (error: any) {
    console.error('❌ Topic generation failed:', error.message)
    
    // Return fallback topics on any error
    const fallbackTopics: TopicItem[] = FALLBACK_TOPICS.map(topic => ({
      value: topic.value,
      label: topic.label,
      newsSource: 'Default Topics',
      actualSources: [],
      primarySource: 'Default Topics',
      lastUpdated: Date.now(),
      newsReleaseDate: Date.now(),
      sourceNews: [],
      context: `GENERAL MARKET CONTEXT:\nThis is a general educational topic about ${topic.label}. Market conditions are constantly changing and this content is for educational purposes only. Always conduct your own research and consider market volatility when making financial decisions.`
    }))
    
    return NextResponse.json({
      topics: fallbackTopics,
      lastUpdated: Date.now(),
      source: 'fallback',
      error: error.message,
      categories: FINANCIAL_CATEGORIES,
      message: 'Using fallback financial topics due to API error'
    })
  }
}

// POST: Manual refresh (with forced diversity)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual refresh: Fetching diverse topics from financial news...')
    
    // For manual refresh, we want maximum diversity, so increase temperature and add randomization
    const newsItems = await fetchMarketNews()
    console.log(`✅ Fetched ${newsItems.length} filtered financial news items for manual refresh`)
    
    // Shuffle news for more randomness in manual refresh
    const shuffledNews = newsItems.sort(() => Math.random() - 0.5)
    
    let topicLabels: string[] = []
    let newsContext: Record<string, NewsItem[]> = {}
    
    // Try Ollama with higher creativity for manual refresh
    try {
      console.log('🤖 Generating highly diverse topics with Ollama (manual refresh)...')
      
      // For manual refresh, use higher temperature for more creativity
      const diversePrompt = buildDiverseTopicPrompt(shuffledNews, recentTopicsCache)
      const ollamaResponse = await ollama.generate({
        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
        prompt: diversePrompt,
        options: {
          temperature: 0.9, // Even higher for manual refresh
          num_predict: 180,
        }
      })
      
      topicLabels = processDiverseTopicResponse(ollamaResponse.response, recentTopicsCache)
      
      // Create news context for manual refresh topics
      topicLabels.forEach((topic, index) => {
        const topicKey = topicToValue(topic)
        const startIdx = (index * 2) % shuffledNews.length
        newsContext[topicKey] = shuffledNews.slice(startIdx, startIdx + 3)
      })
      
      console.log('✅ Ollama diverse topic generation successful (manual refresh)')
    } catch (ollamaError: any) {
      console.log('❌ Ollama failed, trying Gemini for manual refresh:', ollamaError.message)
      
      // Fallback to Gemini with high creativity
      try {
        console.log('🔄 Falling back to Gemini for diverse topics (manual refresh)...')
        const result = await generateTopicWithGemini(shuffledNews, recentTopicsCache)
        topicLabels = result.topics
        newsContext = result.newsContext
        console.log('✅ Gemini diverse topic generation successful (manual refresh)')
      } catch (geminiError: any) {
        console.error('❌ Both AI providers failed for manual refresh:', {
          ollama: ollamaError.message,
          gemini: geminiError.message
        })
        
        // Use highly diversified fallback topics for manual refresh
        topicLabels = generateDiverseFallbackTopics(recentTopicsCache)
        
        // Create context for fallback topics
        topicLabels.forEach((topic, index) => {
          const topicKey = topicToValue(topic)
          const startIdx = (index * 2) % shuffledNews.length
          newsContext[topicKey] = shuffledNews.slice(startIdx, startIdx + 3)
        })
        
        console.log('⚠️ Using highly diversified fallback topics (manual refresh)')
      }
    }
    
    // Update cache with new topics
    recentTopicsCache = [...recentTopicsCache, ...topicLabels].slice(-30)
    console.log(`💾 Updated topics cache after manual refresh (cache size: ${recentTopicsCache.length})`)
    
    // Convert to structured topics with context
    const topics: TopicItem[] = topicLabels.map(label => {
      const topicKey = topicToValue(label)
      const sourceNews = newsContext[topicKey] || []
      const context = createTopicContext(sourceNews)
      const { actualSources, primarySource, newsReleaseDate } = extractNewsSources(sourceNews)
      
      return {
        value: topicKey,
        label: label,
        newsSource: 'Live Financial News', // Keep for backward compatibility
        actualSources: actualSources,
        primarySource: primarySource,
        lastUpdated: Date.now(),
        newsReleaseDate: newsReleaseDate,
        sourceNews: sourceNews,
        context: context
      }
    })
    
    return NextResponse.json({
      topics,
      lastUpdated: Date.now(),
      source: 'dynamic',
      newsCount: newsItems.length,
      categories: FINANCIAL_CATEGORIES,
      diversity: 'high', // Indicate this was a high-diversity generation
      message: 'Diverse live topics with actual news sources and timestamps from latest financial news (manual refresh)'
    })
    
  } catch (error: any) {
    console.error('❌ Manual topic refresh failed:', error.message)
    return GET(request) // Fallback to regular GET logic
  }
}

// Helper function to build diverse topic prompt for manual refresh
function buildDiverseTopicPrompt(newsItems: NewsItem[], previousTopics: string[]): string {
  const diversifiedNews = diversifyNewsSelection(newsItems)
  const newsText = diversifiedNews.map((item, index) => 
    `[${item.category.toUpperCase()}] ${item.headline} - ${item.summary.substring(0, 180)}`
  ).join('\n\n')

  const avoidTopics = previousTopics.length > 0 ? 
    `\nSTRONGLY AVOID TOPICS SIMILAR TO THESE RECENT ONES:\n${previousTopics.slice(-10).join(', ')}\n` : ''

  return `Analyze the following FINANCIAL news and generate exactly 8 HIGHLY DIVERSE short topic phrases (3-5 words each) for educational social media content.

FINANCIAL NEWS:
${newsText}

${avoidTopics}

DIVERSITY REQUIREMENTS:
1. Each topic must be 3-5 words maximum
2. Ensure MAXIMUM DIVERSITY across themes
3. Cover: psychology, technical analysis, fundamental analysis, risk management, market trends, education
4. Use creative but professional language
5. Avoid repetitive concepts entirely
6. Generate exactly 12 UNIQUE topics, one per line
7. Prioritize creativity and variety over similarity

DIVERSE TOPIC EXAMPLES:
- "Behavioral Finance Principles"
- "Cross-Currency Analysis"
- "Market Sentiment Indicators" 
- "Algorithmic Trading Basics"
- "Macroeconomic Trend Analysis"
- "Portfolio Diversification Strategies"
- "Technical Pattern Recognition"
- "Global Market Correlations"

Format: Return only the 8 diverse topic phrases, one per line, nothing else.`
}

// Helper function to process diverse topic response
function processDiverseTopicResponse(response: string, previousTopics: string[]): string[] {
  let topics = response
    .split('\n')
    .map(line => line.trim().replace(/^[-\d.)\s]+/, ''))
    .filter(line => line.length > 0 && line.length <= 50)
    .slice(0, 8)

  // Ensure maximum diversity
  topics = removeDuplicateTopics(topics, previousTopics)
  
  // If still not enough, generate creative variations
  while (topics.length < 10) {
    const creativeTopics = [
      'Financial Risk Assessment', 'Market Timing Strategies', 'Currency Strength Analysis',
      'Economic Cycle Insights', 'Trader Psychology Tips', 'Investment Portfolio Balance',
      'Global Economic Trends', 'Financial Data Interpretation', 'Market Volatility Patterns',
      'Trading Discipline Methods', 'Economic Calendar Impact', 'Cross-Asset Correlations'
    ]
    
    for (const creative of creativeTopics) {
      if (topics.length >= 10) break
      if (!topics.some(t => calculateTopicSimilarity(t.toLowerCase(), creative.toLowerCase()) > 0.6) &&
          !previousTopics.some(p => calculateTopicSimilarity(p.toLowerCase(), creative.toLowerCase()) > 0.6)) {
        topics.push(creative)
      }
    }
  }

  return topics.slice(0, 10)
}

// Helper function to generate diverse fallback topics
function generateDiverseFallbackTopics(previousTopics: string[]): string[] {
  const creativeFallbacks = [
    'Market Psychology Insights', 'Economic Data Analysis', 'Risk Management Principles',
    'Currency Market Dynamics', 'Investment Strategy Basics', 'Financial News Impact',
    'Trading Discipline Methods', 'Portfolio Risk Assessment', 'Market Trend Analysis',
    'Economic Indicator Guide', 'Volatility Management Tips', 'Global Market Overview',
    'Financial Planning Basics', 'Market Correlation Studies', 'Investment Risk Factors',
    'Economic Policy Effects', 'Trading Psychology Focus', 'Market Analysis Techniques'
  ]
  
  let topics = removeDuplicateTopics(creativeFallbacks, previousTopics)
  
  // If still not diverse enough, create variations
  if (topics.length < 10) {
    const variations = FALLBACK_TOPICS.map(topic => `Advanced ${topic.label}`)
    topics.push(...removeDuplicateTopics(variations, [...previousTopics, ...topics]))
  }
  
  return topics.slice(0, 10)
}