'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  IconTarget,
  IconFlame,
  IconCircleCheck,
  IconLoader2,
  IconBrain,
  IconStar,
  IconChevronRight,
  IconX,
  IconTrendingUp,
  IconSparkles,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useChallenges } from '@/lib/challenge-context'
import { useGamification } from '@/lib/gamification-context'
import { getProfile } from '@/lib/user-profile'
import {
  CHALLENGE_TEMPLATES,
  CHALLENGE_ORDER,
  DIFFICULTY_COLORS,
  type ChallengeTemplate,
} from '@/lib/challenge-types'

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ percent, size = 80, stroke = 7 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#FF444F"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

// ─── Active Challenge Card ────────────────────────────────────────────────────

function ActiveChallengeCard() {
  const { activeChallenge, logTrade, skipChallenge } = useChallenges()
  const { awardXP } = useGamification()
  const [confirmSkip, setConfirmSkip] = React.useState(false)

  if (!activeChallenge) return null

  const progressPct = Math.round((activeChallenge.progress / activeChallenge.targetTrades) * 100)
  const remaining = activeChallenge.targetTrades - activeChallenge.progress

  const handleLogSuccess = () => {
    const wasLastTrade = activeChallenge.progress + 1 >= activeChallenge.targetTrades
    logTrade(true)
    if (wasLastTrade) {
      awardXP(activeChallenge.xpReward, activeChallenge.title)
    }
  }

  return (
    <Card className="border-[#FF444F]/30 bg-[#FF444F]/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeChallenge.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FF444F]">Active Challenge</span>
                <Badge variant="outline" className={`text-[9px] ${DIFFICULTY_COLORS[activeChallenge.difficulty]}`}>
                  {activeChallenge.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-xl">{activeChallenge.title}</CardTitle>
            </div>
          </div>
          <div className="relative shrink-0">
            <ProgressRing percent={progressPct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums">{progressPct}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Personalized description */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {activeChallenge.personalizedDescription}
        </p>

        {/* Rule */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Rule</p>
          <p className="text-sm font-medium text-foreground">{activeChallenge.requirement}</p>
        </div>

        {/* Progress bar + streak */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {activeChallenge.progress}/{activeChallenge.targetTrades} trades
            </span>
            {activeChallenge.streak >= 2 && (
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <IconFlame className="size-4" />
                {activeChallenge.streak} streak
              </span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF444F] transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining} more trade{remaining !== 1 ? 's' : ''} to complete &middot; Est. {activeChallenge.estimatedDuration}
          </p>
        </div>

        {/* Impact preview */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2">
          <IconTrendingUp className="size-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-400">{activeChallenge.impact}</p>
        </div>

        {/* Log trade buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
            onClick={handleLogSuccess}
          >
            <IconCircleCheck className="size-4" />
            ✅ Followed the Rule
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white/10 gap-2"
            onClick={() => logTrade(false)}
          >
            <IconX className="size-4 text-[#FF444F]" />
            ❌ Broke the Rule
          </Button>
        </div>

        {/* Skip */}
        {confirmSkip ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground flex-1">Abandon this challenge?</span>
            <Button size="sm" variant="destructive" onClick={skipChallenge}>Yes, skip</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmSkip(false)}>Cancel</Button>
          </div>
        ) : (
          <button
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            onClick={() => setConfirmSkip(true)}
          >
            Skip this challenge
          </button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Challenge Library Card ───────────────────────────────────────────────────

function ChallengeLibraryCard({ template, isCompleted, isActive }: {
  template: ChallengeTemplate
  isCompleted: boolean
  isActive: boolean
}) {
  const { acceptChallenge } = useChallenges()

  return (
    <div className={`rounded-xl border p-5 transition-all ${
      isActive ? 'border-[#FF444F]/40 bg-[#FF444F]/5' :
      isCompleted ? 'border-emerald-500/30 bg-emerald-500/5 opacity-70' :
      'border-white/10 bg-white/[0.02] hover:border-white/20'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{template.icon}</span>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{template.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className={`text-[9px] ${DIFFICULTY_COLORS[template.difficulty]}`}>
                {template.difficulty}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{template.type}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-400 shrink-0">
          <IconStar className="size-3" />
          <span className="text-xs font-bold">{template.xpReward} XP</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{template.description}</p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{template.targetTrades} trades &middot; {template.estimatedDuration}</span>
        {isCompleted ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <IconCircleCheck className="size-3.5" /> Completed
          </span>
        ) : isActive ? (
          <span className="text-xs text-[#FF444F] font-medium">In Progress</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-white/20 hover:border-[#FF444F]/40 hover:text-[#FF444F] gap-1"
            onClick={() => acceptChallenge(template.id)}
          >
            Start <IconChevronRight className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Completed History ────────────────────────────────────────────────────────

function CompletedHistorySection() {
  const { completedChallenges } = useChallenges()
  if (!completedChallenges.length) return null

  return (
    <Card className="border-white/10">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IconCircleCheck className="size-4 text-emerald-400" />
          Completed Challenges
        </CardTitle>
        <CardDescription>Your behavioral improvement track record</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {completedChallenges.map((c, i) => {
            const template = CHALLENGE_TEMPLATES[c.challengeId]
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/10 p-3">
                <span className="text-lg">{template?.icon || '🏆'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.completedAt).toLocaleDateString()} &middot; {c.finalStreak} final streak
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <IconStar className="size-3" />
                  <span className="text-xs font-bold">{c.xpReward}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChallengesPage() {
  const { activeChallenge, completedChallenges, isChallengeCompleted, generateChallenge, isGenerating } = useChallenges()
  const { xp, level, xpProgressPercent } = useGamification()

  const profile = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    return getProfile()
  }, [])

  const handleGenerateChallenge = async () => {
    if (!profile) {
      toast.info('Complete onboarding first to get a personalized challenge!', { duration: 3500 })
      return
    }
    const summary = [
      profile.coach_profile_summary,
      profile.primary_challenge,
      profile.recommended_focus,
    ].filter(Boolean).join('. ')
    await generateChallenge(summary, profile.primary_challenge)
  }

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconTarget className="size-6 text-[#FF444F]" />
            Trading Challenges
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gamified behavioral improvement. Complete challenges, earn XP, build real trading discipline.
          </p>
        </div>
        {/* XP badge */}
        <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-center min-w-[100px]">
          <div className="flex items-center gap-1 justify-center mb-1">
            <IconStar className="size-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Level {level}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-1">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${xpProgressPercent}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{xp.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Active challenge (hero) */}
      {activeChallenge ? (
        <ActiveChallengeCard />
      ) : (
        <Card className="border-dashed border-white/20">
          <CardContent className="py-12 text-center">
            <IconSparkles className="size-10 mx-auto mb-3 text-white/20" />
            <p className="font-semibold text-foreground/80 mb-1">No active challenge</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Start a challenge below, or let AI pick the best one based on your trading profile and behavioral patterns.
            </p>
            <Button
              onClick={handleGenerateChallenge}
              disabled={isGenerating}
              className="gap-2 bg-[#FF444F] hover:bg-[#FF444F]/90 text-white"
            >
              {isGenerating ? (
                <><IconLoader2 className="size-4 animate-spin" /> Generating...</>
              ) : (
                <><IconBrain className="size-4" /> AI Pick My Challenge</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Challenge Library */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Challenge Library
          </h2>
          <span className="text-xs text-muted-foreground">
            {completedChallenges.length}/{CHALLENGE_ORDER.length} completed
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHALLENGE_ORDER.map((id) => {
            const template = CHALLENGE_TEMPLATES[id]
            return (
              <ChallengeLibraryCard
                key={id}
                template={template}
                isCompleted={isChallengeCompleted(id)}
                isActive={activeChallenge?.id === id}
              />
            )
          })}
        </div>
      </div>

      {/* Why this works — pitch section */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <IconBrain className="size-4 text-[#FF444F]" />
            Why Behavioral Challenges Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            {[
              { icon: '🧠', title: 'Targets Real Habits', desc: 'Unlike lessons or quizzes, challenges enforce behavioral change through real trading practice.' },
              { icon: '📊', title: 'Personalized to You', desc: 'AI analyzes your trading patterns and picks the challenge that will help you most right now.' },
              { icon: '🔥', title: 'Streaks Build Discipline', desc: 'Consecutive successes rewire your brain\'s response to trading situations through repetition.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-foreground/90 mb-0.5">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CompletedHistorySection />
    </div>
  )
}
