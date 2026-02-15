import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

const AnswerSchema = z.object({
  id: z.string(),
  text: z.string().describe('Answer option — 1-2 lines'),
  isCorrect: z.boolean(),
  explanation: z.string().describe('Why this answer is correct or incorrect — 2-3 sentences'),
})

const QuestPageSchema = z.object({
  id: z.string(),
  title: z.string().describe('Short title for this question'),
  story: z.string().describe('Trading scenario — max 3 sentences'),
  answers: z.array(AnswerSchema).length(3),
})

const QuestDataSchema = z.object({
  pages: z.array(QuestPageSchema).length(5),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { questId, questTitle, userProfile } = body

    if (!questTitle) {
      return NextResponse.json({ message: 'Quest title is required' }, { status: 400 })
    }

    const aiModel = getAIModel()
    if (!aiModel) {
      return NextResponse.json({ message: 'No AI API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local.' }, { status: 500 })
    }

    // Build personalization context from real profile (StoredProfile fields)
    const profileContext = userProfile
      ? `
Trader Profile (personalize the scenarios accordingly):
- Experience Level: ${userProfile.experience_level || userProfile.tradingStyle || 'Not specified'}
- Preferred Products/Markets: ${userProfile.preferred_product || (userProfile.instruments || []).join(', ') || 'Not specified'}
- Trading Timeline: ${userProfile.trading_timeline || userProfile.riskTolerance || 'Not specified'}
- Primary Challenge: ${userProfile.primary_challenge || userProfile.learningGoals || 'Not specified'}
- Recommended Focus: ${userProfile.recommended_focus || 'Not specified'}
`
      : ''

    const { object } = await generateObject({
      model: aiModel.model,
      schema: QuestDataSchema,
      prompt: `You are an expert trading educator. Generate 5 interactive quiz questions for a trading quest titled "${questTitle}".
${profileContext}
Requirements:
1. Create 5 realistic trading scenarios (1-3 sentences each) specific to this quest topic
2. Personalize scenarios to match the trader's profile — use their preferred instruments/markets where relevant
3. Each question has exactly 3 multiple choice answers
4. Exactly ONE answer must be correct (isCorrect: true), the other two false
5. Explanations should be educational (2-3 sentences)
6. Questions should progress in difficulty from basic to advanced
7. Page IDs must be "quest-${questId}-page-1" through "quest-${questId}-page-5"
8. Answer IDs must be "q1-a", "q1-b", "q1-c" (increment question number per page)
9. Focus on practical trading decisions and real concepts — no buy/sell signals`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Quest generation error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to generate quest' },
      { status: 500 }
    )
  }
}
