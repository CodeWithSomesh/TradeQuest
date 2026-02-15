import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getAIModel } from '@/lib/ai-provider'

const AnalysisSchema = z.object({
  preferred_product: z.string().describe('Trading products/markets the user prefers'),
  trading_timeline: z.string().describe('Trading timeframe (scalping/day trading/swing/investing)'),
  experience_level: z.string().describe('Beginner/Intermediate/Advanced'),
  primary_objective: z.string().describe('Main trading goal (income/wealth/recreation)'),
  primary_challenge: z.string().describe('Biggest trading challenge (discipline/analysis/execution/risk)'),
  coach_profile_summary: z.string().describe('2-3 sentence summary of the trader profile and mindset'),
  risk_factor: z.string().describe('Primary risk behaviour pattern identified'),
  recommended_focus: z.string().describe('Top recommended area to focus on for improvement'),
})

const MOCK_ANALYSIS = {
  preferred_product: 'Forex, Crypto',
  trading_timeline: 'Day Trading',
  experience_level: 'Intermediate',
  primary_objective: 'Income',
  primary_challenge: 'Discipline',
  coach_profile_summary: 'Shows potential but lacks consistency. Would benefit from a structured rule-based approach.',
  risk_factor: 'Emotional Execution',
  recommended_focus: 'Systematic Rule Implementation',
}

export async function POST(req: Request) {
  console.log('[onboarding] Starting process...')

  try {
    const body = await req.json().catch(() => { throw new Error('Invalid JSON in request body') })
    const { responses } = body

    // AI Analysis
    let analysis: typeof MOCK_ANALYSIS

    const aiModel = getAIModel()
    if (!aiModel) {
      console.warn('[onboarding] No AI key configured — using mock analysis')
      analysis = MOCK_ANALYSIS
    } else {
      console.log(`[onboarding] Calling AI (${aiModel.provider})...`)
      const { object } = await generateObject({
        model: aiModel.model,
        schema: AnalysisSchema,
        prompt: `You are a professional trading coach. Analyze these onboarding responses and extract a structured profile.

Onboarding responses: ${JSON.stringify(responses)}

Extract accurate information from the answers. Be specific and insightful in the coach_profile_summary. Identify the real primary challenge based on their answers about losses, emotional reactions, and trading philosophy.`,
      })
      analysis = object
    }

    // Supabase insert
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are missing')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('[onboarding] Inserting into Supabase...')
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: null,
        full_name: responses.name || 'Anonymous Trader',
        preferred_product: analysis.preferred_product,
        trading_timeline: analysis.trading_timeline,
        experience_level: analysis.experience_level,
        primary_objective: analysis.primary_objective,
        primary_challenge: analysis.primary_challenge,
        coach_profile_summary: analysis.coach_profile_summary,
        risk_factor: analysis.risk_factor,
        recommended_focus: analysis.recommended_focus,
        raw_onboarding_responses: responses,
      }])
      .select()
      .single()

    if (error) {
      console.error('[onboarding] Supabase error:', error)
      return NextResponse.json({ success: false, error: error.message, details: error })
    }

    console.log('[onboarding] Success! DB ID:', data.id)
    return NextResponse.json({ success: true, analysis, dbId: data.id })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    console.error('[onboarding] Critical error:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
