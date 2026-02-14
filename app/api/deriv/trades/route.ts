/**
 * GET /api/deriv/trades
 * Fetches real trade history from Deriv WebSocket API (profit_table)
 * and computes session statistics.
 * Token: from X-Deriv-Token header (user-entered in dashboard) or DERIV_API_TOKEN env.
 */
import { fetchDerivData, parseInstrument, parseContractType, formatTimeAgo } from '@/lib/deriv-ws'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export type DerivTrade = {
  id: number
  instrument: string
  contractType: string
  outcome: 'Win' | 'Loss'
  pnl: number
  buyPrice: number
  sellPrice: number
  time: string
  sellTime: number
  purchaseTime: number
  longcode: string
  shortcode: string
  /** Seconds the contract was held (sellTime - purchaseTime) */
  durationSeconds?: number
  contractId?: string
  /** Raw fields from Deriv for AI (barrier, entry/exit if present) */
  raw?: Record<string, unknown>
}

export type DerivTradesResponse = {
  trades: DerivTrade[]
  stats: {
    wins: number
    losses: number
    totalPnl: number
    winRate: number
    streak: number
    totalTrades: number
  }
  pnlOverTime: { time: string; pnl: number }[]
  balance?: number
  currency?: string
}

export async function GET(request: NextRequest) {
  const headerToken = request.headers.get('x-deriv-token')?.trim() || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const token = headerToken || process.env.DERIV_API_TOKEN
  const appId = Number(process.env.DERIV_APP_ID) || 1089

  if (!token) {
    return NextResponse.json(
      { error: 'No Deriv API token. Add your token in Dashboard → Settings, or set DERIV_API_TOKEN in .env.local' },
      { status: 401 }
    )
  }

  try {
    const responses = await fetchDerivData(
      token,
      [
        { profit_table: 1, description: 1, limit: 100, sort: 'DESC' },
        { balance: 1 },
      ],
      appId
    )

    const profitTable = responses[0] as { profit_table?: { transactions?: Record<string, unknown>[] } }
    const balanceResp = responses[1] as { balance?: { balance?: number; currency?: string } }

    const transactions = profitTable?.profit_table?.transactions ?? []

    const trades: DerivTrade[] = transactions.map((t: Record<string, unknown>, i: number) => {
      const buyPrice = Number(t.buy_price) || 0
      const sellPrice = Number(t.sell_price) || 0
      const pnl = sellPrice - buyPrice
      const sellTime = (t.sell_time as number) || 0
      const purchaseTime = (t.purchase_time as number) || 0
      const durationSeconds = sellTime && purchaseTime ? Math.max(0, sellTime - purchaseTime) : undefined
      const shortcode = (t.shortcode as string) || ''
      const raw: Record<string, unknown> = {}
      if (t.contract_id != null) raw.contract_id = t.contract_id
      if (t.barrier != null) raw.barrier = t.barrier
      if (t.entry_spot != null) raw.entry_spot = t.entry_spot
      if (t.exit_spot != null) raw.exit_spot = t.exit_spot
      return {
        id: (t.transaction_id as number) || i + 1,
        instrument: parseInstrument(shortcode),
        contractType: parseContractType(shortcode),
        outcome: (pnl >= 0 ? 'Win' : 'Loss') as 'Win' | 'Loss',
        pnl: Math.round(pnl * 100) / 100,
        buyPrice,
        sellPrice,
        time: formatTimeAgo(sellTime),
        sellTime,
        purchaseTime,
        longcode: (t.longcode as string) || '',
        shortcode,
        durationSeconds,
        contractId: typeof t.contract_id === 'string' ? t.contract_id : undefined,
        raw: Object.keys(raw).length > 0 ? raw : undefined,
      }
    })

    // Stats
    const wins = trades.filter((t) => t.outcome === 'Win').length
    const losses = trades.filter((t) => t.outcome === 'Loss').length
    const totalPnl = Math.round(trades.reduce((s, t) => s + t.pnl, 0) * 100) / 100
    const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 1000) / 10 : 0

    // Streak (from most recent trades)
    let streak = 0
    for (const t of trades) {
      if (streak === 0) {
        streak = t.outcome === 'Win' ? 1 : -1
      } else if (streak > 0 && t.outcome === 'Win') {
        streak++
      } else if (streak < 0 && t.outcome === 'Loss') {
        streak--
      } else {
        break
      }
    }

    // Cumulative P&L over time (chronological order)
    const chronological = [...trades].reverse()
    let cumPnl = 0
    const pnlOverTime = chronological.map((t) => {
      cumPnl += t.pnl
      return {
        time: new Date(t.sellTime * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        pnl: Math.round(cumPnl * 100) / 100,
      }
    })

    const balance = balanceResp?.balance?.balance ?? undefined
    const currency = balanceResp?.balance?.currency ?? 'USD'

    return NextResponse.json({
      trades,
      stats: { wins, losses, totalPnl, winRate, streak, totalTrades: trades.length },
      pnlOverTime,
      balance: balance ? Number(balance) : undefined,
      currency: currency || 'USD',
    } satisfies DerivTradesResponse)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch trades from Deriv'
    console.error('[deriv/trades] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
