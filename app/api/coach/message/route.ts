/**
 * POST /api/coach/message
 * Generates a single AI coaching message for the Chrome extension.
 * Called after each trade (win or loss) to provide real-time AI feedback.
 *
 * CRITICAL: This endpoint NEVER provides buy/sell signals or trading recommendations.
 */
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function POST(request: NextRequest) {
  try {
    const aiModel = getAIModel()
    if (!aiModel) {
      return NextResponse.json({ message: null }, { status: 200, headers: corsHeaders() })
    }

    const body = await request.json()
    const {
      event_type,
      amount,
      balance,
      currency,
      wins,
      losses,
      streak,
      session_start_balance,
      is_revenge_trading,
      loss_percent,
      total_session_trades,
    } = body

    const sessionPnl = balance && session_start_balance
      ? (Number(balance) - Number(session_start_balance)).toFixed(2)
      : 'unknown'

    const revengeNote = is_revenge_trading ? '- ALERT: Trade placed shortly after a loss - possible revenge trading pattern! Focus on this gently but clearly.' : ''
    const significantLossNote = Number(loss_percent) >= 10 ? '- This is a significant loss - suggest taking a break.' : ''
    const winStreakNote = streak && Number(streak) >= 3 ? '- Acknowledge the winning streak but remind about discipline.' : ''
    const lossStreakNote = streak && Number(streak) <= -3 ? '- The trader is on a losing streak - be empathetic and suggest a pause.' : ''

    const { text } = await generateText({
      model: aiModel.model,
      prompt: `You are a friendly, supportive AI trading behavioral coach embedded in a live trading platform. A trader just completed a trade. Generate a brief coaching message (1-2 sentences, max 40 words).

ABSOLUTE RULES:
- NEVER provide buy/sell signals, price predictions, or trading recommendations
- NEVER suggest specific instruments to trade
- ONLY address behavior, discipline, emotional management, and risk
- Be warm, encouraging on wins, supportive on losses
- Vary your language - never repeat the same phrases
- Use natural, conversational tone

TRADE CONTEXT:
- Event: ${event_type} (${event_type === 'win' ? 'PROFITABLE' : 'LOSING'} trade)
- Amount: ${Math.abs(Number(amount))} ${currency || 'USD'}
- Current balance: ${balance} ${currency || 'USD'}
- Session starting balance: ${session_start_balance} ${currency || 'USD'}
- Session P&L: ${sessionPnl} ${currency || 'USD'}
- Session stats: ${wins} wins, ${losses} losses (${total_session_trades || (wins + losses)} total trades)
- Current streak: ${streak} (positive=winning, negative=losing)
${revengeNote}
${significantLossNote}
${winStreakNote}
${lossStreakNote}

Return ONLY the coaching message text. No JSON, no formatting, just the message.`,
    })

    // Safety: strip any accidental buy/sell language
    const forbidden = /\b(buy|sell|long|short|enter|exit)\s+(now|at|this|the|position)/gi
    const safeMessage = text.replace(forbidden, '').trim()

    return NextResponse.json({ message: safeMessage }, { headers: corsHeaders() })
  } catch (e: unknown) {
    console.error('[coach/message] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ message: null }, { status: 200, headers: corsHeaders() })
  }
}
