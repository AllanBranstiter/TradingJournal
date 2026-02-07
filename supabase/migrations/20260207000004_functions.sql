-- Trading Journal - Database Functions & Triggers
-- Created: 2026-02-07
-- Description: Helper functions and automated triggers

-- =====================================================
-- 1. AUTO-UPDATE TIMESTAMPS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_plans_updated_at
  BEFORE UPDATE ON trading_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_updated_at
  BEFORE UPDATE ON gamification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row modification';

-- =====================================================
-- 2. CALCULATE TRADE METRICS
-- =====================================================
-- Function to calculate P&L and metrics for a trade
CREATE OR REPLACE FUNCTION calculate_trade_metrics(
  p_direction TEXT,
  p_entry_price DECIMAL,
  p_exit_price DECIMAL,
  p_quantity INTEGER,
  p_commissions DECIMAL DEFAULT 0,
  p_slippage DECIMAL DEFAULT 0
)
RETURNS TABLE (
  gross_pnl DECIMAL,
  net_pnl DECIMAL,
  return_percent DECIMAL
) AS $$
DECLARE
  v_gross_pnl DECIMAL;
  v_net_pnl DECIMAL;
  v_return_percent DECIMAL;
  v_cost_basis DECIMAL;
BEGIN
  -- Calculate cost basis
  v_cost_basis := p_entry_price * p_quantity;
  
  -- Calculate gross P&L based on direction
  IF p_direction = 'long' THEN
    v_gross_pnl := (p_exit_price - p_entry_price) * p_quantity;
  ELSE -- short
    v_gross_pnl := (p_entry_price - p_exit_price) * p_quantity;
  END IF;
  
  -- Calculate net P&L (subtract commissions and slippage)
  v_net_pnl := v_gross_pnl - COALESCE(p_commissions, 0) - COALESCE(p_slippage, 0);
  
  -- Calculate return percentage
  v_return_percent := ROUND((v_net_pnl / v_cost_basis) * 100, 2);
  
  RETURN QUERY SELECT v_gross_pnl, v_net_pnl, v_return_percent;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_trade_metrics IS 'Calculates gross P&L, net P&L, and return percentage for a trade';

-- =====================================================
-- 3. CALCULATE USER PERFORMANCE METRICS
-- =====================================================
-- Function to get comprehensive performance metrics for a user
CREATE OR REPLACE FUNCTION get_user_performance_metrics(p_user_id UUID)
RETURNS TABLE (
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate DECIMAL,
  total_pnl DECIMAL,
  avg_win DECIMAL,
  avg_loss DECIMAL,
  profit_factor DECIMAL,
  avg_risk_reward DECIMAL,
  largest_win DECIMAL,
  largest_loss DECIMAL,
  expectancy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_trades,
    SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END)::INTEGER as winning_trades,
    SUM(CASE WHEN net_pnl < 0 THEN 1 ELSE 0 END)::INTEGER as losing_trades,
    ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
    ROUND(SUM(net_pnl), 2) as total_pnl,
    ROUND(AVG(CASE WHEN net_pnl > 0 THEN net_pnl END), 2) as avg_win,
    ROUND(AVG(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) END), 2) as avg_loss,
    ROUND(
      SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
      NULLIF(ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)), 0),
      2
    ) as profit_factor,
    ROUND(AVG(actual_rr), 2) as avg_risk_reward,
    MAX(net_pnl) as largest_win,
    MIN(net_pnl) as largest_loss,
    -- Expectancy formula: (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
    ROUND(
      (SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 
      AVG(CASE WHEN net_pnl > 0 THEN net_pnl END) -
      (SUM(CASE WHEN net_pnl < 0 THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 
      AVG(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) END),
      2
    ) as expectancy
  FROM trades
  WHERE user_id = p_user_id
    AND exit_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_performance_metrics IS 'Returns comprehensive performance metrics for a user';

-- =====================================================
-- 4. UPDATE GAMIFICATION STREAKS
-- =====================================================
-- Function to update journaling streaks after a journal entry
CREATE OR REPLACE FUNCTION update_journaling_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_last_journal_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_total_days INTEGER;
BEGIN
  -- Get current gamification data
  SELECT last_journal_date, current_journaling_streak, longest_journaling_streak, total_days_journaled
  INTO v_last_journal_date, v_current_streak, v_longest_streak, v_total_days
  FROM gamification
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO gamification (user_id, current_journaling_streak, longest_journaling_streak, last_journal_date, total_days_journaled)
    VALUES (p_user_id, 1, 1, v_today, 1);
    RETURN;
  END IF;
  
  -- If already journaled today, don't update streak
  IF v_last_journal_date = v_today THEN
    RETURN;
  END IF;
  
  -- Check if streak continues (yesterday) or breaks
  IF v_last_journal_date = v_today - INTERVAL '1 day' THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
  ELSIF v_last_journal_date < v_today - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    v_current_streak := 1;
  END IF;
  
  -- Update longest streak if current is higher
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Increment total days journaled
  v_total_days := v_total_days + 1;
  
  -- Update gamification record
  UPDATE gamification
  SET 
    current_journaling_streak = v_current_streak,
    longest_journaling_streak = v_longest_streak,
    last_journal_date = v_today,
    total_days_journaled = v_total_days
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_journaling_streak IS 'Updates user journaling streak after a journal entry';

-- =====================================================
-- 5. AUTO-INCREMENT TOTAL TRADES LOGGED
-- =====================================================
-- Trigger to increment total_trades_logged in gamification when trade is created
CREATE OR REPLACE FUNCTION increment_trades_logged()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update gamification record
  INSERT INTO gamification (user_id, total_trades_logged)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET total_trades_logged = gamification.total_trades_logged + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_trades_on_insert
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION increment_trades_logged();

COMMENT ON FUNCTION increment_trades_logged IS 'Auto-increments total_trades_logged in gamification table';

-- =====================================================
-- 6. AUTO-UPDATE JOURNALING STREAK
-- =====================================================
-- Trigger to update journaling streak when post-trade journal is created
CREATE OR REPLACE FUNCTION trigger_update_journaling_streak()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_journaling_streak(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_on_journal
  AFTER INSERT ON post_trade_journals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_journaling_streak();

COMMENT ON FUNCTION trigger_update_journaling_streak IS 'Triggers journaling streak update on journal entry';

-- =====================================================
-- 7. AWARD BADGES
-- =====================================================
-- Function to check and award badges based on milestones
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_gamification RECORD;
  v_new_badges JSONB := '[]'::JSONB;
  v_existing_badges JSONB;
  v_badge_name TEXT;
BEGIN
  -- Get current gamification data
  SELECT * INTO v_gamification
  FROM gamification
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN '[]'::JSONB;
  END IF;
  
  v_existing_badges := COALESCE(v_gamification.badges, '[]'::JSONB);
  
  -- Check for 10 trades milestone
  IF v_gamification.total_trades_logged >= 10 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '10_trades') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '10_trades', 'earned_at', NOW());
  END IF;
  
  -- Check for 50 trades milestone
  IF v_gamification.total_trades_logged >= 50 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '50_trades') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '50_trades', 'earned_at', NOW());
  END IF;
  
  -- Check for 100 trades milestone
  IF v_gamification.total_trades_logged >= 100 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '100_trades') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '100_trades', 'earned_at', NOW());
  END IF;
  
  -- Check for 7-day streak
  IF v_gamification.current_journaling_streak >= 7 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '7_day_streak') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '7_day_streak', 'earned_at', NOW());
  END IF;
  
  -- Check for 30-day streak
  IF v_gamification.current_journaling_streak >= 30 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '30_day_streak') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '30_day_streak', 'earned_at', NOW());
  END IF;
  
  -- Check for 100-day streak
  IF v_gamification.current_journaling_streak >= 100 AND 
     NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_existing_badges) WHERE value->>'badge' = '100_day_streak') THEN
    v_new_badges := v_new_badges || jsonb_build_object('badge', '100_day_streak', 'earned_at', NOW());
  END IF;
  
  -- If new badges were earned, update the gamification record
  IF jsonb_array_length(v_new_badges) > 0 THEN
    UPDATE gamification
    SET badges = v_existing_badges || v_new_badges
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_new_badges;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_and_award_badges IS 'Checks milestones and awards new badges, returns newly earned badges';

-- =====================================================
-- 8. CALCULATE DISCIPLINE SCORE
-- =====================================================
-- Function to calculate discipline score (0-100) for a user
CREATE OR REPLACE FUNCTION calculate_discipline_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rule_adherence_rate DECIMAL;
  v_fomo_count INTEGER;
  v_revenge_count INTEGER;
  v_total_trades INTEGER;
  v_discipline_score INTEGER;
BEGIN
  -- Get rule adherence data
  SELECT 
    COALESCE(rule_adherence_rate, 0),
    COALESCE(SUM(CASE WHEN 'FOMO' = ANY(ptj.emotional_state) THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN 'revenge' = ANY(ptj.emotional_state) THEN 1 ELSE 0 END), 0),
    COUNT(*)
  INTO v_rule_adherence_rate, v_fomo_count, v_revenge_count, v_total_trades
  FROM trades t
  LEFT JOIN post_trade_journals postj ON t.id = postj.trade_id
  LEFT JOIN pre_trade_journals ptj ON t.id = ptj.trade_id
  WHERE t.user_id = p_user_id
    AND t.exit_date IS NOT NULL;
  
  -- If no trades, return 0
  IF v_total_trades = 0 THEN
    RETURN 0;
  END IF;
  
  -- Calculate discipline score (weighted formula)
  -- 60% rule adherence, 20% avoiding FOMO, 20% avoiding revenge trades
  v_discipline_score := ROUND(
    (COALESCE(v_rule_adherence_rate, 0) * 0.6) +
    (GREATEST(0, 100 - (v_fomo_count::DECIMAL / v_total_trades * 100)) * 0.2) +
    (GREATEST(0, 100 - (v_revenge_count::DECIMAL / v_total_trades * 100)) * 0.2)
  );
  
  RETURN GREATEST(0, LEAST(100, v_discipline_score));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_discipline_score IS 'Calculates 0-100 discipline score based on rule adherence and emotional control';

-- =====================================================
-- FUNCTION USAGE NOTES
-- =====================================================
-- 
-- Example usage in application code:
--
-- 1. Get user performance metrics:
--    SELECT * FROM get_user_performance_metrics('user-uuid-here');
--
-- 2. Calculate trade metrics:
--    SELECT * FROM calculate_trade_metrics('long', 100.50, 105.25, 100, 2.00, 0.50);
--
-- 3. Update journaling streak (typically called automatically via trigger):
--    SELECT update_journaling_streak('user-uuid-here');
--
-- 4. Check and award badges:
--    SELECT check_and_award_badges('user-uuid-here');
--
-- 5. Get discipline score:
--    SELECT calculate_discipline_score('user-uuid-here');
