-- Phase 3: Time-Based Analysis Foundation
-- Part 1: Add time-based analysis columns to trades table

-- Add new columns to trades table for time-based analysis
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS day_of_week INTEGER,
ADD COLUMN IF NOT EXISTS hour_of_day INTEGER,
ADD COLUMN IF NOT EXISTS sector TEXT;

-- Add comments to document the columns
COMMENT ON COLUMN trades.day_of_week IS 'Day of week when trade was entered (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN trades.hour_of_day IS 'Hour of day when trade was entered (0-23, in user timezone)';
COMMENT ON COLUMN trades.sector IS 'Stock sector classification (e.g., technology, healthcare, finance)';

-- Create indexes for efficient querying
-- Index for day of week analysis by user
CREATE INDEX IF NOT EXISTS idx_trades_day_of_week 
ON trades(user_id, day_of_week);

-- Index for hour of day analysis by user
CREATE INDEX IF NOT EXISTS idx_trades_hour_of_day 
ON trades(user_id, hour_of_day);

-- Index for sector analysis by user
CREATE INDEX IF NOT EXISTS idx_trades_sector 
ON trades(user_id, sector);

-- Create trigger function to automatically populate time fields
CREATE OR REPLACE FUNCTION update_trade_time_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if entry_date is not null
  IF NEW.entry_date IS NOT NULL THEN
    -- Extract day of week (0=Sunday through 6=Saturday)
    NEW.day_of_week := EXTRACT(DOW FROM NEW.entry_date)::INTEGER;
    
    -- Extract hour of day (0-23)
    NEW.hour_of_day := EXTRACT(HOUR FROM NEW.entry_date)::INTEGER;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update time fields on insert or update
DROP TRIGGER IF EXISTS trigger_update_trade_time_fields ON trades;
CREATE TRIGGER trigger_update_trade_time_fields
  BEFORE INSERT OR UPDATE OF entry_date ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_time_fields();

-- Backfill existing trades with time data
UPDATE trades
SET day_of_week = EXTRACT(DOW FROM entry_date)::INTEGER,
    hour_of_day = EXTRACT(HOUR FROM entry_date)::INTEGER
WHERE entry_date IS NOT NULL 
  AND (day_of_week IS NULL OR hour_of_day IS NULL);

COMMENT ON FUNCTION update_trade_time_fields() IS 'Automatically populates day_of_week and hour_of_day from entry_date';
