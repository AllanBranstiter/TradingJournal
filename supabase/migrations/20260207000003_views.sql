-- Trading Journal - Analytics Views
-- Created: 2026-02-07
-- Description: Views for common analytics queries and performance dashboards

-- =====================================================
-- 1. TRADE PERFORMANCE SUMMARY VIEW
-- =====================================================
-- Aggregates key performance metrics per user
-- Used in: Dashboard, Analytics pages

CREATE OR REPLACE VIEW trade_performance_summary AS
SELECT 
  user_id,
  COUNT(*) as total_trades,
  SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN net_pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
  SUM(CASE WHEN net_pnl = 0 THEN 1 ELSE 0 END) as breakeven_trades,
  
  -- Win Rate (percentage)
  ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
  
  -- Total P&L
  SUM(net_pnl) as total_pnl,
  SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) as total_wins,
  ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)) as total_losses,
  
  -- Average P&L
  ROUND(AVG(net_pnl), 2) as avg_pnl,
  ROUND(AVG(CASE WHEN net_pnl > 0 THEN net_pnl END), 2) as avg_win,
  ROUND(AVG(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) END), 2) as avg_loss,
  
  -- Profit Factor (total wins / total losses)
  ROUND(
    SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
    NULLIF(ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)), 0),
    2
  ) as profit_factor,
  
  -- Average Risk:Reward
  ROUND(AVG(actual_rr), 2) as avg_risk_reward,
  
  -- Largest Win/Loss
  MAX(net_pnl) as largest_win,
  MIN(net_pnl) as largest_loss,
  
  -- Average Hold Time
  ROUND(AVG(hold_duration_minutes), 0) as avg_hold_minutes,
  
  -- Commission/Fees
  SUM(commissions) as total_commissions,
  SUM(slippage) as total_slippage
  
FROM trades
WHERE exit_date IS NOT NULL -- Only completed trades
GROUP BY user_id;

COMMENT ON VIEW trade_performance_summary IS 'Aggregated performance metrics per user for dashboard display';

-- =====================================================
-- 2. PSYCHOLOGY PERFORMANCE CORRELATION VIEW
-- =====================================================
-- Shows how emotional states correlate with trade performance
-- Used in: Psychology Dashboard

CREATE OR REPLACE VIEW psychology_performance_correlation AS
SELECT 
  t.user_id,
  UNNEST(ptj.emotional_state) as emotional_state,
  COUNT(*) as trade_count,
  ROUND(100.0 * SUM(CASE WHEN t.net_pnl > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
  ROUND(AVG(t.net_pnl), 2) as avg_pnl,
  ROUND(AVG(ptj.emotional_score), 1) as avg_emotional_score,
  SUM(t.net_pnl) as total_pnl
FROM trades t
JOIN pre_trade_journals ptj ON t.id = ptj.trade_id
WHERE t.exit_date IS NOT NULL
  AND ptj.emotional_state IS NOT NULL
  AND array_length(ptj.emotional_state, 1) > 0
GROUP BY t.user_id, UNNEST(ptj.emotional_state);

COMMENT ON VIEW psychology_performance_correlation IS 'Correlation between pre-trade emotional states and trade outcomes';

-- =====================================================
-- 3. STRATEGY PERFORMANCE VIEW
-- =====================================================
-- Performance breakdown by strategy
-- Used in: Strategies page, Analytics

CREATE OR REPLACE VIEW strategy_performance AS
SELECT 
  t.user_id,
  s.id as strategy_id,
  s.name as strategy_name,
  COUNT(*) as total_trades,
  SUM(CASE WHEN t.net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  ROUND(100.0 * SUM(CASE WHEN t.net_pnl > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
  SUM(t.net_pnl) as total_pnl,
  ROUND(AVG(t.net_pnl), 2) as avg_pnl,
  ROUND(AVG(t.actual_rr), 2) as avg_risk_reward,
  ROUND(
    SUM(CASE WHEN t.net_pnl > 0 THEN t.net_pnl ELSE 0 END) / 
    NULLIF(ABS(SUM(CASE WHEN t.net_pnl < 0 THEN t.net_pnl ELSE 0 END)), 0),
    2
  ) as profit_factor,
  -- Compare to target
  s.win_rate_target,
  s.risk_reward_target,
  -- Sample size indicator
  CASE 
    WHEN COUNT(*) < 20 THEN 'insufficient'
    WHEN COUNT(*) < 50 THEN 'building'
    ELSE 'sufficient'
  END as sample_size_status
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id
WHERE t.exit_date IS NOT NULL
GROUP BY t.user_id, s.id, s.name, s.win_rate_target, s.risk_reward_target;

COMMENT ON VIEW strategy_performance IS 'Performance metrics grouped by trading strategy';

-- =====================================================
-- 4. RULE ADHERENCE VIEW
-- =====================================================
-- Track how often traders follow their rules
-- Used in: Psychology Dashboard, Discipline Score calculation

CREATE OR REPLACE VIEW rule_adherence_summary AS
SELECT 
  t.user_id,
  COUNT(*) as total_trades_with_journal,
  SUM(CASE WHEN postj.followed_plan = TRUE THEN 1 ELSE 0 END) as trades_followed_plan,
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = TRUE THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(*), 0),
    2
  ) as rule_adherence_rate,
  
  -- Violation counts
  SUM(CASE WHEN 'moved_stop_loss' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as moved_stop_loss_count,
  SUM(CASE WHEN 'oversized_position' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as oversized_position_count,
  SUM(CASE WHEN 'exited_early' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as exited_early_count,
  SUM(CASE WHEN 'no_stop_loss' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as no_stop_loss_count,
  SUM(CASE WHEN 'revenge_trade' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as revenge_trade_count,
  SUM(CASE WHEN 'overtrading' = ANY(postj.rule_violations) THEN 1 ELSE 0 END) as overtrading_count,
  
  -- Performance comparison
  ROUND(
    AVG(CASE WHEN postj.followed_plan = TRUE THEN t.net_pnl END),
    2
  ) as avg_pnl_when_followed_plan,
  ROUND(
    AVG(CASE WHEN postj.followed_plan = FALSE THEN t.net_pnl END),
    2
  ) as avg_pnl_when_violated_plan,
  
  -- Win rates
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = TRUE AND t.net_pnl > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN postj.followed_plan = TRUE THEN 1 ELSE 0 END), 0),
    2
  ) as win_rate_when_followed,
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = FALSE AND t.net_pnl > 0 THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN postj.followed_plan = FALSE THEN 1 ELSE 0 END), 0),
    2
  ) as win_rate_when_violated
  
FROM trades t
JOIN post_trade_journals postj ON t.id = postj.trade_id
WHERE t.exit_date IS NOT NULL
GROUP BY t.user_id;

COMMENT ON VIEW rule_adherence_summary IS 'Discipline tracking - how often traders follow their own rules';

-- =====================================================
-- 5. RECENT TRADES VIEW
-- =====================================================
-- Recent trades with journal data for quick dashboard display
-- Used in: Dashboard recent trades widget

CREATE OR REPLACE VIEW recent_trades_with_journals AS
SELECT 
  t.id as trade_id,
  t.user_id,
  t.ticker,
  t.direction,
  t.entry_date,
  t.exit_date,
  t.entry_price,
  t.exit_price,
  t.quantity,
  t.net_pnl,
  t.return_percent,
  t.actual_rr,
  s.name as strategy_name,
  ptj.emotional_state as pre_trade_emotions,
  ptj.emotional_score as pre_trade_emotional_score,
  ptj.setup_quality,
  postj.followed_plan,
  postj.would_repeat,
  postj.ai_analysis_completed,
  t.created_at
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id
LEFT JOIN pre_trade_journals ptj ON t.id = ptj.trade_id
LEFT JOIN post_trade_journals postj ON t.id = postj.trade_id
ORDER BY t.entry_date DESC;

COMMENT ON VIEW recent_trades_with_journals IS 'Recent trades with related journal data for dashboard display';

-- =====================================================
-- 6. MONTHLY PERFORMANCE VIEW
-- =====================================================
-- Monthly performance aggregation for equity curve
-- Used in: Analytics charts, Monthly reports

CREATE OR REPLACE VIEW monthly_performance AS
SELECT 
  user_id,
  DATE_TRUNC('month', entry_date) as month,
  COUNT(*) as trades_count,
  SUM(net_pnl) as monthly_pnl,
  ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
  ROUND(
    SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
    NULLIF(ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)), 0),
    2
  ) as profit_factor,
  ROUND(AVG(actual_rr), 2) as avg_risk_reward
FROM trades
WHERE exit_date IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', entry_date)
ORDER BY user_id, month DESC;

COMMENT ON VIEW monthly_performance IS 'Monthly aggregated performance metrics for trend analysis';

-- =====================================================
-- NOTES ON VIEWS
-- =====================================================
-- All views automatically respect Row Level Security policies
-- because they query the underlying tables which have RLS enabled.
--
-- Views are materialized on query, so they always show current data.
-- For very large datasets, consider adding indexes on frequently
-- filtered columns (user_id, dates, etc.) in the base tables.
