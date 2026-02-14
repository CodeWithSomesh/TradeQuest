/**
 * Demo data for trading behavioral dashboard & Live Coach
 * Shows the potential of the AI Coach when no real data exists
 */

import type { TradeRow } from '@/components/dashboard/trading-data-table'

export const demoDashboardStats = {
  disciplineScore: 78,
  disciplineTrend: '+12',
  winRate: 62,
  winRateTrend: '-5',
  revengeTradingRisk: 'Low',
  revengeTrend: 'down',
  sessionsThisWeek: 5,
  sessionsTrend: '+2',
}

export const demoPnlChartData = [
  { date: 'Mon', pnl: -120 },
  { date: 'Tue', pnl: 45 },
  { date: 'Wed', pnl: 180 },
  { date: 'Thu', pnl: -35 },
  { date: 'Fri', pnl: 210 },
  { date: 'Sat', pnl: 95 },
  { date: 'Sun', pnl: 340 },
]

export const demoTradeHistory: TradeRow[] = [
  { id: 1, instrument: 'Volatility 100', outcome: 'Win', pnl: 145.50, time: '2 min ago', coachNote: 'Great discipline—took profit at target' },
  { id: 2, instrument: 'EUR/USD', outcome: 'Loss', pnl: -89.00, time: '15 min ago', coachNote: 'Cut loss quickly—saved from larger drawdown' },
  { id: 3, instrument: 'Gold', outcome: 'Win', pnl: 212.30, time: '1 hour ago', coachNote: 'Excellent entry timing after consolidation' },
  { id: 4, instrument: 'Volatility 100', outcome: 'Loss', pnl: -156.00, time: '2 hours ago', coachNote: 'Pattern: You tend to overtrade after losses' },
  { id: 5, instrument: 'BTC/USD', outcome: 'Win', pnl: 98.75, time: '3 hours ago', coachNote: 'Risk management on point' },
  { id: 6, instrument: 'Volatility 75', outcome: 'Loss', pnl: -65.00, time: '4 hours ago', coachNote: 'Consider a break—3 losses in a row' },
  { id: 7, instrument: 'EUR/USD', outcome: 'Win', pnl: 134.20, time: '5 hours ago', coachNote: 'Best performance in morning hours' },
  { id: 8, instrument: 'Gold', outcome: 'Win', pnl: 87.00, time: 'Yesterday', coachNote: 'Stuck to your plan—well done' },
]

export const demoCoachData = {
  session: {
    time_in_session: '2h 34m',
    trades_executed: 12,
    win_loss: '8 / 4',
    risk_score: 'Low',
    initial_balance: 10000,
    currency: 'USD',
  },
  stats: { wins: 8, losses: 4, streak: 2, totalPnl: 472.75, totalTrades: 12 },
  pnlChartData: [
    { time: '09:00', pnl: -20 },
    { time: '10:00', pnl: 45 },
    { time: '11:00', pnl: 120 },
    { time: '12:00', pnl: 85 },
    { time: '13:00', pnl: 200 },
    { time: '14:00', pnl: 165 },
    { time: '15:00', pnl: 310 },
    { time: '16:00', pnl: 472.75 },
  ],
  patterns: {
    bestHours: '8AM – 12PM',
    tradeFrequency: '8–10/day',
    emotionalTrigger: 'After losses',
  },
  recentAlerts: [
    { type: 'positive', time: '2 min ago', text: 'Great discipline! You took profit at your target instead of getting greedy. This is excellent risk management.' },
    { type: 'info', time: '15 min ago', text: "Pattern detected: You tend to perform better in morning sessions. Consider focusing your active trading before 1 PM." },
    { type: 'warning', time: '1 hour ago', text: "Frequency alert: You've made 8 trades in the last hour, above your typical pace. Consider taking a short break to maintain focus." },
    { type: 'positive', time: '1 hour ago', text: 'Excellent exit! You cut that loss quickly instead of hoping for a reversal. This saved you from a larger loss.' },
    { type: 'info', time: '2 hours ago', text: 'Session started: Trading normally. All systems monitoring your behavior in real-time.' },
  ],
  behavioralInsights: [
    { label: 'Revenge trading risk', value: 'Low', trend: 'Improving', description: 'No trades immediately after losses in last 24h' },
    { label: 'Emotional state', value: 'Stable', trend: '—', description: 'Consistent decision-making observed' },
    { label: 'Best trading hours', value: '8AM–12PM', trend: '—', description: '72% of wins occur in morning session' },
    { label: 'Suggested break', value: 'Not needed', trend: '—', description: 'Session duration within healthy limits' },
  ],
}
