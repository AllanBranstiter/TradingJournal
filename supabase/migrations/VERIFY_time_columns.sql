-- =====================================================
-- VERIFICATION QUERIES FOR TIME COLUMNS MIGRATION
-- =====================================================
-- Run these queries AFTER applying the migration to verify success
-- File: 20260209015910_add_time_columns_to_trades.sql

-- =====================================================
-- 1. VERIFY COLUMNS EXIST
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'trades' 
  AND column_name IN ('day_of_week', 'hour_of_day')
ORDER BY column_name;

-- Expected output:
-- column_name  | data_type | is_nullable | column_default
-- day_of_week  | integer   | YES         | NULL
-- hour_of_day  | integer   | YES         | NULL

-- =====================================================
-- 2. VERIFY CONSTRAINTS EXIST
-- =====================================================
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN ('check_day_of_week', 'check_hour_of_day');

-- Expected output:
-- constraint_name     | check_clause
-- check_day_of_week   | (day_of_week >= 0) AND (day_of_week <= 6)
-- check_hour_of_day   | (hour_of_day >= 0) AND (hour_of_day <= 23)

-- =====================================================
-- 3. VERIFY INDEXES EXIST
-- =====================================================
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'trades' 
  AND indexname IN ('idx_trades_day_of_week', 'idx_trades_hour_of_day', 'idx_trades_time_slot')
ORDER BY indexname;

-- =====================================================
-- 4. VERIFY TRIGGER AND FUNCTION EXIST
-- =====================================================
-- Check function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'calculate_trade_time_columns';

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_calculate_trade_time_columns';

-- =====================================================
-- 5. VERIFY DATA POPULATION
-- =====================================================
-- Check how many trades have time columns populated
SELECT 
  COUNT(*) as total_trades,
  COUNT(day_of_week) as trades_with_day,
  COUNT(hour_of_day) as trades_with_hour,
  COUNT(*) FILTER (WHERE day_of_week IS NULL) as missing_day,
  COUNT(*) FILTER (WHERE hour_of_day IS NULL) as missing_hour,
  ROUND(
    (COUNT(day_of_week)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as day_population_percent,
  ROUND(
    (COUNT(hour_of_day)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as hour_population_percent
FROM trades;

-- Expected: All trades should have both columns populated (100%)

-- =====================================================
-- 6. VERIFY DATA INTEGRITY
-- =====================================================
-- Check that day_of_week values are valid (0-6)
SELECT 
  day_of_week,
  COUNT(*) as count,
  CASE day_of_week
    WHEN 0 THEN 'Sunday'
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    ELSE 'INVALID'
  END as day_name
FROM trades
WHERE day_of_week IS NOT NULL
GROUP BY day_of_week
ORDER BY day_of_week;

-- Check that hour_of_day values are valid (0-23)
SELECT 
  hour_of_day,
  COUNT(*) as count,
  CASE 
    WHEN hour_of_day >= 0 AND hour_of_day <= 5 THEN 'Early Morning (00:00-05:59)'
    WHEN hour_of_day >= 6 AND hour_of_day <= 8 THEN 'Pre-Market (06:00-08:59)'
    WHEN hour_of_day >= 9 AND hour_of_day <= 15 THEN 'Market Hours (09:00-15:59)'
    WHEN hour_of_day >= 16 AND hour_of_day <= 19 THEN 'After Hours (16:00-19:59)'
    WHEN hour_of_day >= 20 AND hour_of_day <= 23 THEN 'Evening (20:00-23:59)'
    ELSE 'INVALID'
  END as time_period
FROM trades
WHERE hour_of_day IS NOT NULL
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- =====================================================
-- 7. VERIFY CALCULATED VALUES MATCH ENTRY_DATE
-- =====================================================
-- Sample check: Verify time columns match what would be extracted from entry_date
SELECT 
  id,
  entry_date,
  day_of_week as stored_day,
  EXTRACT(DOW FROM entry_date)::INTEGER as calculated_day,
  hour_of_day as stored_hour,
  EXTRACT(HOUR FROM entry_date)::INTEGER as calculated_hour,
  CASE 
    WHEN day_of_week = EXTRACT(DOW FROM entry_date)::INTEGER 
      AND hour_of_day = EXTRACT(HOUR FROM entry_date)::INTEGER 
    THEN '✓ Match'
    ELSE '✗ MISMATCH'
  END as validation_status
FROM trades
WHERE day_of_week IS NOT NULL OR hour_of_day IS NOT NULL
ORDER BY entry_date DESC
LIMIT 10;

-- Expected: All rows should show '✓ Match'

-- =====================================================
-- 8. TEST TRIGGER FUNCTIONALITY
-- =====================================================
-- This query shows what would happen if you insert a new trade
-- (Don't actually run this unless you want to create a test trade)
/*
INSERT INTO trades (
  user_id,
  ticker,
  direction,
  entry_date,
  entry_price,
  quantity,
  commissions,
  imported_from_csv
) VALUES (
  (SELECT id FROM user_profiles LIMIT 1), -- Use first user
  'TEST',
  'long',
  '2026-02-09 14:30:00-08:00'::TIMESTAMPTZ, -- Sunday at 2:30 PM PST
  100.00,
  10,
  1.00,
  false
) RETURNING 
  id,
  entry_date,
  day_of_week, -- Should be 0 (Sunday)
  hour_of_day; -- Should be 14
*/

-- =====================================================
-- 9. VERIFY TIME ANALYSIS DATA AVAILABILITY
-- =====================================================
-- Check if we have enough data for heatmap analytics
SELECT 
  'Day of Week Distribution' as metric,
  COUNT(DISTINCT day_of_week) as unique_values,
  CASE 
    WHEN COUNT(DISTINCT day_of_week) >= 5 THEN '✓ Good coverage'
    ELSE '⚠ Limited coverage'
  END as status
FROM trades
WHERE day_of_week IS NOT NULL

UNION ALL

SELECT 
  'Hour of Day Distribution' as metric,
  COUNT(DISTINCT hour_of_day) as unique_values,
  CASE 
    WHEN COUNT(DISTINCT hour_of_day) >= 8 THEN '✓ Good coverage'
    ELSE '⚠ Limited coverage'
  END as status
FROM trades
WHERE hour_of_day IS NOT NULL;

-- =====================================================
-- 10. SAMPLE ANALYTICS QUERY
-- =====================================================
-- Test query similar to what the API endpoints use
SELECT 
  day_of_week,
  hour_of_day,
  COUNT(*) as trade_count,
  COUNT(*) FILTER (WHERE net_pnl > 0) as winning_trades,
  ROUND(
    (COUNT(*) FILTER (WHERE net_pnl > 0)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as win_rate,
  ROUND(AVG(net_pnl), 2) as avg_pnl,
  ROUND(SUM(net_pnl), 2) as total_pnl
FROM trades
WHERE day_of_week IS NOT NULL 
  AND hour_of_day IS NOT NULL
  AND exit_date IS NOT NULL -- Only completed trades
GROUP BY day_of_week, hour_of_day
ORDER BY day_of_week, hour_of_day
LIMIT 20;

-- This should return data similar to what the Analytics API endpoints provide

-- =====================================================
-- SUMMARY
-- =====================================================
-- If all queries above run successfully and show expected results:
-- ✓ Columns exist with correct data types
-- ✓ Constraints are in place
-- ✓ Indexes created for performance
-- ✓ Trigger and function are active
-- ✓ All existing trades have been backfilled
-- ✓ Data integrity is maintained
-- ✓ Analytics queries can retrieve time-based data
--
-- The Analytics page should now display:
-- - Time Performance Heatmap with data
-- - Best & Worst Trading Times tables populated
