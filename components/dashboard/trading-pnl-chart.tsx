'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  pnl: {
    label: "P&L",
    color: "var(--primary)",
  },
} satisfies ChartConfig

 type ChartPoint = { date: string; pnl: number }

export function TradingPnlChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="@container/card border-white/10">
      <CardHeader>
        <CardTitle>Weekly P&L</CardTitle>
        <CardDescription>
          Session profit & loss trend (from AI Coach extension)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillPnlTrading" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pnl)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-pnl)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" vertical={false} />
            <XAxis
              dataKey="date"
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
                      <span className="font-medium">${Number(value).toFixed(0)}</span>
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
              fill="url(#fillPnlTrading)"
              stroke="var(--color-pnl)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
