/**
 * lib/challenge-types.ts
 * Challenge template definitions and shared types for the behavioral
 * gamification system. Each challenge targets a specific trading weakness.
 */

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'
export type ChallengeType = 'behavioral' | 'risk' | 'execution' | 'discipline'
export type ChallengeWeakness =
  | 'revenge_trading'
  | 'poor_risk_management'
  | 'early_exits'
  | 'fomo_entries'
  | 'loss_spirals'
  | 'overtrading_instruments'
  | 'general_discipline'

export type ChallengeTemplate = {
  id: string
  title: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  description: string
  requirement: string
  targetTrades: number
  estimatedDuration: string
  impact: string
  impactStat: string
  weakness: ChallengeWeakness
  xpReward: number
  icon: string
}

export type ActiveChallenge = ChallengeTemplate & {
  personalizedDescription: string
  startedAt: string
  progress: number
  streak: number
  tradeLog: { success: boolean; timestamp: string }[]
}

export type CompletedChallenge = {
  challengeId: string
  title: string
  xpReward: number
  completedAt: string
  finalStreak: number
  targetTrades: number
}

// ─── Templates ──────────────────────────────────────────────────────────────

export const CHALLENGE_TEMPLATES: Record<string, ChallengeTemplate> = {
  discipline_test: {
    id: 'discipline_test',
    title: 'The Discipline Test',
    type: 'behavioral',
    difficulty: 'medium',
    description:
      'After any losing trade, wait at least 30 minutes before placing your next trade. This breaks the revenge trading cycle and lets your emotions reset.',
    requirement: 'Wait 30+ min after a loss before the next trade',
    targetTrades: 10,
    estimatedDuration: '1–2 weeks',
    impact: 'Traders who complete this challenge report a 27% improvement in their win rate after losses.',
    impactStat: '27% better win rate after losses',
    weakness: 'revenge_trading',
    xpReward: 200,
    icon: '⏱️',
  },

  risk_manager: {
    id: 'risk_manager',
    title: 'The Risk Manager',
    type: 'risk',
    difficulty: 'easy',
    description:
      'Cap your risk at 2% of your account balance per trade. Consistent position sizing is the #1 habit separating amateur from professional traders.',
    requirement: 'Max 2% risk per trade across 15 trades',
    targetTrades: 15,
    estimatedDuration: '1 week',
    impact: 'Proper position sizing reduces account blowup risk by 73% and smooths equity curves dramatically.',
    impactStat: '73% lower blowup risk',
    weakness: 'poor_risk_management',
    xpReward: 150,
    icon: '🛡️',
  },

  patience_builder: {
    id: 'patience_builder',
    title: 'The Patience Builder',
    type: 'execution',
    difficulty: 'hard',
    description:
      'Let your winning trades reach their full take-profit target. Resisting the urge to exit early is one of the hardest — and most profitable — trading skills.',
    requirement: 'Let 8 of 10 winning trades hit full take-profit',
    targetTrades: 10,
    estimatedDuration: '2 weeks',
    impact: 'Allowing winners to run fully increases average trade profit by 40–60%, dramatically improving your risk/reward.',
    impactStat: '40–60% larger winning trades',
    weakness: 'early_exits',
    xpReward: 250,
    icon: '🎯',
  },

  strategy_follower: {
    id: 'strategy_follower',
    title: 'The Strategy Follower',
    type: 'discipline',
    difficulty: 'medium',
    description:
      'Only enter trades that match your pre-defined strategy criteria. No impulse trades, no FOMO chasing. Every trade must have a reason.',
    requirement: 'Every entry must follow your strategy rules across 12 trades',
    targetTrades: 12,
    estimatedDuration: '1–2 weeks',
    impact: 'Eliminating FOMO and impulse entries reduces unnecessary losses by an average of 35%.',
    impactStat: '35% fewer impulsive losses',
    weakness: 'fomo_entries',
    xpReward: 200,
    icon: '📋',
  },

  loss_limiter: {
    id: 'loss_limiter',
    title: 'The Loss Limiter',
    type: 'behavioral',
    difficulty: 'medium',
    description:
      'Implement a hard stop after 3 consecutive losses. Step away, journal the trades, and return fresh the next session. No exceptions.',
    requirement: 'Hard stop after 3 consecutive losses for 10 sessions',
    targetTrades: 10,
    estimatedDuration: '2 weeks',
    impact: 'A strict loss limit rule prevents 80% of catastrophic loss-spiral sessions that blow up accounts.',
    impactStat: '80% fewer loss spiral sessions',
    weakness: 'loss_spirals',
    xpReward: 200,
    icon: '🛑',
  },

  focus_builder: {
    id: 'focus_builder',
    title: 'The Focus Builder',
    type: 'discipline',
    difficulty: 'easy',
    description:
      'Trade maximum 2 instruments per session. Depth of focus beats breadth of coverage. Master your instruments before expanding.',
    requirement: 'Max 2 instruments per session for 10 consecutive sessions',
    targetTrades: 10,
    estimatedDuration: '1–2 weeks',
    impact: 'Focused instrument trading improves setup quality recognition and typically raises win rate by 15–25%.',
    impactStat: '15–25% higher win rate',
    weakness: 'overtrading_instruments',
    xpReward: 150,
    icon: '🔭',
  },
}

// Default order for display (most impactful first)
export const CHALLENGE_ORDER = [
  'discipline_test',
  'risk_manager',
  'patience_builder',
  'strategy_follower',
  'loss_limiter',
  'focus_builder',
]

/** Map a behavioral weakness to the most relevant challenge */
export function weaknessToChallengeId(weakness: ChallengeWeakness): string {
  const map: Record<ChallengeWeakness, string> = {
    revenge_trading: 'discipline_test',
    poor_risk_management: 'risk_manager',
    early_exits: 'patience_builder',
    fomo_entries: 'strategy_follower',
    loss_spirals: 'loss_limiter',
    overtrading_instruments: 'focus_builder',
    general_discipline: 'discipline_test',
  }
  return map[weakness]
}

export const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  easy: 'border-emerald-500/50 text-emerald-400',
  medium: 'border-amber-500/50 text-amber-400',
  hard: 'border-[#FF444F]/50 text-[#FF444F]',
}
