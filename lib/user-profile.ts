/**
 * lib/user-profile.ts
 * Bridge between onboarding (Supabase) and the rest of the app (localStorage).
 * After onboarding, the AI analysis is saved here and read by quests + coach.
 */

export type StoredProfile = {
  dbId: string
  full_name: string
  preferred_product: string
  trading_timeline: string
  experience_level: string
  primary_objective: string
  primary_challenge: string
  coach_profile_summary: string
  risk_factor: string
  recommended_focus: string
}

const KEY = 'tradequest_profile'

export function saveProfile(
  dbId: string,
  analysis: Record<string, string>,
  name: string
): void {
  if (typeof window === 'undefined') return
  const profile: StoredProfile = {
    dbId,
    full_name: name || 'Trader',
    preferred_product: analysis.preferred_product || '',
    trading_timeline: analysis.trading_timeline || '',
    experience_level: analysis.experience_level || '',
    primary_objective: analysis.primary_objective || '',
    primary_challenge: analysis.primary_challenge || '',
    coach_profile_summary: analysis.coach_profile_summary || '',
    risk_factor: analysis.risk_factor || '',
    recommended_focus: analysis.recommended_focus || '',
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch {
    // Ignore quota errors
  }
}

export function getProfile(): StoredProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredProfile) : null
  } catch {
    return null
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignore
  }
}
