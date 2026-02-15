/**
 * POST /api/quest/ai-chat
 * Streaming chat endpoint for generating personalized trading quests
 * Takes user question about trading topics and generates custom quests
 */

import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, userProfile, trades, stats } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      )
    }

    const aiModelResult = getAIModel()
    if (!aiModelResult) {
      return NextResponse.json(
        { error: 'No AI API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local.' },
        { status: 500 }
      )
    }

    // Build rich context from user profile and trading data
    const profileContext = userProfile
      ? `
Trader Profile:
- Full Name: ${userProfile.full_name || 'Unknown'}
- Experience Level: ${userProfile.experience_level || 'Not specified'}
- Trading Style: ${userProfile.tradingStyle || 'Not specified'}
- Primary Challenge: ${userProfile.primary_challenge || 'Not specified'}
- Recommended Focus: ${userProfile.recommended_focus || 'Not specified'}
- Risk Tolerance: ${userProfile.riskTolerance || 'Not specified'}
`
      : ''

    // Include recent trading performance
    const tradingContext = trades && trades.length > 0
      ? `
Recent Trading Performance:
- Total Trades: ${stats?.totalTrades || 0}
- Win Rate: ${stats?.winRate || 0}%
- Wins: ${stats?.wins || 0} | Losses: ${stats?.losses || 0}
- Net P&L: ${stats?.totalPnl || 0}
- Current Streak: ${stats?.streak || 0}

Recent Trades Sample (first 5):
${trades
  .slice(0, 5)
  .map(
    (t: any) =>
      `  - ${t.instrument} (${t.contractType || 'N/A'}): ${t.outcome} | P&L: ${t.pnl} | Time: ${t.time}`
  )
  .join('\n')}
`
      : ''

    const systemPrompt = `You are an expert trading mentor and personalized quest generator. Your role is to:

1. Listen to the user's trading topic interest (e.g., "How good is Apple stock?", "What is technical analysis?")
2. Based on their profile and trading history, create personalized trading education quests
3. Make quests practical and memorable by including examples from their ACTUAL trading data
4. Each quest should include:
   - Clear learning objectives
   - Real-world scenarios from their trades
   - Actionable insights specific to their trading style
   - Risk management principles tailored to their experience level

${profileContext}

${tradingContext}

IMPORTANT GUIDELINES:
- Do NOT provide buy/sell signals or trading recommendations
- Focus on education and behavioral improvement
- Make lessons memorable by connecting to user's real trade data
- Consider user's primary challenge and recommended focus when creating quests
- Be encouraging but honest about what they need to improve`

    const result = await streamText({
      model: aiModelResult.model,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.8,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[AI Chat Quest] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
