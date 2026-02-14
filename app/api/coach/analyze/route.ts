/**
 * POST /api/coach/analyze
 * AI-powered behavioral analysis of trading patterns using Gemini.
 * Returns discipline score, emotional state, patterns, coaching insights.
 *
 * CRITICAL: This endpoint NEVER provides buy/sell signals or trading recommendations.
 * It ONLY analyzes behavioral patterns, discipline, and emotional state.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type CoachAnalysis = {
  disciplineScore: number
  emotionalState: string
  revengeTradingRisk: string
  patterns: { type: 'positive' | 'warning' | 'info'; text: string }[]
  coachMessage: string
  suggestions: string[]
  tradeNotes: Record<string, string>
}

const FALLBACK: CoachAnalysis = {
  disciplineScore: 50,
  emotionalState: 'Unknown',
  revengeTradingRisk: 'Unknown',
  patterns: [],
  coachMessage: 'Connect to Deriv and trade to receive AI coaching insights.',
  suggestions: [],
  tradeNotes: {},
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { ...FALLBACK, coachMessage: 'GEMINI_API_KEY not configured. Add it to .env.local to enable AI coaching.' },
        { status: 200 }
      )
    }

    const body = await request.json()
    const { trades, stats } = body

    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { ...FALLBACK, coachMessage: 'No trades to analyze yet. Start trading and the AI Coach will analyze your patterns.' },
        { status: 200 }
      )
    }

    // Use gemini-pro: stable model used across the project
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // Prepare trade summary including enriched data for better behavioral analysis
    const tradeSummary = trades.slice(0, 35).map((t: Record<string, unknown>) => ({
      id: t.id,
      instrument: t.instrument,
      type: t.contractType,
      outcome: t.outcome,
      pnl: t.pnl,
      buyPrice: t.buyPrice,
      sellPrice: t.sellPrice,
      time: t.time,
      sellTime: t.sellTime,
      purchaseTime: t.purchaseTime,
      durationSeconds: t.durationSeconds,
      shortcode: t.shortcode,
      raw: t.raw,
    }))

    // Detect potential revenge trading: trades placed quickly after losses
    const lossIndices = trades
      .slice(0, 20)
      .map((t: Record<string, unknown>, i: number) => (t.outcome === 'Loss' ? i : -1))
      .filter((i: number) => i >= 0)

    const revengeSignals = lossIndices.filter((i: number) => {
      if (i === 0) return false
      const thisTime = trades[i - 1]?.sellTime || 0
      const lossTime = trades[i]?.sellTime || 0
      return lossTime > 0 && thisTime > 0 && (lossTime - thisTime) < 180 // within 3 min
    }).length

    const prompt = `You are an expert AI trading behavioral coach. Your SOLE purpose is to analyze trading BEHAVIOR - patterns, discipline, emotional state, and risk management.

ABSOLUTE RULES (NEVER VIOLATE):
1. NEVER provide buy/sell signals or price predictions
2. NEVER recommend specific instruments or trading strategies
3. NEVER suggest entry/exit points or timing for trades
4. ONLY analyze behavioral patterns, discipline, and emotional management
5. Be supportive, warm, and constructive - like a good coach
6. Keep insights actionable and specific to the trader's actual behavior

TRADING DATA:
- Recent ${tradeSummary.length} trades: ${JSON.stringify(tradeSummary)}
- Overall stats: ${JSON.stringify(stats)}
- Potential revenge trading signals detected: ${revengeSignals}

ANALYSIS REQUIRED:
Look for these behavioral patterns:
1. Revenge trading (trading quickly after losses to recover)
2. Overtrading (too many trades in short period)
3. Position sizing consistency
4. Win/loss streak behavior (does trader change behavior during streaks?)
5. Time-of-day patterns (use sellTime/purchaseTime when available)
6. Instrument hopping (switching instruments erratically)
7. Hold-time discipline: when durationSeconds is present, infer whether the trader holds to expiry vs closes early (e.g. cutting winners too soon or holding losers too long). Use only for behavioral insight, never market advice.
8. When raw.barrier, raw.entry_spot or raw.exit_spot are present, use only for context on risk/contract type; do not give market or price advice.

Return ONLY valid JSON (no markdown formatting, no code blocks) with this exact structure:
{
  "disciplineScore": <number 0-100>,
  "emotionalState": "<Stable|Cautious|Elevated|High Risk>",
  "revengeTradingRisk": "<Low|Medium|High>",
  "patterns": [
    {"type": "<positive|warning|info>", "text": "<specific behavioral pattern observed>"}
  ],
  "coachMessage": "<Main coaching insight, 2-3 sentences, specific to this trader's data>",
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
  "tradeNotes": {"<trade_id>": "<brief behavioral note for this specific trade>"}
}

Provide tradeNotes for the 5 most noteworthy trades only. Make all insights specific to the data provided.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed: CoachAnalysis
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        ...FALLBACK,
        coachMessage: text.slice(0, 500),
      }
    }

    // Safety check: strip any accidental buy/sell language
    const forbidden = /\b(buy|sell|long|short|enter|exit)\s+(now|at|this|the|position)/gi
    if (forbidden.test(parsed.coachMessage)) {
      parsed.coachMessage = parsed.coachMessage.replace(forbidden, '[removed]')
    }
    parsed.patterns = parsed.patterns.map(p => ({
      ...p,
      text: p.text.replace(forbidden, '[removed]'),
    }))

    return NextResponse.json(parsed)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'AI analysis failed'
    console.error('[coach/analyze] error:', message)
    return NextResponse.json(FALLBACK, { status: 200 })
  }
}
