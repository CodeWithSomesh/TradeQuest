/**
 * POST /api/coach/message
 * Generates a single AI coaching message for the Chrome extension.
 * Called after each trade (win or loss) to provide real-time AI feedback.
 *
 * CRITICAL: This endpoint NEVER provides buy/sell signals or trading recommendations.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

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
    if (!process.env.GEMINI_API_KEY) {
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

    // Use gemini-pro: stable model used across the project
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const sessionPnl = balance && session_start_balance
      ? (Number(balance) - Number(session_start_balance)).toFixed(2)
      : 'unknown'

    const prompt = `You are a friendly, supportive AI trading behavioral coach embedded in a live trading platform. A trader just completed a trade. Generate a brief coaching message (1-2 sentences, max 40 words).

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
${is_revenge_trading ? '- ALERT: Trade placed shortly after a loss - possible revenge trading pattern!' : ''}
${loss_percent ? `- This loss represents ${Number(loss_percent).toFixed(1)}% of session capital` : ''}

${is_revenge_trading ? 'Focus on the revenge trading pattern - gently but clearly address it.' : ''}
${Number(loss_percent) >= 10 ? 'This is a significant loss - suggest taking a break.' : ''}
${streak && Number(streak) >= 3 ? 'Acknowledge the winning streak but remind about discipline.' : ''}
${streak && Number(streak) <= -3 ? 'The trader is on a losing streak - be empathetic and suggest a pause.' : ''}

Return ONLY the coaching message text. No JSON, no formatting, just the message.`

    const result = await model.generateContent(prompt)
    const message = result.response.text().trim()

    // Safety: strip any accidental buy/sell language
    const forbidden = /\b(buy|sell|long|short|enter|exit)\s+(now|at|this|the|position)/gi
    const safeMessage = message.replace(forbidden, '').trim()

    return NextResponse.json({ message: safeMessage }, { headers: corsHeaders() })
  } catch (e: unknown) {
    console.error('[coach/message] error:', e instanceof Error ? e.message : e)
    return NextResponse.json({ message: null }, { status: 200, headers: corsHeaders() })
  }
}
