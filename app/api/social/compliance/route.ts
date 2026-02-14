import { GoogleGenerativeAI } from '@google/generative-ai'
import { Ollama } from 'ollama'
import { NextRequest, NextResponse } from 'next/server'

// Initialize both AI providers
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const ollama = new Ollama({ 
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' 
})

// Pre-check for obvious non-compliant patterns (keyword-based detection)
function preCheckCompliance(content: string): { isCompliant: boolean, reason?: string } {
  const lowerContent = content.toLowerCase()
  
  // Only check for most obvious direct recommendations
  const directPatterns = [
    /\b(buy now|sell now|buy immediately|sell immediately)\b/,
    /\b(must buy|must sell)\b/,
  ]
  
  // Extreme FOMO and pressure tactics (most problematic)
  const fomoPatterns = [
    /\b(hurry|act fast|get in now|jump in|don't wait)\b/,
    /\b(before it's too late|limited time|won't last long)\b/,
  ]
  
  // Extreme performance predictions (guarantees)
  const predictionPatterns = [
    /\b(guaranteed|sure thing|can't lose|risk-free)\b/,
    /\b(going to moon|to the moon|massive gains)\b/,
  ]
  
  const allPatterns = [
    ...directPatterns, 
    ...fomoPatterns, 
    ...predictionPatterns
  ]
  
  for (const pattern of allPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        isCompliant: false,
        reason: `Content contains obvious non-compliant language detected by keyword analysis`
      }
    }
  }
  
  return { isCompliant: true }
}

// Check compliance using Gemini AI (primary)
async function checkComplianceWithGemini(content: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a nuanced, moderately strict compliance checker for financial content. Be thoughtful and balanced in your analysis - not overly permissive, but also not unnecessarily harsh. Focus on flagging content that contains clear financial advice or recommendations.

CONTENT TO CHECK:
"${content}"

COMPLIANCE RULES - FLAG AS NON-COMPLIANT IF CONTENT CONTAINS:

DIRECT FINANCIAL ADVICE (ALWAYS FLAG):
1. Explicit buy/sell recommendations: "buy now", "sell immediately", "should invest in", "time to purchase"
2. Direct trading instructions: "go long on", "short this stock", "exit your position"
3. Specific timing advice: "buy before earnings", "sell at resistance level"

STRONG RECOMMENDATIONS (FLAG):
4. Conditional advice: "if I were you, I'd buy", "you should consider investing in"
5. FOMO pressure: "hurry before it's too late", "limited time opportunity", "act fast"
6. Performance guarantees: "guaranteed returns", "sure thing", "can't lose", "risk-free"

ACCEPTABLE CONTENT (DO NOT FLAG):
- General market observations: "Bitcoin has risen 10%", "analysts expect volatility"
- Educational content: "diversification reduces risk", "understand your risk tolerance"
- Historical analysis: "traditionally, gold performs well during uncertainty"
- Neutral discussions: "some investors prefer", "market sentiment suggests"
- Opinion sharing without advice: "I think", "I believe", "in my view" (when not giving direct advice)
- Analytical terms: "bullish sentiment", "bearish trends", "market looks attractive" (when used analytically)

BE NUANCED AND MODERATELY STRICT:
- Consider context and intent, not just keywords
- Educational and analytical content should generally pass
- Focus on protecting against direct advice and strong recommendations
- Allow market commentary and educational discussions
- When in doubt about borderline cases, lean slightly towards compliance for educational content

RESPONSE FORMAT:
Respond with ONLY a JSON object in this exact format:
{
  "isCompliant": true/false,
  "reason": "Brief explanation if not compliant, empty string if compliant"
}

Do not include any other text, explanations, or formatting - just the JSON object.`

  const result = await model.generateContent(prompt)
  const response = result.response.text().trim()
  
  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse Gemini response:', response)
    // If parsing fails, default to non-compliant for safety
    return {
      isCompliant: false,
      reason: 'Unable to verify compliance - please review content manually'
    }
  }
}

// Check compliance using Ollama (fallback)
async function checkComplianceWithOllama(content: string) {
  const prompt = `You are a nuanced, moderately strict compliance checker for financial content. Be thoughtful and balanced in your analysis - not overly permissive, but also not unnecessarily harsh. Focus on flagging content that contains clear financial advice or recommendations.

CONTENT TO CHECK:
"${content}"

COMPLIANCE RULES - FLAG AS NON-COMPLIANT IF CONTENT CONTAINS:

DIRECT FINANCIAL ADVICE (ALWAYS FLAG):
1. Explicit buy/sell recommendations: "buy now", "sell immediately", "time to purchase"
2. Direct trading instructions: "go long on", "short this stock", "exit your position"
3. Specific timing advice: "buy before", "sell at resistance level"

STRONG RECOMMENDATIONS (FLAG):
4. Conditional advice: "if I were you, I'd buy", "you should consider investing in"
5. FOMO pressure: "hurry before it's too late", "limited time opportunity", "act fast"
6. Performance guarantees: "guaranteed returns", "sure thing", "can't lose", "risk-free"

ACCEPTABLE CONTENT (DO NOT FLAG):
- General market observations: "Bitcoin has risen 10%", "analysts expect volatility"
- Educational content: "diversification reduces risk", "understand your risk tolerance"
- Historical analysis: "traditionally, gold performs well during uncertainty"
- Neutral discussions: "some investors prefer", "market sentiment suggests"
- Opinion sharing without advice: "I think", "I believe", "in my view" (when not giving direct advice)
- Analytical terms: "bullish sentiment", "bearish trends", "market looks attractive" (when used analytically)

BE NUANCED AND MODERATELY STRICT:
- Consider context and intent, not just keywords
- Educational and analytical content should generally pass
- Focus on protecting against direct advice and strong recommendations
- Allow market commentary and educational discussions
- When in doubt about borderline cases, lean slightly towards compliance for educational content

RESPONSE FORMAT:
Respond with ONLY a JSON object in this exact format:
{
  "isCompliant": true/false,
  "reason": "Brief explanation if not compliant, empty string if compliant"
}

Do not include any other text, explanations, or formatting - just the JSON object.`

  const response = await ollama.generate({
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    prompt: prompt,
    options: {
      temperature: 0.1, // Slightly more flexible for nuanced analysis
      num_predict: 150, // Allow slightly more tokens for detailed reasons
    }
  })

  const responseText = response.response.trim()
  
  try {
    return JSON.parse(responseText)
  } catch (error) {
    console.error('Failed to parse Ollama response:', responseText)
    // If parsing fails, default to non-compliant for safety
    return {
      isCompliant: false,
      reason: 'Unable to verify compliance - please review content manually'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    // First, do a quick keyword-based pre-check for obvious violations only
    const preCheck = preCheckCompliance(content)
    if (!preCheck.isCompliant) {
      return NextResponse.json({
        isCompliant: false,
        reason: preCheck.reason
      })
    }

    let complianceResult = null

    // Try Gemini first (primary)
    try {
      console.log('Checking compliance with Gemini...')
      complianceResult = await checkComplianceWithGemini(content)
      console.log('✅ Gemini compliance check successful')
    } catch (geminiError: any) {
      console.log('❌ Gemini compliance check failed:', geminiError.message)
      
      // Fallback to Ollama
      try {
        console.log('🔄 Falling back to Ollama for compliance check...')
        complianceResult = await checkComplianceWithOllama(content)
        console.log('✅ Ollama compliance check successful')
      } catch (ollamaError: any) {
        console.error('❌ Both compliance checks failed:', {
          gemini: geminiError.message,
          ollama: ollamaError.message
        })
        
        // If both fail, default to non-compliant for safety
        return NextResponse.json({
          isCompliant: false,
          reason: 'Unable to verify compliance due to technical issues. Please review content manually.'
        })
      }
    }

    return NextResponse.json({
      isCompliant: complianceResult.isCompliant,
      reason: complianceResult.reason || ''
    })

  } catch (error: any) {
    console.error('Compliance check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check compliance',
        isCompliant: false,
        reason: 'Technical error occurred during compliance check'
      },
      { status: 500 }
    )
  }
}