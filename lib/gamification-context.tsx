'use client'

/**
 * lib/gamification-context.tsx
 * XP, levels, and quest completion — persisted to localStorage.
 * Quest completion: 100 XP per quest. Level = floor(xp / 500) + 1.
 */

import * as React from 'react'
import { toast } from 'sonner'

const XP_KEY = 'tradequest_xp'
const QUESTS_KEY = 'tradequest_completed_quests'
const XP_PER_QUEST = 100
const XP_PER_LEVEL = 500

type GamificationContextType = {
  xp: number
  level: number
  xpToNextLevel: number
  xpProgressPercent: number
  completedQuestIds: Set<number>
  awardXP: (amount: number, reason?: string) => void
  completeQuest: (questId: number, questTitle?: string) => void
  isQuestCompleted: (questId: number) => boolean
}

const GamificationContext = React.createContext<GamificationContextType | null>(null)

function loadFromStorage(): { xp: number; completedIds: number[] } {
  if (typeof window === 'undefined') return { xp: 0, completedIds: [] }
  try {
    const xp = parseInt(localStorage.getItem(XP_KEY) || '0', 10) || 0
    const raw = localStorage.getItem(QUESTS_KEY)
    const completedIds = raw ? (JSON.parse(raw) as number[]) : []
    return { xp, completedIds }
  } catch {
    return { xp: 0, completedIds: [] }
  }
}

function saveToStorage(xp: number, completedIds: number[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(XP_KEY, String(xp))
    localStorage.setItem(QUESTS_KEY, JSON.stringify(completedIds))
  } catch {
    // Ignore quota errors
  }
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = React.useState(0)
  const [completedQuestIds, setCompletedQuestIds] = React.useState<Set<number>>(new Set())

  // Load from localStorage on mount
  React.useEffect(() => {
    const { xp: storedXp, completedIds } = loadFromStorage()
    setXp(storedXp)
    setCompletedQuestIds(new Set(completedIds))
  }, [])

  const level = Math.floor(xp / XP_PER_LEVEL) + 1
  const xpInCurrentLevel = xp % XP_PER_LEVEL
  const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel
  const xpProgressPercent = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100)

  const awardXP = React.useCallback((amount: number, reason?: string) => {
    setXp((prev) => {
      const newXp = prev + amount
      const oldLevel = Math.floor(prev / XP_PER_LEVEL) + 1
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
      saveToStorage(newXp, Array.from(completedQuestIds))
      if (newLevel > oldLevel) {
        setTimeout(() => {
          toast.success(`Level Up! You are now Level ${newLevel}`, {
            description: `+${amount} XP${reason ? ` — ${reason}` : ''}`,
            duration: 5000,
          })
        }, 300)
      }
      return newXp
    })
  }, [completedQuestIds])

  const completeQuest = React.useCallback((questId: number, questTitle?: string) => {
    setCompletedQuestIds((prev) => {
      if (prev.has(questId)) return prev
      const newSet = new Set(prev)
      newSet.add(questId)
      setXp((currentXp) => {
        const newXp = currentXp + XP_PER_QUEST
        saveToStorage(newXp, Array.from(newSet))
        const oldLevel = Math.floor(currentXp / XP_PER_LEVEL) + 1
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
        if (newLevel > oldLevel) {
          setTimeout(() => {
            toast.success(`Level Up! You are now Level ${newLevel}`, {
              description: `Quest complete: +${XP_PER_QUEST} XP`,
              duration: 5000,
            })
          }, 500)
        } else {
          setTimeout(() => {
            toast.success(`Quest Complete! +${XP_PER_QUEST} XP`, {
              description: questTitle || 'Keep going — more quests await!',
              duration: 4000,
            })
          }, 300)
        }
        return newXp
      })
      return newSet
    })
  }, [])

  const isQuestCompleted = React.useCallback(
    (questId: number) => completedQuestIds.has(questId),
    [completedQuestIds]
  )

  const value: GamificationContextType = React.useMemo(
    () => ({
      xp,
      level,
      xpToNextLevel,
      xpProgressPercent,
      completedQuestIds,
      awardXP,
      completeQuest,
      isQuestCompleted,
    }),
    [xp, level, xpToNextLevel, xpProgressPercent, completedQuestIds, awardXP, completeQuest, isQuestCompleted]
  )

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

export function useGamification(): GamificationContextType {
  const ctx = React.useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification must be used within GamificationProvider')
  return ctx
}
