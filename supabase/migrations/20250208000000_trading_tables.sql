-- Trading sessions and events for Deriv AI Coach
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS trading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  initial_balance DECIMAL(18,2),
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'win' | 'loss' | 'connect'
  amount DECIMAL(18,2),
  balance DECIMAL(18,2),
  message TEXT,
  loss_percent DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_events_session ON trading_events(session_id);
CREATE INDEX IF NOT EXISTS idx_trading_events_created ON trading_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_sessions_started ON trading_sessions(started_at DESC);

-- Enable RLS (optional - for multi-tenant)
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert/select for hackathon demo
CREATE POLICY "Allow all for trading_sessions" ON trading_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for trading_events" ON trading_events FOR ALL USING (true) WITH CHECK (true);
