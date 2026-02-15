/**
 * POST /api/challenges/generate
 * Uses AI to pick the most relevant challenge for this trader and write a
 * personalized 2-3 sentence description based on their profile and weaknesses.
 *
 * Falls back to deterministic challenge selection if no AI key is configured.
 * Supports both GEMINI_API_KEY and OPENAI_API_KEY (via lib/ai-provider).
 */
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'
import { CHALLENGE_TEMPLATES, weaknessToChallengeId, type ChallengeWeakness } from '@/lib/challenge-types'

const ChallengeSelectionSchema = z.object({
  challengeId: z
    .enum(['discipline_test', 'risk_manager', 'patience_builder', 'strategy_follower', 'loss_limiter', 'focus_builder'])
    .describe('The most relevant challenge ID for this trader'),
  personalizedDescription: z
    .string()
    .describe('2-3 personalized sentences explaining why this challenge was chosen and what it will fix for THIS trader specifically. Warm, motivating coach tone.'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { profileSummary, aiWeakness } = body as {
      profileSummary?: string
      aiWeakness?: string
    }

    const aiModel = getAIModel()

    // No AI key — deterministic selection based on weakness
    if (!aiModel) {
      const challengeId = aiWeakness
        ? weaknessToChallengeId(aiWeakness as ChallengeWeakness)
        : 'discipline_test'
      const template = CHALLENGE_TEMPLATES[challengeId]
      return NextResponse.json({
        challengeId,
        personalizedDescription: template.description,
      })
    }

    const { object } = await generateObject({
      model: aiModel.model,
      schema: ChallengeSelectionSchema,
      prompt: `You are a professional trading behavioral coach. Select the single most impactful challenge for this trader and write a short personalized description.

Available challenges:
- discipline_test: targets revenge trading (waiting 30 min after a loss)
- risk_manager: targets poor position sizing (max 2% risk per trade)
- patience_builder: targets early exits (letting winners hit full TP)
- strategy_follower: targets FOMO / impulsive entries (strategy-only entries)
- loss_limiter: targets loss spirals (hard stop after 3 consecutive losses)
- focus_builder: targets instrument scatter (max 2 instruments per session)

Trader context:
${profileSummary ? `Profile: ${profileSummary}` : ''}
${aiWeakness ? `Primary AI-identified weakness: ${aiWeakness}` : ''}

Choose the single most important challenge for this specific trader. In personalizedDescription, acknowledge their specific pattern (2-3 sentences). Be direct, specific, motivating. Do NOT mention buy/sell signals or market predictions.`,
    })

    return NextResponse.json(object)
  } catch (e) {
    console.error('[challenges/generate] error:', e instanceof Error ? e.message : e)
    // Graceful fallback
    return NextResponse.json({
      challengeId: 'discipline_test',
      personalizedDescription: CHALLENGE_TEMPLATES.discipline_test.description,
    })
  }
}
