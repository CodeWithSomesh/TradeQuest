'use client'

/**
 * lib/challenge-context.tsx
 * Manages active challenge, progress tracking, and completed challenge history.
 * All state is persisted to localStorage.
 *
 * Integrates with gamification-context (awards XP on completion).
 */

import * as React from 'react'
import { toast } from 'sonner'
import {
  type ActiveChallenge,
  type CompletedChallenge,
  CHALLENGE_TEMPLATES,
} from './challenge-types'

const ACTIVE_KEY = 'tradequest_active_challenge'
const COMPLETED_KEY = 'tradequest_completed_challenges'

type ChallengeContextType = {
  activeChallenge: ActiveChallenge | null
  completedChallenges: CompletedChallenge[]
  isChallengeCompleted: (challengeId: string) => boolean
  acceptChallenge: (challengeId: string, personalizedDescription?: string) => void
  skipChallenge: () => void
  logTrade: (success: boolean) => void
  generateChallenge: (profileSummary?: string, aiWeakness?: string) => Promise<void>
  isGenerating: boolean
}

const ChallengeContext = React.createContext<ChallengeContextType | null>(null)

function loadActive(): ActiveChallenge | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    return raw ? (JSON.parse(raw) as ActiveChallenge) : null
  } catch {
    return null
  }
}

function loadCompleted(): CompletedChallenge[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    return raw ? (JSON.parse(raw) as CompletedChallenge[]) : []
  } catch {
    return []
  }
}

function saveActive(c: ActiveChallenge | null): void {
  if (typeof window === 'undefined') return
  if (c) localStorage.setItem(ACTIVE_KEY, JSON.stringify(c))
  else localStorage.removeItem(ACTIVE_KEY)
}

function saveCompleted(list: CompletedChallenge[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(list))
}

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [activeChallenge, setActiveChallenge] = React.useState<ActiveChallenge | null>(null)
  const [completedChallenges, setCompletedChallenges] = React.useState<CompletedChallenge[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)

  React.useEffect(() => {
    setActiveChallenge(loadActive())
    setCompletedChallenges(loadCompleted())
  }, [])

  const isChallengeCompleted = React.useCallback(
    (challengeId: string) => completedChallenges.some((c) => c.challengeId === challengeId),
    [completedChallenges]
  )

  const acceptChallenge = React.useCallback(
    (challengeId: string, personalizedDescription?: string) => {
      const template = CHALLENGE_TEMPLATES[challengeId]
      if (!template) return
      const newChallenge: ActiveChallenge = {
        ...template,
        personalizedDescription: personalizedDescription || template.description,
        startedAt: new Date().toISOString(),
        progress: 0,
        streak: 0,
        tradeLog: [],
      }
      setActiveChallenge(newChallenge)
      saveActive(newChallenge)
      toast.success(`Challenge accepted: ${template.title}`, {
        description: `Complete ${template.targetTrades} trades following the rule to earn ${template.xpReward} XP`,
        duration: 4000,
      })
    },
    []
  )

  const skipChallenge = React.useCallback(() => {
    setActiveChallenge(null)
    saveActive(null)
    toast.info('Challenge skipped. You can start a new one anytime.', { duration: 3000 })
  }, [])

  const logTrade = React.useCallback(
    (success: boolean) => {
      setActiveChallenge((prev) => {
        if (!prev) return prev

        const entry = { success, timestamp: new Date().toISOString() }
        const newLog = [...prev.tradeLog, entry]
        const newProgress = success ? prev.progress + 1 : prev.progress
        const newStreak = success ? prev.streak + 1 : 0

        // Check for completion
        if (newProgress >= prev.targetTrades) {
          // Move to completed
          const completed: CompletedChallenge = {
            challengeId: prev.id,
            title: prev.title,
            xpReward: prev.xpReward,
            completedAt: new Date().toISOString(),
            finalStreak: newStreak,
            targetTrades: prev.targetTrades,
          }
          setCompletedChallenges((old) => {
            const updated = [completed, ...old]
            saveCompleted(updated)
            return updated
          })
          saveActive(null)

          setTimeout(() => {
            toast.success(`Challenge Complete! ${prev.icon} ${prev.title}`, {
              description: `+${prev.xpReward} XP earned. Outstanding discipline!`,
              duration: 6000,
            })
          }, 300)

          return null
        }

        // Streak milestone toasts
        if (success && newStreak === 3) {
          setTimeout(() => toast.info('3 in a row! 🔥 You\'re building real discipline.', { duration: 3000 }), 200)
        }
        if (success && newStreak === 5) {
          setTimeout(() => toast.info('5-trade streak! 🔥🔥 Remarkable consistency!', { duration: 3000 }), 200)
        }
        if (!success && prev.streak >= 3) {
          setTimeout(() => toast.warning(`Streak broken — but ${newProgress} trades still count. Keep going!`, { duration: 3500 }), 200)
        }

        const updated: ActiveChallenge = {
          ...prev,
          progress: newProgress,
          streak: newStreak,
          tradeLog: newLog,
        }
        saveActive(updated)
        return updated
      })
    },
    []
  )

  const generateChallenge = React.useCallback(async (profileSummary?: string, aiWeakness?: string) => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/challenges/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileSummary, aiWeakness }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      if (data.challengeId) {
        acceptChallenge(data.challengeId, data.personalizedDescription)
      }
    } catch {
      // Fallback: pick first uncompleted challenge
      const fallbackId = Object.keys(CHALLENGE_TEMPLATES).find(
        (id) => !completedChallenges.some((c) => c.challengeId === id)
      ) || 'discipline_test'
      acceptChallenge(fallbackId)
    } finally {
      setIsGenerating(false)
    }
  }, [acceptChallenge, completedChallenges])

  const value: ChallengeContextType = React.useMemo(
    () => ({
      activeChallenge,
      completedChallenges,
      isChallengeCompleted,
      acceptChallenge,
      skipChallenge,
      logTrade,
      generateChallenge,
      isGenerating,
    }),
    [activeChallenge, completedChallenges, isChallengeCompleted, acceptChallenge, skipChallenge, logTrade, generateChallenge, isGenerating]
  )

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>
}

export function useChallenges(): ChallengeContextType {
  const ctx = React.useContext(ChallengeContext)
  if (!ctx) throw new Error('useChallenges must be used within ChallengeProvider')
  return ctx
}
