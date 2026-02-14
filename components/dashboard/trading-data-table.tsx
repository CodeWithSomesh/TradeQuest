'use client'

import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type TradeRow = {
  id: number
  instrument: string
  outcome: 'Win' | 'Loss'
  pnl: number
  time: string
  coachNote: string
}

export function TradingDataTable({ data }: { data: TradeRow[] }) {
  return (
    <Card className="border-white/10">
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>
          Trade history with AI Coach feedback (from extension)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Instrument</TableHead>
                <TableHead className="text-muted-foreground">Outcome</TableHead>
                <TableHead className="text-muted-foreground text-right">P&L</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Coach Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} className="border-white/10">
                  <TableCell className="font-medium">{row.instrument}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={row.outcome === 'Win' ? 'border-emerald-500/50 text-emerald-400' : 'border-[#FF444F]/50 text-[#FF444F]'}>
                      {row.outcome === 'Win' ? <IconTrendingUp className="size-3 mr-1" /> : <IconTrendingDown className="size-3 mr-1" />}
                      {row.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${row.pnl >= 0 ? 'text-emerald-400' : 'text-[#FF444F]'}`}>
                    {row.pnl >= 0 ? '+' : ''}{row.pnl.toFixed(2)} USD
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{row.time}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={row.coachNote}>{row.coachNote}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
