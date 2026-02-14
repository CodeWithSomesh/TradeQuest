'use client'

import * as React from 'react'
import {
  IconBrain,
  IconTrendingUp,
  IconTrendingDown,
  IconChartLine,
  IconShield,
  IconCircleCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconRefresh,
  IconLoader2,
  IconMoodSmile,
  IconTarget,
  IconWallet,
} from '@tabler/icons-react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useDemoMode } from '@/lib/demo-context'
import { demoCoachData, demoTradeHistory, demoPnlChartData, demoDashboardStats } from './dashboard/demo-data'

// Types matching API responses
type Trade = {
  id: number
  instrument: string
  contractType?: string
  outcome: 'Win' | 'Loss'
  pnl: number
  buyPrice?: number
  sellPrice?: number
  time: string
  longcode?: string
}

type Stats = {
  wins: number
  losses: number
  totalPnl: number
  winRate: number
  streak: number
  totalTrades: number
}

type AIAnalysis = {
  disciplineScore: number
  emotionalState: string
  revengeTradingRisk: string
  patterns: { type: 'positive' | 'warning' | 'info'; text: string }[]
  coachMessage: string
  suggestions: string[]
  tradeNotes: Record<string, string>
}

const chartConfig = {
  pnl: { label: 'P&L', color: 'var(--chart-1)' },
} satisfies ChartConfig

const alertIcons = {
  positive: IconCircleCheck,
  info: IconInfoCircle,
  warning: IconAlertTriangle,
}

const alertStyles = {
  positive: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
}

/** Generate heuristic coaching note when AI notes are unavailable */
function getTradeNote(trade: Trade, aiNotes: Record<string, string> | undefined, demoMode: boolean): string {
  // AI note takes priority
  const aiNote = aiNotes?.[String(trade.id)]
  if (aiNote) return aiNote

  // Demo mode: use demo notes
  if (demoMode) {
    const demo = demoTradeHistory.find(d => d.id === trade.id)
    if (demo?.coachNote) return demo.coachNote
  }

  // Heuristic fallback — always show SOMETHING
  if (trade.pnl > 0) {
    const absPnl = Math.abs(trade.pnl)
    if (absPnl > 500) return 'Big win — great patience, lock in the discipline'
    if (absPnl > 100) return 'Solid profit — well executed'
    return 'Nice win — consistency is key'
  } else {
    const absPnl = Math.abs(trade.pnl)
    if (absPnl > 500) return 'Large loss — consider smaller position sizes'
    if (absPnl > 100) return 'Loss contained — review your exit timing'
    return 'Small loss — part of the process, stay disciplined'
  }
}

export default function AICoachDashboard() {
  const { showDemoData } = useDemoMode()

  const [trades, setTrades] = React.useState<Trade[]>([])
  const [stats, setStats] = React.useState<Stats>({ wins: 0, losses: 0, totalPnl: 0, winRate: 0, streak: 0, totalTrades: 0 })
  const [pnlOverTime, setPnlOverTime] = React.useState<{ time: string; pnl: number }[]>([])
  const [balance, setBalance] = React.useState<number | null>(null)
  const [currency, setCurrency] = React.useState('USD')

  const [aiAnalysis, setAiAnalysis] = React.useState<AIAnalysis | null>(null)
  const [loadingTrades, setLoadingTrades] = React.useState(false)
  const [loadingAI, setLoadingAI] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch real trades from Deriv API
  const fetchTrades = React.useCallback(async () => {
    if (showDemoData) return
    setLoadingTrades(true)
    setError(null)
    try {
      const res = await fetch('/api/deriv/trades')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch trades')
      }
      const data = await res.json()
      setTrades(data.trades || [])
      setStats(data.stats || { wins: 0, losses: 0, totalPnl: 0, winRate: 0, streak: 0, totalTrades: 0 })
      setPnlOverTime(data.pnlOverTime || [])
      if (data.balance != null) setBalance(data.balance)
      if (data.currency) setCurrency(data.currency)
      return data
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      console.error('[Dashboard] fetch trades error:', msg)
      return null
    } finally {
      setLoadingTrades(false)
    }
  }, [showDemoData])

  // Fetch AI analysis
  const fetchAIAnalysis = React.useCallback(async (tradeData: Trade[], statsData: Stats) => {
    if (showDemoData) return
    if (!tradeData || tradeData.length === 0) return
    setLoadingAI(true)
    try {
      const res = await fetch('/api/coach/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trades: tradeData, stats: statsData }),
      })
      const data = await res.json()
      setAiAnalysis(data)
    } catch (e) {
      console.error('[Dashboard] AI analysis error:', e)
    } finally {
      setLoadingAI(false)
    }
  }, [showDemoData])

  // Initial load
  React.useEffect(() => {
    if (showDemoData) {
      const demoTrades: Trade[] = demoTradeHistory.map(t => ({
        ...t,
        contractType: 'Trade',
      }))
      setTrades(demoTrades)
      setStats({
        wins: demoDashboardStats.winRate > 50 ? 8 : 4,
        losses: demoDashboardStats.winRate > 50 ? 4 : 8,
        totalPnl: 472.75,
        winRate: demoDashboardStats.winRate,
        streak: 2,
        totalTrades: 12,
      })
      setPnlOverTime(demoPnlChartData.map(d => ({ time: d.date, pnl: d.pnl })))
      setBalance(10472.75)
      setCurrency('USD')
      setAiAnalysis({
        disciplineScore: demoDashboardStats.disciplineScore,
        emotionalState: 'Stable',
        revengeTradingRisk: demoDashboardStats.revengeTradingRisk,
        patterns: demoCoachData.recentAlerts.map(a => ({
          type: a.type as 'positive' | 'warning' | 'info',
          text: a.text,
        })),
        coachMessage: 'Strong session! Your discipline score is improving. You\'re cutting losses quickly and letting winners run. Keep this up — consistency is your edge, not any single trade.',
        suggestions: [
          'Continue focusing on morning trading hours where your win rate is highest',
          'Maintain your current risk per trade — it\'s well calibrated',
          'Consider journaling your emotional state before each session',
        ],
        tradeNotes: {},
      })
      setError(null)
      return
    }

    fetchTrades().then((data) => {
      if (data?.trades?.length > 0) {
        fetchAIAnalysis(data.trades, data.stats)
      }
    })
  }, [showDemoData, fetchTrades, fetchAIAnalysis])

  const handleRefresh = async () => {
    const data = await fetchTrades()
    if (data?.trades?.length > 0) {
      fetchAIAnalysis(data.trades, data.stats)
    }
  }

  const pnlTrend = stats.totalPnl >= 0 ? 'up' : 'down'
  const balanceStr = balance != null
    ? Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—'

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        {/* ====== HERO BALANCE ====== */}
        <div className="px-4 lg:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IconWallet className="size-6 text-[#FF444F]" />
                <span className="text-xl font-medium text-muted-foreground uppercase tracking-wider">Account Balance</span>
                {!showDemoData && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={loadingTrades}
                    className="size-6 text-muted-foreground hover:text-foreground"
                  >
                    {loadingTrades ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconRefresh className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
              <div className='flex justify-end align-bottom'>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tabular-nums tracking-tight text-white leading-none">
                  ${balanceStr}
                </h1>
                <span className="text-xl font-semibold text-muted-foreground ml-1 align-bottom bottom">{currency}</span>
              </div>
              
              {/* P&L summary beneath balance */}
              <div className="flex items-center gap-4 mt-3">
                <span className={`text-sm font-semibold flex items-center gap-1 ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-[#FF444F]'}`}>
                  {pnlTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
                  {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)} {currency}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.totalTrades} trades &middot; {stats.winRate}% win rate &middot; {stats.wins}W / {stats.losses}L
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && !showDemoData && (
          <div className="mx-4 lg:mx-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
            <p className="font-medium">Could not fetch live data</p>
            <p className="text-xs mt-1 text-amber-400/70">{error}</p>
            <p className="text-xs mt-1 text-muted-foreground">Enable Demo Data to see the dashboard potential, or check your DERIV_API_TOKEN in .env.local</p>
          </div>
        )}

        {/* AI Coach Message Banner */}
        {aiAnalysis?.coachMessage && (
          <div className="mx-4 lg:mx-6 rounded-lg border border-[#FF444F]/20 bg-linear-to-r from-[#FF444F]/5 to-transparent p-4">
            <div className="flex items-start gap-3">
              <IconBrain className="size-5 text-[#FF444F] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground/90">{aiAnalysis.coachMessage}</p>
                {loadingAI && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <IconLoader2 className="size-3 animate-spin" /> Updating analysis...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards Row */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {/* Win Rate */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Win Rate</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.winRate}%
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={stats.winRate >= 50 ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'}>
                  <IconTarget className="size-3" />
                  {stats.totalTrades} trades
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {stats.wins}W / {stats.losses}L
              </div>
              <div className="text-muted-foreground">AI tracks discipline, not just wins</div>
            </CardFooter>
          </Card>

          {/* Net P&L */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Net P&L</CardDescription>
              <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-[#FF444F]'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toFixed(2)} {currency}
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className={stats.totalPnl >= 0 ? 'border-emerald-500/50 text-emerald-400' : 'border-[#FF444F]/50 text-[#FF444F]'}>
                  {pnlTrend === 'up' ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
                  {pnlTrend === 'up' ? 'Profitable' : 'Drawdown'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                From last {stats.totalTrades} trades
              </div>
              <div className="text-muted-foreground">Sustainable growth over time</div>
            </CardFooter>
          </Card>

          {/* Streak */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Current Streak</CardDescription>
              <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${stats.streak >= 0 ? 'text-emerald-400' : 'text-[#FF444F]'}`}>
                {stats.streak >= 0 ? '+' : ''}{stats.streak}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {stats.streak >= 0 ? 'Winning' : 'Losing'} streak
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {stats.streak >= 0 ? <IconMoodSmile className="size-4 text-emerald-400" /> : <IconAlertTriangle className="size-4 text-amber-400" />}
                {Math.abs(stats.streak)} consecutive {stats.streak >= 0 ? 'wins' : 'losses'}
              </div>
              <div className="text-muted-foreground">Stay disciplined regardless</div>
            </CardFooter>
          </Card>

          {/* AI Discipline Score */}
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>AI Discipline Score</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {aiAnalysis ? `${aiAnalysis.disciplineScore}%` : '—'}
              </CardTitle>
              <CardAction>
                {aiAnalysis ? (
                  <Badge variant="outline" className={
                    aiAnalysis.disciplineScore >= 70 ? 'border-emerald-500/50 text-emerald-400' :
                    aiAnalysis.disciplineScore >= 40 ? 'border-amber-500/50 text-amber-400' :
                    'border-[#FF444F]/50 text-[#FF444F]'
                  }>
                    <IconBrain className="size-3" />
                    {aiAnalysis.emotionalState}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    {loadingAI ? <IconLoader2 className="size-3 animate-spin" /> : <IconBrain className="size-3" />}
                    {loadingAI ? 'Analyzing...' : 'Awaiting data'}
                  </Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Powered by Gemini AI
              </div>
              <div className="text-muted-foreground">
                {aiAnalysis ? `Revenge risk: ${aiAnalysis.revengeTradingRisk}` : 'Behavioral analysis'}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* P&L Chart + Behavioral Insights Row */}
        <div className="grid gap-4 px-4 lg:px-6 lg:grid-cols-3">
          {/* P&L Chart (2/3 width) */}
          <Card className="border-white/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconChartLine className="size-4 text-[#FF444F]" />
                Cumulative P&L
              </CardTitle>
              <CardDescription>
                {showDemoData ? 'Demo weekly P&L trend' : `Profit & loss across ${stats.totalTrades} trades`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <AreaChart data={pnlOverTime.length > 0 ? pnlOverTime : [{ time: '—', pnl: 0 }]}>
                  <defs>
                    <linearGradient id="fillPnlDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-pnl)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-pnl)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <>
                            <span className="font-medium">${Number(value).toFixed(2)}</span>
                            <span className="text-muted-foreground"> P&L</span>
                          </>
                        )}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="pnl"
                    fill="url(#fillPnlDash)"
                    stroke="var(--color-pnl)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* AI Behavioral Insights (1/3 width) */}
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconShield className="size-4 text-[#FF444F]" />
                AI Behavioral Insights
              </CardTitle>
              <CardDescription>Real-time pattern detection by Gemini</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingAI && !aiAnalysis ? (
                <div className="flex items-center justify-center py-8">
                  <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : aiAnalysis ? (
                <>
                  <div className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Revenge trading risk</span>
                      <Badge variant="outline" className={`text-xs ${
                        aiAnalysis.revengeTradingRisk === 'Low' ? 'border-emerald-500/50 text-emerald-400' :
                        aiAnalysis.revengeTradingRisk === 'Medium' ? 'border-amber-500/50 text-amber-400' :
                        'border-[#FF444F]/50 text-[#FF444F]'
                      }`}>{aiAnalysis.revengeTradingRisk}</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Emotional state</span>
                      <Badge variant="outline" className={`text-xs ${
                        aiAnalysis.emotionalState === 'Stable' ? 'border-emerald-500/50 text-emerald-400' :
                        aiAnalysis.emotionalState === 'Cautious' ? 'border-amber-500/50 text-amber-400' :
                        'border-[#FF444F]/50 text-[#FF444F]'
                      }`}>{aiAnalysis.emotionalState}</Badge>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Discipline</span>
                      <Badge variant="outline" className="text-xs">{aiAnalysis.disciplineScore}%</Badge>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          aiAnalysis.disciplineScore >= 70 ? 'bg-emerald-500' :
                          aiAnalysis.disciplineScore >= 40 ? 'bg-amber-500' :
                          'bg-[#FF444F]'
                        }`}
                        style={{ width: `${aiAnalysis.disciplineScore}%` }}
                      />
                    </div>
                  </div>
                  {aiAnalysis.suggestions.length > 0 && (
                    <div className="rounded-lg border border-white/10 p-3 text-sm">
                      <p className="text-muted-foreground text-xs mb-2">AI Suggestions</p>
                      <ul className="space-y-1.5">
                        {aiAnalysis.suggestions.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                            <span className="text-[#FF444F] mt-0.5">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <IconBrain className="size-8 mx-auto mb-2 text-white/10" />
                  <p>No data to analyze yet.</p>
                  <p className="text-xs mt-1">Trade on Deriv or enable Demo Data.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trade History Table */}
        <div className="px-4 lg:px-6">
          {trades.length > 0 ? (
            <Card className="border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Recent Trades</CardTitle>
                <CardDescription>
                  {showDemoData ? 'Demo trade history with AI notes' : `Last ${trades.length} trades from your Deriv account with AI coaching notes`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Instrument</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Outcome</TableHead>
                        <TableHead className="text-muted-foreground text-right">P&L</TableHead>
                        <TableHead className="text-muted-foreground">Time</TableHead>
                        <TableHead className="text-muted-foreground">AI Coach Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.slice(0, 20).map((trade) => {
                        const note = getTradeNote(trade, aiAnalysis?.tradeNotes, showDemoData)
                        return (
                          <TableRow key={trade.id} className="border-white/10">
                            <TableCell className="font-medium">{trade.instrument}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{trade.contractType || 'Trade'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={trade.outcome === 'Win' ? 'border-emerald-500/50 text-emerald-400' : 'border-[#FF444F]/50 text-[#FF444F]'}>
                                {trade.outcome === 'Win' ? <IconTrendingUp className="size-3 mr-1" /> : <IconTrendingDown className="size-3 mr-1" />}
                                {trade.outcome}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium tabular-nums ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-[#FF444F]'}`}>
                              {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)} {currency}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{trade.time}</TableCell>
                            <TableCell className="text-sm max-w-[220px] truncate text-muted-foreground" title={note}>
                              {note}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : !loadingTrades && !error ? (
            <div className="rounded-lg border border-dashed border-white/20 p-12 text-center">
              <IconBrain className="size-10 mx-auto mb-3 text-white/10" />
              <p className="text-muted-foreground text-sm">
                No trade data yet. Connect your Deriv account or click <strong>Demo Data</strong> to see the AI Coach in action.
              </p>
            </div>
          ) : null}
        </div>

        {/* AI Pattern Alerts */}
        {aiAnalysis && aiAnalysis.patterns.length > 0 && (
          <Card className="border-white/10 mx-4 lg:mx-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconBrain className="size-4 text-[#FF444F]" />
                AI Pattern Detection
              </CardTitle>
              <CardDescription>Behavioral patterns identified by Gemini from your trading data</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {aiAnalysis.patterns.map((pattern, i) => {
                  const Icon = alertIcons[pattern.type] ?? IconInfoCircle
                  const style = alertStyles[pattern.type] ?? alertStyles.info
                  return (
                    <li
                      key={i}
                      className={`flex gap-3 rounded-lg border p-3 text-sm ${style}`}
                    >
                      <Icon className="size-5 shrink-0 mt-0.5" />
                      <p className="font-medium text-foreground/90">{pattern.text}</p>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
