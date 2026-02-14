import { GoogleGenerativeAI } from '@google/generative-ai'
import { Ollama } from 'ollama'
// import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize both AI providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const ollama = new Ollama({ 
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' 
})

// OpenAI (commented out - using Ollama as fallback)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!
// })

// Generate content using Gemini AI (primary)
async function generateWithGemini(topic: string, platform: string, persona: string, includeEmojis: boolean, additionalContext?: string, topicContext?: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are an AI content creator for financial education. Generate a ${platform} post with the following requirements:

TOPIC: ${topic}
PERSONA: ${persona}
PLATFORM: ${platform}
EMOJIS: ${includeEmojis ? 'Include relevant emojis to make content engaging and visually appealing' : 'Do NOT use any emojis - plain text only'}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}
${topicContext ? `\n${topicContext}` : ''}

PERSONA GUIDELINES:
- Market Educator: Educational, informative, teaching-focused
- Data Analyst: Objective, research-focused, data-driven
- Risk Educator: Safety-focused, risk-aware, cautious
- Market Observer: Neutral, analytical, observational
- Market Jester: Chaotic, satirical, humorous but still educational
- Sigma Scalper: Stoic, ruthless, confident but still neutral
- Hype-Beast: Aggressive, influential, energetic but still educational

CRITICAL COMPLIANCE REQUIREMENTS (MUST FOLLOW TO AVOID CONTENT FLAGGING):
1. ABSOLUTELY NEVER use words like "buy", "sell", "purchase", "invest in", "should", "must", "need to", "have to"
2. AVOID all direct recommendations, suggestions, hints, or implications about trading actions
3. NEVER use phrases like "time to buy", "good opportunity", "don't miss", "act now", "limited time"
4. DO NOT create FOMO (fear of missing out) or urgency in your content
5. AVOID superlatives like "best", "guaranteed", "sure", "certain", "always", "never" (except in disclaimers)
6. Use ONLY neutral, educational language: "data shows", "research indicates", "market trends suggest"
7. Include risk disclaimers: "Markets are volatile", "Past performance doesn't guarantee future results"
8. Focus on education, analysis, and information sharing - NOT advice or recommendations
9. End with engaging questions to promote discussion, not action
10. Keep content professional and informative (even with chaotic/satirical personas)
11. Use relevant hashtags for ${platform}
12. ${includeEmojis ? 'USE emojis strategically to enhance readability and engagement' : 'DO NOT use any emojis - text only'}
13. DO NOT include any notes, meta-commentary, or explanations about the content itself
14. DO NOT mention word limits, tone, or compliance in the response
15. Provide ONLY the final social media post content
16. Remember: Your content will be automatically checked for compliance - avoid anything that could be interpreted as financial advice

CONTENT STRUCTURE:
- Opening: Current market observation or educational insight
- Body: 2-3 key educational points or market analysis
- Engagement: Question to encourage discussion
- Hashtags: 3-5 relevant tags

COMPLIANT LANGUAGE EXAMPLES:
✅ GOOD: "Market data indicates...", "Research suggests...", "Analysts are observing..."
❌ BAD: "You should buy...", "This is a great opportunity...", "Don't miss this chance..."

✅ GOOD: "What do you think about these market trends?"
❌ BAD: "Are you ready to invest?", "Who's buying this dip?"

WORD LIMIT: ${platform === 'twitter' ? '280 characters' : '300 words'}

Generate educational, neutral content that informs rather than advises. Always prioritize education over speculation and maintain strict neutrality. Your content will be automatically scanned for compliance violations. Respond with ONLY the social media post content, no additional notes or explanations.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// Generate content using Ollama (fallback)
async function generateWithOllama(topic: string, platform: string, persona: string, includeEmojis: boolean, additionalContext?: string, topicContext?: string) {
  const prompt = `You are an AI content creator for financial education. Your role is to create educational, neutral content that informs rather than advises.

PERSONA GUIDELINES:
- Market Educator: Educational, informative, teaching-focused
- Data Analyst: Objective, research-focused, data-driven
- Risk Educator: Safety-focused, risk-aware, cautious
- Market Observer: Neutral, analytical, observational
- Market Jester: Chaotic, satirical, humorous but still educational
- Sigma Scalper: Stoic, ruthless, confident but still neutral
- Hype-Beast: Aggressive, influential, energetic but still educational

CRITICAL COMPLIANCE REQUIREMENTS (MUST FOLLOW TO AVOID CONTENT FLAGGING):
1. ABSOLUTELY NEVER use words like "buy", "sell", "purchase", "invest in", "should", "must", "need to", "have to"
2. AVOID all direct recommendations, suggestions, hints, or implications about trading actions
3. NEVER use phrases like "time to buy", "good opportunity", "don't miss", "act now", "limited time"
4. DO NOT create FOMO (fear of missing out) or urgency in your content
5. AVOID superlatives like "best", "guaranteed", "sure", "certain", "always", "never" (except in disclaimers)
6. Use ONLY neutral, educational language: "data shows", "research indicates", "market trends suggest"
7. Include risk disclaimers: "Markets are volatile", "Past performance doesn't guarantee future results"
8. Focus on education, analysis, and information sharing - NOT advice or recommendations
9. End with engaging questions to promote discussion, not action
10. Keep content professional and informative (even with chaotic/satirical personas)
11. Use relevant hashtags for the specified platform
12. ${includeEmojis ? 'USE emojis strategically to enhance readability and engagement' : 'DO NOT use any emojis - text only'}
13. DO NOT include any notes, meta-commentary, or explanations about the content itself
14. DO NOT mention word limits, tone, or compliance in the response
15. Provide ONLY the final social media post content
16. Remember: Your content will be automatically checked for compliance - avoid anything that could be interpreted as financial advice

CONTENT STRUCTURE:
- Opening: Current market observation or educational insight
- Body: 2-3 key educational points or market analysis
- Engagement: Question to encourage discussion
- Hashtags: 3-5 relevant tags

COMPLIANT LANGUAGE EXAMPLES:
✅ GOOD: "Market data indicates...", "Research suggests...", "Analysts are observing..."
❌ BAD: "You should buy...", "This is a great opportunity...", "Don't miss this chance..."

✅ GOOD: "What do you think about these market trends?"
❌ BAD: "Are you ready to invest?", "Who's buying this dip?"

Generate a ${platform} post with these specifications:

TOPIC: ${topic}
PERSONA: ${persona}
PLATFORM: ${platform}
EMOJIS: ${includeEmojis ? 'Include relevant emojis to make content engaging and visually appealing' : 'Do NOT use any emojis - plain text only'}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}
${topicContext ? `\n${topicContext}` : ''}

WORD LIMIT: ${platform === 'twitter' ? '280 characters' : '300 words'}

Generate educational, neutral content that informs rather than advises. Always prioritize education over speculation and maintain strict neutrality. Your content will be automatically scanned for compliance violations. Respond with ONLY the social media post content, no additional notes or explanations.`

  const response = await ollama.generate({
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    prompt: prompt,
    options: {
      temperature: 0.7,
      num_predict: platform === 'twitter' ? 150 : 500,
    }
  })

  return response.response || ''
}

// OpenAI (commented out - using Ollama as fallback)
// async function generateWithOpenAI(topic: string, platform: string, persona: string, tone: string, additionalContext?: string) {
//   const systemPrompt = `You are an AI content creator for financial education. Your role is to create educational, neutral content that informs rather than advises.

// CRITICAL REQUIREMENTS:
// 1. NEVER provide buy/sell signals, trading advice, or investment recommendations
// 2. Focus on educational content, market analysis, and general insights
// 3. Use neutral language like "analysts suggest", "market data shows", "according to reports"
// 4. Include disclaimers about market volatility and risk
// 5. End with engaging questions to promote discussion
// 6. Keep content professional and informative
// 7. Use relevant hashtags for the specified platform

// CONTENT STRUCTURE:
// - Opening: Current market observation or educational insight
// - Body: 2-3 key educational points or market analysis
// - Engagement: Question to encourage discussion
// - Hashtags: 3-5 relevant tags

// Always prioritize education over speculation and maintain neutrality.`

//   const userPrompt = `Generate a ${platform} post with these specifications:

// TOPIC: ${topic}
// PERSONA: ${persona}
// TONE: ${tone}
// PLATFORM: ${platform}
// ${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

// WORD LIMIT: ${platform === 'twitter' ? '280 characters' : '300 words'}

// Generate educational, neutral content that informs rather than advises.`

//   const completion = await openai.chat.completions.create({
//     model: 'gpt-3.5-turbo',
//     messages: [
//       { role: 'system', content: systemPrompt },
//       { role: 'user', content: userPrompt }
//     ],
//     max_tokens: platform === 'twitter' ? 150 : 500,
//     temperature: 0.7,
//   })

//   return completion.choices[0]?.message?.content || ''
// }

// GET: Test AI models availability
export async function GET(request: NextRequest) {
  try {
    const results = {
      gemini: {
        available: [] as string[],
        tested: [] as string[],
        status: 'unknown' as 'working' | 'failed' | 'unknown'
      },
      ollama: {
        available: [] as string[],
        tested: [] as string[],
        status: 'unknown' as 'working' | 'failed' | 'unknown'
      }
      // openai: {
      //   available: [] as string[],
      //   tested: [] as string[],
      //   status: 'unknown' as 'working' | 'failed' | 'unknown'
      // }
    }

    // Test Gemini models
    const geminiModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
    results.gemini.tested = geminiModels
    
    for (const modelName of geminiModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Hello')
        const response = result.response.text()
        
        if (response) {
          results.gemini.available.push(modelName)
        }
      } catch (error: any) {
        console.log(`Gemini ${modelName} not available:`, error.message)
      }
    }
    
    results.gemini.status = results.gemini.available.length > 0 ? 'working' : 'failed'

    // Test Ollama models
    const ollamaModels = [process.env.OLLAMA_MODEL || 'llama3.2:3b', 'llama3.2:1b', 'llama3.1:8b']
    results.ollama.tested = ollamaModels
    
    for (const modelName of ollamaModels) {
      try {
        // First check if the model exists locally
        const models = await ollama.list()
        const modelExists = models.models.some((model: any) => model.name === modelName || model.name.startsWith(modelName))
        
        if (modelExists) {
          // Test the model with a simple prompt
          const response = await ollama.generate({
            model: modelName,
            prompt: 'Hello',
            options: { num_predict: 5 }
          })
          
          if (response.response) {
            results.ollama.available.push(modelName)
          }
        }
      } catch (error: any) {
        console.log(`Ollama ${modelName} not available:`, error.message)
      }
    }
    
    results.ollama.status = results.ollama.available.length > 0 ? 'working' : 'failed'

    // OpenAI (commented out - using Ollama as fallback)
    // const openaiModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o-mini']
    // results.openai.tested = openaiModels
    
    // for (const modelName of openaiModels) {
    //   try {
    //     const completion = await openai.chat.completions.create({
    //       model: modelName,
    //       messages: [
    //         { role: 'system', content: 'You are a helpful assistant.' },
    //         { role: 'user', content: 'Hello' }
    //       ],
    //       max_tokens: 5
    //     })
        
    //     if (completion.choices[0]?.message?.content) {
    //       results.openai.available.push(modelName)
    //     }
    //   } catch (error: any) {
    //     console.log(`OpenAI ${modelName} not available:`, error.message)
    //   }
    // }
    
    // results.openai.status = results.openai.available.length > 0 ? 'working' : 'failed'

    // Summary
    const totalAvailable = results.gemini.available.length + results.ollama.available.length
    const primaryWorking = results.gemini.status === 'working'
    const fallbackWorking = results.ollama.status === 'working'

    let systemStatus = 'Both AI providers are unavailable'
    if (primaryWorking && fallbackWorking) {
      systemStatus = 'Both Gemini (primary) and Ollama (fallback) are working perfectly'
    } else if (primaryWorking) {
      systemStatus = 'Gemini (primary) is working. Ollama fallback unavailable'
    } else if (fallbackWorking) {
      systemStatus = 'Gemini unavailable, but Ollama fallback is working'
    }

    return NextResponse.json({
      results,
      summary: {
        totalAvailable,
        primaryWorking,
        fallbackWorking,
        systemStatus
      },
      message: systemStatus,
      endpoint: '/api/social (GET) - Model Testing'
    })

  } catch (error: any) {
    console.error('Model test error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test AI models',
        details: error.message,
        endpoint: '/api/social (GET)'
      },
      { status: 500 }
    )
  }
}

// POST: Generate social media content
// Function to fetch topic context with fallback
async function getTopicContext(topicValue: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    console.log(`🔍 Fetching topic context from: ${baseUrl}/api/social/topics for topic: ${topicValue}`)
    
    // Fetch current topics with context (with timeout)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(`${baseUrl}/api/social/topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-cache', // Ensure we get fresh data
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch topics - Status: ${response.status} ${response.statusText}`)
      return generateFallbackContext(topicValue)
    }
    
    const data = await response.json()
    console.log(`📊 Found ${data.topics?.length || 0} topics, source: ${data.source}`)
    
    if (!data.topics || !Array.isArray(data.topics)) {
      console.error('❌ Invalid topics data structure received')
      return generateFallbackContext(topicValue)
    }
    
    const matchingTopic = data.topics.find((t: any) => t.value === topicValue)
    
    if (matchingTopic && matchingTopic.context) {
      console.log(`✅ Topic context found for: ${topicValue} (length: ${matchingTopic.context.length} chars)`)
      return matchingTopic.context
    } else {
      console.log(`⚠️ No matching topic found for value: ${topicValue}`)
      console.log(`Available topic values: ${data.topics.map((t: any) => t.value).slice(0, 5).join(', ')}${data.topics.length > 5 ? '...' : ''}`)
      return generateFallbackContext(topicValue)
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      console.error('❌ Topic context fetch timeout (10s)')
    } else {
      console.error('❌ Failed to fetch topic context:', error?.message || error)
    }
    return generateFallbackContext(topicValue)
  }
}

// Generate fallback context when API fetch fails
function generateFallbackContext(topicValue: string): string {
  const topicLabel = topicValue.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return `GENERAL MARKET CONTEXT:
This content is about ${topicLabel} in the financial markets. Key educational points to consider:

• Market conditions change rapidly and past performance doesn't guarantee future results
• Multiple factors influence market movements including economic data, geopolitical events, and sentiment
• Educational content should focus on analysis and insights rather than specific trading advice
• Always consider risk management and do your own research

This is educational content designed to inform readers about market trends and financial concepts. Market volatility is normal and should be expected.`
}

// Alternative method using direct database/cache access (future enhancement)
async function getTopicContextDirect(topicValue: string): Promise<string> {
  // This could be implemented to read from a local cache or database
  // to avoid network calls for better reliability
  console.log('🔄 Direct topic context access not implemented yet, using API fallback')
  return generateFallbackContext(topicValue)
}

export async function POST(request: NextRequest) {
  try {
    const { topic, platform, persona, includeEmojis, additionalContext } = await request.json()

    if (!topic || !platform || !persona || includeEmojis === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: topic, platform, persona, includeEmojis' },
        { status: 400 }
      )
    }

    // Fetch topic context to prevent hallucination
    console.log(`🔄 Fetching topic context for grounded generation... Topic: "${topic}"`)
    const topicContext = await getTopicContext(topic)
    if (topicContext) {
      console.log(`✅ Topic context retrieved successfully (${topicContext.length} characters)`)
      console.log(`📄 Context preview: ${topicContext.substring(0, 100)}...`)
    } else {
      console.log('⚠️ No topic context found, using basic generation')
      console.log('🔍 This could be due to: 1) Topic not found in API response, 2) Network error, 3) Missing context in topic data')
    }

    let content = ''
    let provider = ''

    // Try Gemini first (primary)
    try {
      console.log('Attempting content generation with Gemini...')
      content = await generateWithGemini(topic, platform, persona, includeEmojis, additionalContext, topicContext)
      provider = 'Gemini'
      console.log('✅ Gemini generation successful')
    } catch (geminiError: any) {
      console.log('❌ Gemini failed:', geminiError.message)
      
      // Fallback to Ollama
      try {
        console.log('🔄 Falling back to Ollama...')
        content = await generateWithOllama(topic, platform, persona, includeEmojis, additionalContext, topicContext)
        provider = 'Ollama'
        console.log('✅ Ollama fallback successful')
      } catch (ollamaError: any) {
        console.error('❌ Both providers failed:', {
          gemini: geminiError.message,
          ollama: ollamaError.message
        })
        
        // Return the most relevant error
        if (geminiError.message?.includes('quota') || ollamaError.message?.includes('quota')) {
          return NextResponse.json(
            { 
              error: 'Both AI providers have exceeded quotas. Please wait a few minutes and try again.',
              isQuotaError: true 
            },
            { status: 429 }
          )
        }
        
        // Check for Ollama-specific errors
        if (ollamaError.message?.includes('connection') || ollamaError.message?.includes('ECONNREFUSED')) {
          return NextResponse.json(
            { 
              error: 'Ollama server is not running. Please start Ollama and ensure llama3.2:3b model is installed.',
              isOllamaError: true 
            },
            { status: 503 }
          )
        }
        
        throw ollamaError // Throw the last error for generic handling
      }
    }

    // Additional safety check to remove any potential trading signals and meta-commentary
    const sanitizedContent = content
      // Remove trading signals
      .replace(/\b(buy|sell|long|short|invest in|trade|purchase)\b/gi, '')
      .replace(/\b(bullish|bearish) on \w+/gi, 'market sentiment suggests')
      .replace(/\b(strong buy|strong sell|hold)\b/gi, 'worth monitoring')
      // Remove meta-commentary and instructional notes
      .replace(/\(Note:.*?\)/gi, '')
      .replace(/\(This post.*?\)/gi, '')
      .replace(/\(The content.*?\)/gi, '')
      .replace(/\(The above.*?\)/gi, '')
      .replace(/\(Please note.*?\)/gi, '')
      .replace(/\(Remember.*?\)/gi, '')
      .replace(/\(Disclaimer.*?\)/gi, '')
      .replace(/Note:\s*.*?(?=\n|$)/gi, '')
      .replace(/\*Note:.*?\*/gi, '')
      .replace(/\*\*Note:.*?\*\*/gi, '')
      .replace(/\(Within.*?word.*?limit.*?\)/gi, '')
      .replace(/\(Maintains.*?tone.*?\)/gi, '')
      .replace(/\(No.*?investment.*?advice.*?\)/gi, '')
      .replace(/\(Educational.*?purposes.*?\)/gi, '')
      .replace(/\(Neutral.*?perspective.*?\)/gi, '')
      .replace(/\(This.*?complies.*?\)/gi, '')
      .replace(/\(Word count.*?\)/gi, '')
      .replace(/\(Character count.*?\)/gi, '')
      .replace(/\(Stays within.*?limit.*?\)/gi, '')
      .replace(/\*This post.*?\*/gi, '')
      .replace(/\*The content.*?\*/gi, '')
      // Clean up extra whitespace and line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple line breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .replace(/\n +/g, '\n') // Remove leading spaces on new lines
      .replace(/ +\n/g, '\n') // Remove trailing spaces before line breaks
      .trim()

    return NextResponse.json({ 
      content: sanitizedContent,
      provider,
      message: provider === 'Ollama' ? 'Generated using Ollama (Gemini fallback)' : 'Generated using Gemini',
      endpoint: '/api/social (POST) - Content Generation'
    })

  } catch (error: any) {
    console.error('Content generation error:', error)
    
    // Handle API key errors
    if (error.status === 401 || error.message?.includes('Invalid API key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your API configuration.' },
        { status: 401 }
      )
    }
    
    // Handle rate limits
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please wait a moment before trying again.',
          isQuotaError: true 
        },
        { status: 429 }
      )
    }
    
    // Handle model availability
    if (error.status === 404 || error.message?.includes('model')) {
      return NextResponse.json(
        { error: 'AI models temporarily unavailable. Please try again later.' },
        { status: 404 }
      )
    }
    
    // Handle bad requests
    if (error.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request. Please check your input parameters.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
}