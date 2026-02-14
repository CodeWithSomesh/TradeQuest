'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TickerItem {
  symbol: string
  price: string
  change: string
  direction: 'up' | 'down' | 'flat'
}

const MOCK_TICKERS: TickerItem[] = [
  { symbol: 'EUR/USD', price: '1.0842', change: '+0.12%', direction: 'up' },
  { symbol: 'GBP/USD', price: '1.2654', change: '-0.08%', direction: 'down' },
  { symbol: 'XAU/USD', price: '2,028.50', change: '-1.24%', direction: 'down' },
  { symbol: 'BTC/USD', price: '70,142.00', change: '+0.34%', direction: 'up' },
  { symbol: 'ETH/USD', price: '4,105.20', change: '+2.18%', direction: 'up' },
  { symbol: 'USD/JPY', price: '151.42', change: '+0.06%', direction: 'up' },
  { symbol: 'VOL 75', price: '948,231', change: '0.00%', direction: 'flat' },
  { symbol: 'VOL 100', price: '1,204,556', change: '-0.15%', direction: 'down' },
]

const directionConfig = {
  up: { icon: TrendingUp, className: 'text-sentiment-bullish' },
  down: { icon: TrendingDown, className: 'text-sentiment-bearish' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
}

const MarketTicker = () => {
  const doubled = [...MOCK_TICKERS, ...MOCK_TICKERS]

  return (
    <div className="glass-card overflow-hidden py-2.5 px-0">
      <div className="flex animate-ticker-scroll whitespace-nowrap">
        {doubled.map((item, i) => {
          const cfg = directionConfig[item.direction]
          const Icon = cfg.icon
          return (
            <div
              key={`${item.symbol}-${i}`}
              className="inline-flex items-center gap-2 px-5 border-r border-border last:border-0"
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {item.symbol}
              </span>
              <span className="text-[11px] font-mono font-semibold text-foreground">
                {item.price}
              </span>
              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${cfg.className}`}>
                <Icon className="h-3 w-3" />
                {item.change}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketTicker
