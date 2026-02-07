-- Trading Journal - Seed Data
-- Sample data for development and testing
-- Last updated: 2026-02-07

-- =====================================================
-- IMPORTANT: Replace UUIDs with actual auth.users IDs
-- =====================================================
-- This seed data uses placeholder UUIDs. In production:
-- 1. Create a test user via Supabase Auth
-- 2. Replace 'REPLACE-WITH-USER-UUID' with actual user ID
-- 3. Run this seed script

-- For testing, you can create a dummy UUID:
-- SELECT gen_random_uuid();

-- =====================================================
-- 1. USER PROFILE
-- =====================================================
-- Note: Assumes a user already exists in auth.users
-- Create via Supabase Dashboard: Authentication → Users → Invite User

INSERT INTO user_profiles (
  id,
  email,
  display_name,
  timezone,
  trading_style,
  risk_per_trade_percent,
  daily_loss_limit,
  weekly_loss_limit,
  account_balance,
  ai_features_enabled,
  preferred_ai_model
) VALUES (
  'REPLACE-WITH-USER-UUID',  -- Replace with actual auth.users ID
  'demo@example.com',
  'Demo Trader',
  'America/New_York',
  'day_trader',
  1.00,
  200.00,
  500.00,
  10000.00,
  false,
  'openai/gpt-4-turbo'
);

-- =====================================================
-- 2. STRATEGIES
-- =====================================================

INSERT INTO strategies (id, user_id, name, description, entry_rules, exit_rules, risk_reward_target, win_rate_target) VALUES
(
  gen_random_uuid(),
  'REPLACE-WITH-USER-UUID',
  'Bull Flag Breakout',
  'Trade bull flags on strong trending stocks with volume confirmation',
  'Entry: Break above flag resistance with volume 1.5x average. Must be in uptrend on daily chart.',
  'Exit: 1) Target at measured move, 2) Stop loss at flag low, 3) Trail stop once 2R achieved',
  2.50,
  65.00
),
(
  gen_random_uuid(),
  'REPLACE-WITH-USER-UUID',
  'VWAP Bounce',
  'Scalp bounce off VWAP on 5-minute chart',
  'Entry: Price touches VWAP, bullish candle formation, above average volume',
  'Exit: 1) Quick profit at resistance, 2) Stop below VWAP, 3) Exit if breaks VWAP',
  1.50,
  55.00
),
(
  gen_random_uuid(),
  'REPLACE-WITH-USER-UUID',
  'Gap Fill Short',
  'Short stocks that gap up without news',
  'Entry: After initial pump, wait for rejection at resistance, short with confirmation',
  'Exit: 1) Target at gap fill, 2) Stop above recent high, 3) Cover if strong buying',
  3.00,
  60.00
);

-- =====================================================
-- 3. TRADES WITH JOURNALS
-- =====================================================

-- Trade 1: Winning trade - followed plan perfectly
DO $$
DECLARE
  v_user_id UUID := 'REPLACE-WITH-USER-UUID';
  v_strategy_id UUID;
  v_trade_id UUID;
  v_pre_journal_id UUID;
BEGIN
  -- Get Bull Flag strategy
  SELECT id INTO v_strategy_id FROM strategies WHERE user_id = v_user_id AND name = 'Bull Flag Breakout';
  
  -- Insert trade
  INSERT INTO trades (
    user_id, ticker, direction, strategy_id,
    entry_date, exit_date, entry_price, exit_price, quantity,
    commissions, gross_pnl, net_pnl, return_percent,
    initial_stop_loss, actual_stop_loss, actual_rr,
    hold_duration_minutes, market_conditions
  ) VALUES (
    v_user_id, 'AAPL', 'long', v_strategy_id,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
    180.50, 185.75, 100,
    2.00, 525.00, 523.00, 2.90,
    178.00, 178.00, 2.1,
    120, ARRAY['trending', 'high_volume']
  ) RETURNING id INTO v_trade_id;
  
  -- Pre-trade journal
  INSERT INTO pre_trade_journals (
    user_id, trade_id, strategy_id,
    emotional_state, emotional_score,
    market_bias, spy_trend, sector_context,
    setup_quality, confluence_factors,
    planned_entry, planned_stop_loss, planned_target, planned_risk_reward,
    thesis, concerns
  ) VALUES (
    v_user_id, v_trade_id, v_strategy_id,
    ARRAY['confident', 'neutral'], 5,
    'bullish', 'uptrend', 'Tech sector showing strength, SPY at highs',
    4, ARRAY['200MA support', 'volume spike', 'higher timeframe trend'],
    180.50, 178.00, 185.50, 2.0,
    'Clean bull flag on daily chart. Strong consolidation after uptrend. Volume drying up in flag, expecting breakout.',
    'Market has been extended, could see pullback'
  ) RETURNING id INTO v_pre_journal_id;
  
  -- Post-trade journal
  INSERT INTO post_trade_journals (
    user_id, trade_id, pre_trade_journal_id,
    emotional_state, emotional_score,
    execution_quality, followed_plan, rule_violations,
    what_went_well, what_went_wrong, lessons_learned,
    would_repeat, repeat_reasoning
  ) VALUES (
    v_user_id, v_trade_id, v_pre_journal_id,
    ARRAY['validated', 'proud'], 7,
    5, true, ARRAY[]::TEXT[],
    'Perfect entry at planned price. Waited for volume confirmation. Stuck to exit plan and let winner run.',
    'Nothing - executed exactly as planned',
    'Patience paid off. Following the plan works.',
    true, 'Textbook setup and execution. Would take this again 10/10 times.'
  );
END $$;

-- Trade 2: Losing trade - but followed plan
DO $$
DECLARE
  v_user_id UUID := 'REPLACE-WITH-USER-UUID';
  v_strategy_id UUID;
  v_trade_id UUID;
  v_pre_journal_id UUID;
BEGIN
  SELECT id INTO v_strategy_id FROM strategies WHERE user_id = v_user_id AND name = 'VWAP Bounce';
  
  INSERT INTO trades (
    user_id, ticker, direction, strategy_id,
    entry_date, exit_date, entry_price, exit_price, quantity,
    commissions, gross_pnl, net_pnl, return_percent,
    initial_stop_loss, actual_stop_loss, actual_rr,
    hold_duration_minutes, market_conditions
  ) VALUES (
    v_user_id, 'TSLA', 'long', v_strategy_id,
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days' + INTERVAL '15 minutes',
    245.30, 243.80, 50,
    2.00, -75.00, -77.00, -0.31,
    244.50, 244.50, -1.0,
    15, ARRAY['volatile', 'choppy']
  ) RETURNING id INTO v_trade_id;
  
  INSERT INTO pre_trade_journals (
    user_id, trade_id, strategy_id,
    emotional_state, emotional_score,
    market_bias, spy_trend,
    setup_quality, confluence_factors,
    planned_entry, planned_stop_loss, planned_target,
    thesis
  ) VALUES (
    v_user_id, v_trade_id, v_strategy_id,
    ARRAY['confident'], 6,
    'neutral', 'sideways',
    3, ARRAY['VWAP support', 'bullish divergence'],
    245.30, 244.50, 246.50,
    'Bounce off VWAP with bullish engulfing candle'
  ) RETURNING id INTO v_pre_journal_id;
  
  INSERT INTO post_trade_journals (
    user_id, trade_id, pre_trade_journal_id,
    emotional_state, emotional_score,
    execution_quality, followed_plan, rule_violations,
    what_went_well, what_went_wrong, lessons_learned,
    would_repeat
  ) VALUES (
    v_user_id, v_trade_id, v_pre_journal_id,
    ARRAY['disappointed', 'neutral'], 5,
    4, true, ARRAY[]::TEXT[],
    'Stuck to stop loss. Cut loss quickly without hesitation.',
    'Market was too choppy. Should have waited for clearer trend.',
    'Not every setup works. Important to respect stop loss.',
    false
  );
END $$;

-- Trade 3: Winning trade - but with rule violation (moved stop)
DO $$
DECLARE
  v_user_id UUID := 'REPLACE-WITH-USER-UUID';
  v_strategy_id UUID;
  v_trade_id UUID;
  v_pre_journal_id UUID;
BEGIN
  SELECT id INTO v_strategy_id FROM strategies WHERE user_id = v_user_id AND name = 'Bull Flag Breakout';
  
  INSERT INTO trades (
    user_id, ticker, direction, strategy_id,
    entry_date, exit_date, entry_price, exit_price, quantity,
    commissions, gross_pnl, net_pnl, return_percent,
    initial_stop_loss, actual_stop_loss, actual_rr,
    hold_duration_minutes
  ) VALUES (
    v_user_id, 'NVDA', 'long', v_strategy_id,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '3 hours',
    480.00, 488.50, 25,
    2.00, 212.50, 210.50, 0.44,
    476.00, 474.00, 2.1,  -- Moved stop lower!
    180
  ) RETURNING id INTO v_trade_id;
  
  INSERT INTO pre_trade_journals (
    user_id, trade_id, strategy_id,
    emotional_state, emotional_score,
    setup_quality,
    planned_entry, planned_stop_loss, planned_target,
    thesis
  ) VALUES (
    v_user_id, v_trade_id, v_strategy_id,
    ARRAY['overconfident'], 7,
    5,
    480.00, 476.00, 492.00,
    'Perfect flag breakout with huge volume'
  ) RETURNING id INTO v_pre_journal_id;
  
  INSERT INTO post_trade_journals (
    user_id, trade_id, pre_trade_journal_id,
    emotional_state, emotional_score,
    execution_quality, followed_plan, rule_violations,
    what_went_well, what_went_wrong, lessons_learned,
    would_repeat, repeat_reasoning
  ) VALUES (
    v_user_id, v_trade_id, v_pre_journal_id,
    ARRAY['relieved', 'regret'], 6,
    3, false, ARRAY['moved_stop_loss'],
    'Trade worked out eventually',
    'Moved my stop loss when price came close. Got lucky it reversed. Could have been a bigger loss.',
    'Never move stop loss! Got lucky this time. Next time might not be so lucky.',
    false,
    'Even though it worked, moving stop loss was wrong. Need to trust my original plan.'
  );
END $$;

-- Trade 4: FOMO trade - loss
DO $$
DECLARE
  v_user_id UUID := 'REPLACE-WITH-USER-UUID';
  v_trade_id UUID;
  v_pre_journal_id UUID;
BEGIN
  INSERT INTO trades (
    user_id, ticker, direction,
    entry_date, exit_date, entry_price, exit_price, quantity,
    commissions, gross_pnl, net_pnl, return_percent,
    initial_stop_loss, actual_rr,
    hold_duration_minutes
  ) VALUES (
    v_user_id, 'MSTR', 'long',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '30 minutes',
    520.00, 510.00, 20,
    2.00, -200.00, -202.00, -0.19,
    515.00, -2.0,
    30
  ) RETURNING id INTO v_trade_id;
  
  INSERT INTO pre_trade_journals (
    user_id, trade_id,
    emotional_state, emotional_score,
    market_bias,
    setup_quality,
    planned_entry, planned_stop_loss,
    thesis, concerns
  ) VALUES (
    v_user_id, v_trade_id,
    ARRAY['FOMO', 'anxious'], 8,
    'bullish',
    2,  -- Low setup quality!
    520.00, 515.00,
    'Stock is ripping higher, don''t want to miss it',
    'Chasing price, no clear support level'
  ) RETURNING id INTO v_pre_journal_id;
  
  INSERT INTO post_trade_journals (
    user_id, trade_id, pre_trade_journal_id,
    emotional_state, emotional_score,
    execution_quality, followed_plan, rule_violations,
    what_went_well, what_went_wrong, lessons_learned,
    would_repeat
  ) VALUES (
    v_user_id, v_trade_id, v_pre_journal_id,
    ARRAY['frustrated', 'regret'], 3,
    1, false, ARRAY['revenge_trade', 'no_stop_loss'],
    'Cut loss relatively quickly',
    'Chased the move. No real setup. Bought at the top. Pure FOMO.',
    'NEVER CHASE! Wait for pullback. FOMO trades always lose. This is a expensive lesson.',
    false
  );
END $$;

-- Trade 5: Open position (no exit yet)
DO $$
DECLARE
  v_user_id UUID := 'REPLACE-WITH-USER-UUID';
  v_strategy_id UUID;
  v_trade_id UUID;
BEGIN
  SELECT id INTO v_strategy_id FROM strategies WHERE user_id = v_user_id AND name = 'Gap Fill Short';
  
  INSERT INTO trades (
    user_id, ticker, direction, strategy_id,
    entry_date, entry_price, quantity,
    initial_stop_loss,
    market_conditions
  ) VALUES (
    v_user_id, 'PLTR', 'short', v_strategy_id,
    NOW() - INTERVAL '1 hour',
    28.50, 100,
    29.50,
    ARRAY['volatile', 'post_market']
  ) RETURNING id INTO v_trade_id;
  
  INSERT INTO pre_trade_journals (
    user_id, trade_id, strategy_id,
    emotional_state, emotional_score,
    market_bias,
    setup_quality, confluence_factors,
    planned_entry, planned_stop_loss, planned_target, planned_risk_reward,
    thesis
  ) VALUES (
    v_user_id, v_trade_id, v_strategy_id,
    ARRAY['confident', 'neutral'], 5,
    'bearish',
    4, ARRAY['gap up without news', 'resistance at 29', 'volume dry-up'],
    28.50, 29.50, 26.50, 2.0,
    'Gapped up 8% on no news. Likely to fill gap. Shorting at resistance with confirmation.'
  );
END $$;

-- =====================================================
-- 4. GAMIFICATION DATA
-- =====================================================

INSERT INTO gamification (
  user_id,
  current_journaling_streak,
  longest_journaling_streak,
  last_journal_date,
  total_trades_logged,
  total_days_journaled,
  badges
) VALUES (
  'REPLACE-WITH-USER-UUID',
  5,
  12,
  CURRENT_DATE,
  5,
  5,
  jsonb_build_array(
    jsonb_build_object('badge', '10_trades', 'earned_at', NOW() - INTERVAL '2 days'),
    jsonb_build_object('badge', '7_day_streak', 'earned_at', NOW() - INTERVAL '1 day')
  )
);

-- =====================================================
-- 5. TRADING PLAN (Today's Plan)
-- =====================================================

INSERT INTO trading_plans (
  user_id,
  plan_date,
  market_outlook,
  watchlist,
  max_trades_allowed,
  max_loss_limit,
  focus_strategies,
  personal_reminders
) VALUES (
  'REPLACE-WITH-USER-UUID',
  CURRENT_DATE,
  'Market looks choppy today. SPY at resistance. Will only take high-quality setups.',
  jsonb_build_array(
    jsonb_build_object('ticker', 'AAPL', 'trigger', 'breakout above 182'),
    jsonb_build_object('ticker', 'MSFT', 'trigger', 'bounce off 200MA at 410'),
    jsonb_build_object('ticker', 'TSLA', 'trigger', 'gap fill to 240')
  ),
  3,
  150.00,
  ARRAY['Bull Flag Breakout', 'VWAP Bounce'],
  ARRAY['Wait for confirmation', 'Don''t chase', 'Respect stop losses', 'Trade the setup, not the outcome']
);

-- =====================================================
-- SEED DATA SUMMARY
-- =====================================================
-- Created:
-- - 1 User profile (demo trader)
-- - 3 Strategies (Bull Flag, VWAP Bounce, Gap Fill Short)
-- - 5 Trades:
--   * Trade 1: Win, followed plan perfectly
--   * Trade 2: Loss, followed plan (good loss)
--   * Trade 3: Win, but moved stop loss (bad win)
--   * Trade 4: Loss, FOMO trade (bad loss)
--   * Trade 5: Open position (in progress)
-- - 5 Pre-trade journals
-- - 4 Post-trade journals (one trade still open)
-- - 1 Gamification record with 2 badges
-- - 1 Trading plan for today
--
-- This data demonstrates:
-- ✅ Different emotional states
-- ✅ Rule violations and consequences
-- ✅ Winning and losing trades
-- ✅ Good and bad execution
-- ✅ Psychology tracking
-- ✅ Gamification features
-- ✅ Trade planning
--
-- REMEMBER: Replace 'REPLACE-WITH-USER-UUID' with actual user ID from auth.users!
