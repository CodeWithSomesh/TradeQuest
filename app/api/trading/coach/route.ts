import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: sessions } = await supabase
      .from('trading_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)

    const latestSession = sessions?.[0]
    if (!latestSession) {
      return NextResponse.json({
        session: null,
        events: [],
        stats: { wins: 0, losses: 0, streak: 0, totalPnl: 0 },
        pnlByHour: [],
        recentAlerts: [],
      })
    }

    const { data: events } = await supabase
      .from('trading_events')
      .select('*')
      .eq('session_id', latestSession.session_id)
      .order('created_at', { ascending: true })

    const wins = events?.filter((e) => e.event_type === 'win').length ?? 0
    const losses = events?.filter((e) => e.event_type === 'loss').length ?? 0
    const totalTrades = wins + losses

    let streak = 0
    const sorted = [...(events ?? [])].reverse()
    for (const e of sorted) {
      if (e.event_type === 'win') {
        streak = streak >= 0 ? streak + 1 : 1
        break
      }
      if (e.event_type === 'loss') {
        streak = streak <= 0 ? streak - 1 : -1
        break
      }
    }

    const pnlEvents = events?.filter((e) => e.amount != null) ?? []
    const totalPnl = pnlEvents.reduce((sum, e) => sum + (e.event_type === 'win' ? Number(e.amount) : -Number(e.amount || 0)), 0)

    const pnlByHour: Record<number, number> = {}
    for (const e of events ?? []) {
      if (e.created_at && e.amount != null) {
        const h = new Date(e.created_at).getHours()
        const amt = e.event_type === 'win' ? Number(e.amount) : -Number(e.amount)
        pnlByHour[h] = (pnlByHour[h] ?? 0) + amt
      }
    }
    const pnlChartData = Object.entries(pnlByHour)
      .map(([hour, pnl]) => ({ time: `${String(hour).padStart(2, '0')}:00`, pnl }))
      .sort((a, b) => a.time.localeCompare(b.time))

    const bestHour = Object.entries(pnlByHour).sort((a, b) => b[1] - a[1])[0]
    const h = bestHour ? Number(bestHour[0]) : 0
    const bestHours = bestHour ? `${h}:00 – ${(h + 4) % 24}:00` : 'No data yet'

    const recentAlerts = (events ?? [])
      .filter((e) => e.event_type !== 'connect')
      .slice(-20)
      .reverse()
      .map((e) => {
        let type = 'info'
        if (e.event_type === 'win') type = 'positive'
        else if (e.event_type === 'pattern_alert') type = 'warning'
        else if (e.loss_percent >= 10) type = 'warning'
        return {
          type,
          time: formatTimeAgo(e.created_at),
          text: e.message ?? (e.event_type === 'win' ? `Won ${e.amount} ${latestSession.currency}` : e.event_type === 'pattern_alert' ? 'Behavioral pattern detected' : `Lost ${Math.abs(Number(e.amount || 0))} ${latestSession.currency}`),
        }
      })

    const sessionStart = latestSession.started_at ? new Date(latestSession.started_at) : new Date()
    const now = new Date()
    const diffMs = now.getTime() - sessionStart.getTime()
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    const timeInSession = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

    const riskScore = losses > wins ? 'High' : losses === wins ? 'Medium' : 'Low'

    return NextResponse.json({
      session: {
        ...latestSession,
        time_in_session: timeInSession,
        trades_executed: totalTrades,
        win_loss: `${wins} / ${losses}`,
        risk_score: riskScore,
      },
      events: events ?? [],
      stats: { wins, losses, streak, totalPnl, totalTrades },
      pnlChartData: pnlChartData.length ? pnlChartData : [{ time: '00:00', pnl: 0 }],
      patterns: {
        bestHours,
        tradeFrequency: totalTrades > 0 ? `${totalTrades} this session` : 'No trades yet',
        emotionalTrigger: losses > wins ? 'After losses' : 'Moderate',
      },
      recentAlerts,
    })
  } catch (e) {
    console.error('[trading/coach] error:', e)
    return NextResponse.json({
      session: null,
      events: [],
      stats: { wins: 0, losses: 0, streak: 0, totalPnl: 0, totalTrades: 0 },
      pnlChartData: [{ time: '00:00', pnl: 0 }],
      patterns: { bestHours: 'No data yet', tradeFrequency: '0', emotionalTrigger: 'Moderate' },
      recentAlerts: [],
    }, { status: 200 })
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} hour ago`
  return `${Math.floor(hours / 24)} days ago`
}
