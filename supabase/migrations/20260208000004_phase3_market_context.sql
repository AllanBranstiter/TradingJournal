-- =====================================================
-- Phase 3: Market Context Cache Table
-- =====================================================
-- This migration creates the market_context_cache table for storing
-- pre-calculated performance metrics grouped by market conditions
-- (SPY trend + sector). This cache enables fast lookups for market
-- context insights without real-time aggregation.
-- =====================================================

-- Create market_context_cache table
CREATE TABLE IF NOT EXISTS market_context_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    spy_condition TEXT NOT NULL CHECK (spy_condition IN ('uptrend', 'downtrend', 'sideways', 'choppy')),
    sector TEXT, -- Nullable: allows both sector-specific and all-sector aggregations
    trade_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2), -- Percentage: 0.00 to 100.00
    avg_pnl DECIMAL(10,2), -- Average profit/loss in dollars
    profit_factor DECIMAL(6,2), -- Gross profit / gross loss
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique cache entries per user/condition/sector combination
    CONSTRAINT unique_market_context UNIQUE (user_id, spy_condition, sector)
);

-- Create index for efficient user-based lookups
CREATE INDEX idx_market_context_user ON market_context_cache(user_id);

-- Add table comment
COMMENT ON TABLE market_context_cache IS 'Cached performance metrics grouped by SPY condition and sector for fast market context insights';

-- Add column comments
COMMENT ON COLUMN market_context_cache.spy_condition IS 'SPY market condition: uptrend, downtrend, sideways, or choppy';
COMMENT ON COLUMN market_context_cache.sector IS 'Sector filter (null means all sectors aggregated)';
COMMENT ON COLUMN market_context_cache.trade_count IS 'Total number of trades in this market context';
COMMENT ON COLUMN market_context_cache.win_rate IS 'Win rate percentage for trades in this context';
COMMENT ON COLUMN market_context_cache.avg_pnl IS 'Average P&L per trade in this context';
COMMENT ON COLUMN market_context_cache.profit_factor IS 'Profit factor (gross profit / gross loss)';
COMMENT ON COLUMN market_context_cache.last_calculated IS 'Timestamp when cache was last recalculated';

-- Note: No RLS policies needed as this is an internal cache table
-- Access control is handled at the application/function level
