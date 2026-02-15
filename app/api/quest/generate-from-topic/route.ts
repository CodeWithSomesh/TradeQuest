/**
 * POST /api/quest/generate-from-topic
 * Generates a complete personalized quest based on user's topic inquiry
 * Includes real-time trading data for maximum memorability
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

const LessonPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().describe('Educational content with real examples from user trades'),
  realWorldExample: z.string().describe('Example from user\'s actual trading data'),
  keyTakeaway: z.string(),
})

const GeneratedQuestSchema = z.object({
  questId: z.string(),
  title: z.string().describe('Quest title based on user topic'),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Based on user experience level'),
  estimatedTime: z.string().describe('How long quest takes'),
  xpReward: z.number(),
  lessons: z.array(LessonPageSchema).length(5).describe('5 educational lessons with real trade examples'),
  relatedTopics: z.array(z.string()).max(3),
})

export type GeneratedQuest = z.infer<typeof GeneratedQuestSchema>

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userTopic, userProfile, trades, stats } = body

    if (!userTopic || typeof userTopic !== 'string') {
      return NextResponse.json(
        { error: 'userTopic is required and must be a string' },
        { status: 400 }
      )
    }

    const aiModelResult = getAIModel()
    if (!aiModelResult) {
      return NextResponse.json(
        { error: 'No AI API key configured' },
        { status: 500 }
      )
    }

    // Build context from profile and trades
    const profileContext = userProfile
      ? `
Trader Profile:
- Name: ${userProfile.full_name || 'Trader'}
- Experience: ${userProfile.experience_level || 'Intermediate'}
- Challenge: ${userProfile.primary_challenge || 'Risk management'}
- Focus: ${userProfile.recommended_focus || 'Discipline'}
- Discipline Score: ${userProfile.disciplineScore || 'N/A'}
`
      : ''

    // Select relevant winning and losing trades to illustrate concepts
    const relevantTrades = trades && trades.length > 0
      ? [
          ...trades.filter((t: any) => t.outcome === 'Win').slice(0, 2),
          ...trades.filter((t: any) => t.outcome === 'Loss').slice(0, 2),
        ]
        .slice(0, 4)
      : []

    const tradesContext = relevantTrades.length > 0
      ? `Recent Relevant Trades (Mix of wins and losses):
${relevantTrades
  .map(
    (t: any) =>
      `- ${t.instrument || 'Unknown'} (${t.contractType || 'N/A'}): ${t.outcome} | P&L: ${t.pnl || '0'} | Duration: ${t.durationSeconds || '?'}s | Time: ${t.time || 'N/A'}`
  )
  .join('\n')}`
      : ''

    const performanceContext = stats
      ? `Trading Statistics:
- Win Rate: ${stats.winRate || 0}%
- Total Trades: ${stats.totalTrades || 0}
- Current Streak: ${stats.streak || 0}
- Total P&L: ${stats.totalPnl || 0}`
      : ''

    const prompt = `You are an expert trading educator. Create a highly personalized, practical quest that teaches about "${userTopic}".

${profileContext}

${performanceContext}

${tradesContext}

CRITICAL INSTRUCTIONS:
1. The quest should directly address the user's topic inquiry
2. Include specific references to their actual trades in the lessons (make it ultra-memorable)
3. Include both winning and losing trade examples where relevant
4. Tailor difficulty based on their experience level
5. Focus on behavioral improvement and risk management
6. Each lesson should have:
   - Clear title and educational content
   - A specific real example from their trading history
   - One key takeaway they should remember

Create a quest that will make the user think "Oh! I did something exactly like this in my trading!"

DO NOT provide buy/sell signals. Focus purely on education and behavioral patterns.`

    // Use temperature for more creative generation
    const { object } = await generateObject({
      model: aiModelResult.model,
      schema: GeneratedQuestSchema,
      prompt,
      temperature: 0.9,
    })

    const quest: GeneratedQuest = {
      ...object,
      questId: `quest-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }

    return NextResponse.json(quest, { status: 200 })
  } catch (error) {
    console.error('[Generate Quest] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate quest',
      },
      { status: 500 }
    )
  }
}
