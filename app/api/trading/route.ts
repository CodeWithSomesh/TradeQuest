import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// CORS for extension (chrome-extension:// and localhost)
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const supabase = await createClient()

    if (!sessionId) {
      const { data: sessions } = await supabase
        .from('trading_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5)
      return NextResponse.json({ sessions: sessions ?? [] }, { headers: corsHeaders() })
    }

    const { data: session } = await supabase
      .from('trading_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ session: null, events: [] }, { headers: corsHeaders() })
    }

    const { data: events } = await supabase
      .from('trading_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({ session, events: events ?? [] }, { headers: corsHeaders() })
  } catch (e) {
    console.error('[trading API] GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500, headers: corsHeaders() })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, event_type, amount, balance, message, loss_percent, initial_balance, currency, pattern_type } = body

    if (!session_id || !event_type) {
      return NextResponse.json({ error: 'session_id and event_type required' }, { status: 400, headers: corsHeaders() })
    }

    if (event_type === 'pattern_alert') {
      const supabase = await createClient()
      const { data: existing } = await supabase.from('trading_sessions').select('id').eq('session_id', session_id).single()
      if (!existing) {
        await supabase.from('trading_sessions').insert({ session_id, currency: 'USD' })
      }
      await supabase.from('trading_events').insert({
        session_id,
        event_type: 'pattern_alert',
        message: message ?? null,
      })
      return NextResponse.json({ ok: true }, { headers: corsHeaders() })
    }

    const supabase = await createClient()

    if (event_type === 'connect') {
      const { data: existing } = await supabase.from('trading_sessions').select('id').eq('session_id', session_id).single()
      if (!existing) {
        await supabase.from('trading_sessions').insert({
          session_id,
          initial_balance: initial_balance ?? balance,
          currency: currency ?? 'USD',
        })
      }
      return NextResponse.json({ ok: true }, { headers: corsHeaders() })
    }

    const { data: existing } = await supabase.from('trading_sessions').select('id').eq('session_id', session_id).single()
    if (!existing) {
      await supabase.from('trading_sessions').insert({
        session_id,
        initial_balance: initial_balance ?? balance,
        currency: currency ?? 'USD',
      })
    }

    await supabase.from('trading_events').insert({
      session_id,
      event_type,
      amount: amount ?? null,
      balance: balance ?? null,
      message: message ?? null,
      loss_percent: loss_percent ?? null,
    })

    return NextResponse.json({ ok: true }, { headers: corsHeaders() })
  } catch (e) {
    console.error('[trading API] POST error:', e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500, headers: corsHeaders() })
  }
}
