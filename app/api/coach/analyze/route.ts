/**
 * POST /api/coach/analyze
 * AI-powered behavioral analysis of trading patterns.
 * Returns discipline score, emotional state, patterns, and coaching insights.
 *
 * CRITICAL: This endpoint NEVER provides buy/sell signals or trading recommendations.
 * It ONLY analyzes behavioral patterns, discipline, and emotional state.
 */
import { generateObject } from 'ai'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

const CoachAnalysisSchema = z.object({
  disciplineScore: z.number().min(0).max(100).describe('Behavioral discipline score 0-100'),
  emotionalState: z.enum(['Stable', 'Cautious', 'Elevated', 'High Risk']),
  revengeTradingRisk: z.enum(['Low', 'Medium', 'High']),
  patterns: z.array(
    z.object({
      type: z.enum(['positive', 'warning', 'info']),
      text: z.string().describe('Specific behavioral pattern observed — no buy/sell signals'),
    })
  ).describe('Behavioral patterns detected (3-6 items)'),
  coachMessage: z.string().describe('Main coaching insight, 2-3 sentences, specific to this trader — no buy/sell signals'),
  suggestions: z.array(z.string()).describe('3 actionable behavioral suggestions — no market advice'),
  tradeNotes: z.record(z.string(), z.string()).describe('Brief behavioral note per noteworthy trade ID (up to 5)'),
})

export type CoachAnalysis = z.infer<typeof CoachAnalysisSchema>

const FALLBACK: CoachAnalysis = {
  disciplineScore: 50,
  emotionalState: 'Stable',
  revengeTradingRisk: 'Low',
  patterns: [],
  coachMessage: 'Connect to Deriv and trade to receive AI coaching insights.',
  suggestions: [],
  tradeNotes: {},
}

export async function POST(request: NextRequest) {
  try {
    const aiModel = getAIModel()
    if (!aiModel) {
      return NextResponse.json(
        { ...FALLBACK, coachMessage: 'No AI API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local.' },
        { status: 200 }
      )
    }

    const body = await request.json()
    const { trades, stats, profile } = body

    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { ...FALLBACK, coachMessage: 'No trades to analyze yet. Start trading and the AI Coach will analyze your patterns.' },
        { status: 200 }
      )
    }

    const tradeSummary = trades.slice(0, 35).map((t: Record<string, unknown>) => ({
      id: t.id,
      instrument: t.instrument,
      type: t.contractType,
      outcome: t.outcome,
      pnl: t.pnl,
      time: t.time,
      sellTime: t.sellTime,
      purchaseTime: t.purchaseTime,
      durationSeconds: t.durationSeconds,
      shortcode: t.shortcode,
    }))

    // Detect potential revenge trading: trades placed quickly after losses
    const revengeSignals = trades
      .slice(0, 20)
      .map((t: Record<string, unknown>, i: number) => (t.outcome === 'Loss' ? i : -1))
      .filter((i: number) => i >= 0)
      .filter((i: number) => {
        if (i === 0) return false
        const thisTime = Number((trades[i - 1] as Record<string, unknown>)?.sellTime) || 0
        const lossTime = Number((trades[i] as Record<string, unknown>)?.sellTime) || 0
        return lossTime > 0 && thisTime > 0 && (lossTime - thisTime) < 180
      }).length

    const profileContext = profile
      ? `\nTrader Profile:\n- Name: ${profile.full_name || 'Unknown'}\n- Experience: ${profile.experience_level || 'Unknown'}\n- Trading Timeline: ${profile.trading_timeline || 'Unknown'}\n- Primary Challenge: ${profile.primary_challenge || 'Unknown'}\n- Preferred Products: ${profile.preferred_product || 'Unknown'}\n- Risk Factor: ${profile.risk_factor || 'Unknown'}\n- Recommended Focus: ${profile.recommended_focus || 'Unknown'}\n`
      : ''

    const { object } = await generateObject({
      model: aiModel.model,
      schema: CoachAnalysisSchema,
      prompt: `You are an expert AI trading behavioral coach. Analyze trading BEHAVIOR only — patterns, discipline, emotional state, and risk management. NEVER provide buy/sell signals, price predictions, or market recommendations. Only behavioral insights.
${profileContext}
TRADING DATA:
- Recent ${tradeSummary.length} trades: ${JSON.stringify(tradeSummary)}
- Overall stats: ${JSON.stringify(stats)}
- Revenge trading signals detected: ${revengeSignals}

Analyze for: revenge trading (trades quickly after losses), overtrading, win/loss streak behavior, time-of-day patterns, hold-time discipline (durationSeconds), instrument consistency. Make all insights specific to this trader's actual data. Be warm and constructive. tradeNotes keys must be the trade's numeric ID as a string.`,
    })

    return NextResponse.json(object)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'AI analysis failed'
    console.error('[coach/analyze] error:', message)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}
