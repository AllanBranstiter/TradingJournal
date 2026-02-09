-- Phase 3: Time-Based Analysis Foundation
-- Part 3: Create view for real-time trade timing analysis

-- Create view that aggregates trade performance by time slot
CREATE OR REPLACE VIEW trade_timing_analysis AS
SELECT 
  user_id,
  day_of_week,
  hour_of_day,
  COUNT(*) as trade_count,
  SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as win_count,
  ROUND(
    (SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)::DECIMAL * 100)::NUMERIC, 
    2
  ) as win_rate,
  ROUND(AVG(net_pnl)::NUMERIC, 2) as avg_pnl,
  ROUND(SUM(net_pnl)::NUMERIC, 2) as total_pnl
FROM trades
WHERE exit_date IS NOT NULL  -- Only include completed trades
  AND day_of_week IS NOT NULL  -- Ensure time fields are populated
  AND hour_of_day IS NOT NULL
GROUP BY user_id, day_of_week, hour_of_day;

-- Add comment to document the view
COMMENT ON VIEW trade_timing_analysis IS 'Real-time aggregation of trading performance by day of week and hour of day for completed trades';

-- Note: This view provides real-time analysis of trade timing patterns
-- For better performance with large datasets, use the time_analysis_cache table
-- which stores pre-calculated metrics
