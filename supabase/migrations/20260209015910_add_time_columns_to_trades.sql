-- Add Time Columns to Trades Table
-- Created: 2026-02-09
-- Description: Add day_of_week and hour_of_day columns for time-based analytics
--              Includes backfill logic and auto-population trigger

-- =====================================================
-- 1. ADD COLUMNS TO TRADES TABLE
-- =====================================================

-- Add day_of_week column (0=Sunday, 6=Saturday)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'day_of_week'
  ) THEN
    ALTER TABLE trades ADD COLUMN day_of_week INTEGER;
    ALTER TABLE trades ADD CONSTRAINT check_day_of_week 
      CHECK (day_of_week >= 0 AND day_of_week <= 6);
  END IF;
END $$;

-- Add hour_of_day column (0-23)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trades' AND column_name = 'hour_of_day'
  ) THEN
    ALTER TABLE trades ADD COLUMN hour_of_day INTEGER;
    ALTER TABLE trades ADD CONSTRAINT check_hour_of_day 
      CHECK (hour_of_day >= 0 AND hour_of_day <= 23);
  END IF;
END $$;

-- Add indexes for performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_trades_day_of_week ON trades(day_of_week);
CREATE INDEX IF NOT EXISTS idx_trades_hour_of_day ON trades(hour_of_day);
CREATE INDEX IF NOT EXISTS idx_trades_time_slot ON trades(day_of_week, hour_of_day);

COMMENT ON COLUMN trades.day_of_week IS 'Day of week from entry_date: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN trades.hour_of_day IS 'Hour of day from entry_date: 0-23 (24-hour format)';

-- =====================================================
-- 2. BACKFILL EXISTING TRADES
-- =====================================================

-- Update all existing trades with calculated time values
UPDATE trades
SET 
  day_of_week = EXTRACT(DOW FROM entry_date)::INTEGER,
  hour_of_day = EXTRACT(HOUR FROM entry_date)::INTEGER
WHERE day_of_week IS NULL OR hour_of_day IS NULL;

-- =====================================================
-- 3. CREATE FUNCTION TO AUTO-POPULATE TIME COLUMNS
-- =====================================================

-- Drop function if it exists (for idempotency)
DROP FUNCTION IF EXISTS calculate_trade_time_columns() CASCADE;

-- Create function to calculate time columns from entry_date
CREATE OR REPLACE FUNCTION calculate_trade_time_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate day_of_week (0=Sunday, 6=Saturday)
  NEW.day_of_week := EXTRACT(DOW FROM NEW.entry_date)::INTEGER;
  
  -- Calculate hour_of_day (0-23)
  NEW.hour_of_day := EXTRACT(HOUR FROM NEW.entry_date)::INTEGER;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_trade_time_columns() IS 
  'Auto-calculates day_of_week and hour_of_day from entry_date on INSERT or UPDATE';

-- =====================================================
-- 4. CREATE TRIGGER TO AUTO-POPULATE ON INSERT/UPDATE
-- =====================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_calculate_trade_time_columns ON trades;

-- Create trigger to fire before INSERT or UPDATE
CREATE TRIGGER trigger_calculate_trade_time_columns
  BEFORE INSERT OR UPDATE OF entry_date
  ON trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trade_time_columns();

COMMENT ON TRIGGER trigger_calculate_trade_time_columns ON trades IS 
  'Automatically populates day_of_week and hour_of_day when entry_date changes';

-- =====================================================
-- 5. VERIFICATION QUERIES (For Testing)
-- =====================================================

-- Verify columns exist and are populated
-- Run this separately after migration to check results:
-- 
-- SELECT 
--   COUNT(*) as total_trades,
--   COUNT(day_of_week) as trades_with_day,
--   COUNT(hour_of_day) as trades_with_hour,
--   COUNT(*) FILTER (WHERE day_of_week IS NULL) as missing_day,
--   COUNT(*) FILTER (WHERE hour_of_day IS NULL) as missing_hour
-- FROM trades;
--
-- Sample data distribution:
-- SELECT 
--   day_of_week,
--   CASE day_of_week
--     WHEN 0 THEN 'Sunday'
--     WHEN 1 THEN 'Monday'
--     WHEN 2 THEN 'Tuesday'
--     WHEN 3 THEN 'Wednesday'
--     WHEN 4 THEN 'Thursday'
--     WHEN 5 THEN 'Friday'
--     WHEN 6 THEN 'Saturday'
--   END as day_name,
--   COUNT(*) as trade_count
-- FROM trades
-- WHERE day_of_week IS NOT NULL
-- GROUP BY day_of_week
-- ORDER BY day_of_week;
