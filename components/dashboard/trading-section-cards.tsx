'use client'

import { IconTrendingDown, IconTrendingUp, IconShield, IconChartBar } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type TradingStats = {
  disciplineScore: number
  disciplineTrend: string
  winRate: number
  winRateTrend: string
  revengeTradingRisk: string
  revengeTrend: string
  sessionsThisWeek: number
  sessionsTrend: string
}

export function TradingSectionCards({ stats }: { stats: TradingStats }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Discipline Score</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.disciplineScore}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={stats.disciplineTrend.startsWith('+') ? 'border-emerald-500/50 text-emerald-400' : 'border-[#FF444F]/50 text-[#FF444F]'}>
              <IconTrendingUp className="size-3" />
              {stats.disciplineTrend}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sustainable habits <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Based on risk management & consistency
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Win Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.winRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={stats.winRateTrend.startsWith('-') ? 'border-amber-500/50 text-amber-400' : 'border-emerald-500/50 text-emerald-400'}>
              <IconTrendingDown className="size-3" />
              {stats.winRateTrend}% vs last week
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Wins vs total trades
          </div>
          <div className="text-muted-foreground">
            AI Coach tracks patterns
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Revenge Trading Risk</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.revengeTradingRisk}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              <IconShield className="size-3" />
              {stats.revengeTrend}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Emotional trading check
          </div>
          <div className="text-muted-foreground">
            Trades after losses monitored
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Sessions This Week</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.sessionsThisWeek}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconChartBar className="size-3" />
              {stats.sessionsTrend} vs last week
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active trading days
          </div>
          <div className="text-muted-foreground">
            Coach monitors consistency
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
