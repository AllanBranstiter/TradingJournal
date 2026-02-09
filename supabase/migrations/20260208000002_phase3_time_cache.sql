-- Phase 3: Time-Based Analysis Foundation
-- Part 2: Create cache table for time-based analysis metrics

-- Create time_analysis_cache table to store pre-calculated metrics
CREATE TABLE IF NOT EXISTS time_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  trade_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  avg_pnl DECIMAL(10,2),
  total_pnl DECIMAL(10,2),
  is_avoid_pattern BOOLEAN DEFAULT FALSE,
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0.00 AND confidence_level <= 1.00),
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combination of user, day, and hour
  CONSTRAINT unique_user_time_slot UNIQUE (user_id, day_of_week, hour_of_day)
);

-- Add comments to document the table and columns
COMMENT ON TABLE time_analysis_cache IS 'Pre-calculated time-based trading performance metrics for quick retrieval';
COMMENT ON COLUMN time_analysis_cache.day_of_week IS 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN time_analysis_cache.hour_of_day IS 'Hour of day (0-23)';
COMMENT ON COLUMN time_analysis_cache.trade_count IS 'Total number of trades in this time slot';
COMMENT ON COLUMN time_analysis_cache.win_count IS 'Number of winning trades (net_pnl > 0)';
COMMENT ON COLUMN time_analysis_cache.loss_count IS 'Number of losing trades (net_pnl <= 0)';
COMMENT ON COLUMN time_analysis_cache.win_rate IS 'Percentage of winning trades (0.00-100.00)';
COMMENT ON COLUMN time_analysis_cache.avg_pnl IS 'Average profit/loss per trade in this time slot';
COMMENT ON COLUMN time_analysis_cache.total_pnl IS 'Total profit/loss for all trades in this time slot';
COMMENT ON COLUMN time_analysis_cache.is_avoid_pattern IS 'Flag indicating if this time slot shows consistently poor performance';
COMMENT ON COLUMN time_analysis_cache.confidence_level IS 'Statistical confidence level for the metrics (0.00-1.00)';
COMMENT ON COLUMN time_analysis_cache.last_calculated IS 'Timestamp when these metrics were last calculated';

-- Create index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_time_analysis_user 
ON time_analysis_cache(user_id);

-- Create index for finding avoid patterns
CREATE INDEX IF NOT EXISTS idx_time_analysis_avoid 
ON time_analysis_cache(user_id, is_avoid_pattern);

-- Note: RLS (Row Level Security) is not applied to cache tables
-- These are internal calculation tables accessed through application logic
-- User data security is enforced at the trades table level
