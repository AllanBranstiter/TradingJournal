-- Trading Journal - Initial Schema Migration
-- Created: 2026-02-07
-- Description: Core tables for The Mindful Trader application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES (Extended User Data)
-- =====================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  trading_style TEXT CHECK (trading_style IN ('day_trader', 'swing_trader', 'position_trader', 'investor')),
  
  -- Risk Management Settings
  risk_per_trade_percent DECIMAL(4,2) DEFAULT 1.00,
  daily_loss_limit DECIMAL(10,2),
  weekly_loss_limit DECIMAL(10,2),
  account_balance DECIMAL(12,2),
  
  -- AI Configuration (User's Own API Key)
  openrouter_api_key TEXT, -- Encrypted at application level before storage
  preferred_ai_model TEXT DEFAULT 'openai/gpt-4-turbo', -- openrouter model ID
  ai_features_enabled BOOLEAN DEFAULT FALSE, -- TRUE when user provides API key
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookup
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

COMMENT ON TABLE user_profiles IS 'Extended user profile data with trading preferences and AI configuration';
COMMENT ON COLUMN user_profiles.openrouter_api_key IS 'Encrypted API key - encryption handled at application level';
COMMENT ON COLUMN user_profiles.ai_features_enabled IS 'TRUE when user has provided their OpenRouter API key';

-- =====================================================
-- 2. STRATEGIES (Trading Setups/Playbooks)
-- =====================================================
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Bull Flag Breakout"
  description TEXT,
  setup_criteria JSONB, -- Checklist: {"higher_timeframe_trend": "bullish", "volume": "above_average"}
  entry_rules TEXT,
  exit_rules TEXT,
  risk_reward_target DECIMAL(4,2),
  win_rate_target DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_user ON strategies(user_id);

COMMENT ON TABLE strategies IS 'User-defined trading strategies and playbooks';
COMMENT ON COLUMN strategies.setup_criteria IS 'JSONB checklist of conditions that must be met for this strategy';

-- =====================================================
-- 3. TRADES (Core Trade Data)
-- =====================================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Basic Trade Info
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  
  -- Execution Data
  entry_date TIMESTAMPTZ NOT NULL,
  exit_date TIMESTAMPTZ,
  entry_price DECIMAL(10,4) NOT NULL,
  exit_price DECIMAL(10,4),
  quantity INTEGER NOT NULL,
  
  -- Costs
  commissions DECIMAL(8,2) DEFAULT 0,
  slippage DECIMAL(8,2) DEFAULT 0,
  
  -- P&L Calculations (computed)
  gross_pnl DECIMAL(10,2),
  net_pnl DECIMAL(10,2),
  return_percent DECIMAL(6,2),
  
  -- Risk Management
  initial_stop_loss DECIMAL(10,4),
  actual_stop_loss DECIMAL(10,4), -- Did you move it?
  risk_amount DECIMAL(10,2),
  reward_amount DECIMAL(10,2),
  actual_rr DECIMAL(4,2), -- Actual R:R achieved
  
  -- Trade Metadata
  hold_duration_minutes INTEGER,
  market_conditions TEXT[], -- ['trending', 'volatile', 'pre_market']
  screenshot_url TEXT, -- Chart screenshot from Supabase Storage
  
  -- CSV Import Flag
  imported_from_csv BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_trades_user_date ON trades(user_id, entry_date DESC);
CREATE INDEX idx_trades_ticker ON trades(ticker);
CREATE INDEX idx_trades_strategy ON trades(strategy_id);
CREATE INDEX idx_trades_exit_date ON trades(exit_date) WHERE exit_date IS NOT NULL;

COMMENT ON TABLE trades IS 'Core trade execution data - the foundation of the journal';
COMMENT ON COLUMN trades.actual_stop_loss IS 'Track if trader moved their stop loss (rule violation)';
COMMENT ON COLUMN trades.imported_from_csv IS 'Flag trades imported from broker CSV for bulk processing';

-- =====================================================
-- 4. PRE-TRADE JOURNALS (Before Trade Execution)
-- =====================================================
CREATE TABLE pre_trade_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  
  -- Emotional State (Elder's "Emotional Temperature")
  emotional_state TEXT[] DEFAULT '{}', -- ['confident', 'anxious', 'neutral', 'FOMO', 'revenge']
  emotional_score INTEGER CHECK (emotional_score BETWEEN 1 AND 10), -- 1=fearful, 10=euphoric, 5=neutral
  
  -- Market Analysis
  market_bias TEXT CHECK (market_bias IN ('bullish', 'bearish', 'neutral', 'choppy')),
  spy_trend TEXT CHECK (spy_trend IN ('uptrend', 'downtrend', 'sideways')),
  sector_context TEXT, -- "Tech sector showing strength"
  
  -- Trade Setup Validation
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  setup_quality INTEGER CHECK (setup_quality BETWEEN 1 AND 5), -- How well does this match my playbook?
  confluence_factors TEXT[], -- ['200MA support', 'bullish divergence', 'volume spike']
  
  -- Pre-Trade Checklist (Douglas: "Consistency")
  checklist JSONB, -- {"higher_tf_aligned": true, "position_size_correct": true, "stop_loss_set": true}
  
  -- Planned Trade Parameters
  planned_entry DECIMAL(10,4),
  planned_stop_loss DECIMAL(10,4),
  planned_target DECIMAL(10,4),
  planned_risk_reward DECIMAL(4,2),
  planned_position_size INTEGER,
  planned_risk_amount DECIMAL(10,2),
  
  -- Notes
  thesis TEXT, -- "Expecting bounce off 200MA after bullish engulfing"
  concerns TEXT, -- "Market has been choppy, could fake breakout"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pre_trade_journals_user ON pre_trade_journals(user_id);
CREATE INDEX idx_pre_trade_journals_trade ON pre_trade_journals(trade_id);

COMMENT ON TABLE pre_trade_journals IS 'Pre-trade psychological and analytical state - captures trader mindset BEFORE execution';
COMMENT ON COLUMN pre_trade_journals.emotional_score IS '1-10 scale: 1=fearful, 5=neutral/calm, 10=euphoric/overconfident';
COMMENT ON COLUMN pre_trade_journals.setup_quality IS '1-5 stars: How well does this setup match your strategy criteria?';

-- =====================================================
-- 5. POST-TRADE JOURNALS (After Trade Exit)
-- =====================================================
CREATE TABLE post_trade_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  pre_trade_journal_id UUID REFERENCES pre_trade_journals(id) ON DELETE SET NULL,
  
  -- Emotional State Post-Trade
  emotional_state TEXT[] DEFAULT '{}', -- ['relieved', 'regret', 'validated', 'frustrated']
  emotional_score INTEGER CHECK (emotional_score BETWEEN 1 AND 10),
  
  -- Execution Analysis
  execution_quality INTEGER CHECK (execution_quality BETWEEN 1 AND 5), -- How well did I execute?
  followed_plan BOOLEAN, -- Did I stick to my pre-trade plan?
  rule_violations TEXT[], -- ['moved_stop_loss', 'oversized_position', 'exited_early']
  
  -- What Went Right/Wrong
  what_went_well TEXT,
  what_went_wrong TEXT,
  lessons_learned TEXT,
  
  -- AI Analysis Prompt
  reflection_notes TEXT, -- Free-form journaling for AI analysis
  ai_analysis_completed BOOLEAN DEFAULT FALSE,
  ai_insights JSONB, -- Stored AI analysis: {"detected_patterns": [...], "recommendations": [...]}
  
  -- Would You Take This Trade Again?
  would_repeat BOOLEAN,
  repeat_reasoning TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_trade_journals_user ON post_trade_journals(user_id);
CREATE INDEX idx_post_trade_journals_trade ON post_trade_journals(trade_id);
CREATE INDEX idx_post_trade_journals_pre ON post_trade_journals(pre_trade_journal_id);

COMMENT ON TABLE post_trade_journals IS 'Post-trade reflection - captures lessons learned and emotional state after exit';
COMMENT ON COLUMN post_trade_journals.followed_plan IS 'Critical metric: Did trader execute according to pre-trade plan?';
COMMENT ON COLUMN post_trade_journals.ai_insights IS 'JSONB storage for AI-generated psychological insights and pattern detection';

-- =====================================================
-- 6. PSYCHOLOGY METRICS (Aggregated Insights)
-- =====================================================
CREATE TABLE psychology_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Behavioral Metrics
  discipline_score INTEGER CHECK (discipline_score BETWEEN 0 AND 100),
  rule_adherence_rate DECIMAL(5,2), -- % of trades that followed rules
  fomo_trade_count INTEGER DEFAULT 0,
  revenge_trade_count INTEGER DEFAULT 0,
  
  -- Emotional Patterns
  most_common_pre_trade_emotion TEXT,
  most_common_post_trade_emotion TEXT,
  emotional_volatility DECIMAL(5,2), -- Std dev of emotional scores
  
  -- Performance Correlations
  disciplined_trade_win_rate DECIMAL(5,2),
  fomo_trade_win_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_psychology_metrics_user_period ON psychology_metrics(user_id, period_start, period_end);

COMMENT ON TABLE psychology_metrics IS 'Aggregated weekly/monthly psychological performance metrics';
COMMENT ON COLUMN psychology_metrics.discipline_score IS '0-100 score based on rule adherence and emotional control';

-- =====================================================
-- 7. TRADING PLANS (Daily/Weekly Plans)
-- =====================================================
CREATE TABLE trading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  plan_date DATE NOT NULL,
  market_outlook TEXT,
  watchlist JSONB, -- [{"ticker": "AAPL", "trigger": "breakout above 180"}]
  max_trades_allowed INTEGER,
  max_loss_limit DECIMAL(10,2),
  focus_strategies TEXT[],
  personal_reminders TEXT[], -- ["Wait for confirmation", "Don't chase"]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, plan_date)
);

CREATE INDEX idx_trading_plans_user_date ON trading_plans(user_id, plan_date DESC);

COMMENT ON TABLE trading_plans IS 'Daily/weekly trading plans to enforce discipline and preparation';
COMMENT ON COLUMN trading_plans.personal_reminders IS 'Personalized reminders to combat known psychological weaknesses';

-- =====================================================
-- 8. GAMIFICATION (Achievements & Streaks)
-- =====================================================
CREATE TABLE gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Streaks
  current_journaling_streak INTEGER DEFAULT 0,
  longest_journaling_streak INTEGER DEFAULT 0,
  last_journal_date DATE,
  
  -- Milestones
  total_trades_logged INTEGER DEFAULT 0,
  total_days_journaled INTEGER DEFAULT 0,
  
  -- Badges Earned
  badges JSONB DEFAULT '[]', -- [{"badge": "100_trades", "earned_at": "2026-01-15"}]
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_gamification_user ON gamification(user_id);

COMMENT ON TABLE gamification IS 'Gamification system to reward journaling consistency and discipline';
COMMENT ON COLUMN gamification.current_journaling_streak IS 'Days in a row with at least one journal entry';
COMMENT ON COLUMN gamification.badges IS 'JSONB array of earned badges with timestamps';
