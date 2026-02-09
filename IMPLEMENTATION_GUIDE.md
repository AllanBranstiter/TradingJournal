# Analytics Time Features Implementation

## Overview
This implementation adds missing `day_of_week` and `hour_of_day` columns to the `trades` table, enabling the Analytics page to display Time Performance Heatmap and Best & Worst Trading Times features.

## Problem Fixed
The Analytics page showed empty data because API routes queried for `day_of_week` and `hour_of_day` columns that didn't exist or contained NULL values.

## Implementation Details

### 1. Database Migration
**File**: [`supabase/migrations/20260209015910_add_time_columns_to_trades.sql`](supabase/migrations/20260209015910_add_time_columns_to_trades.sql)

**What it does**:
- ✅ Adds `day_of_week` column (INTEGER, 0-6 where 0=Sunday, 6=Saturday)
- ✅ Adds `hour_of_day` column (INTEGER, 0-23)
- ✅ Adds constraints to ensure valid values
- ✅ Creates indexes for query performance
- ✅ Backfills ALL existing trades with calculated values from `entry_date`
- ✅ Creates `calculate_trade_time_columns()` function
- ✅ Creates trigger to auto-populate columns on INSERT/UPDATE

**Key Features**:
- **Idempotent**: Can be run multiple times safely
- **Automatic**: Trigger ensures new trades get time columns automatically
- **Complete**: Backfills all existing data

### 2. API Update
**File**: [`app/api/trades/route.ts`](app/api/trades/route.ts) (lines 131-134)

**What changed**:
```typescript
// Added calculation of time-based columns
const entryDate = new Date(validatedTrade.entry_date)
const dayOfWeek = entryDate.getDay() // 0=Sunday, 6=Saturday
const hourOfDay = entryDate.getHours() // 0-23

// Now included in INSERT
day_of_week: dayOfWeek,
hour_of_day: hourOfDay,
```

**Why**: Provides client-side calculation as additional safety, though the database trigger is the primary mechanism.

### 3. Verification Queries
**File**: [`supabase/migrations/VERIFY_time_columns.sql`](supabase/migrations/VERIFY_time_columns.sql)

Contains 10 comprehensive verification queries to ensure:
- Columns exist with correct types
- Constraints are active
- Indexes are created
- Trigger and function work
- All data is backfilled
- Data integrity is maintained
- Analytics queries return data

## How to Apply

### Step 1: Run the Migration
1. Open Supabase Dashboard → SQL Editor
2. Open the migration file: `supabase/migrations/20260209015910_add_time_columns_to_trades.sql`
3. Copy and paste the entire contents
4. Click **Run** to execute

**Expected result**: "Success. No rows returned"

### Step 2: Verify the Migration
1. In the same SQL Editor, open: `supabase/migrations/VERIFY_time_columns.sql`
2. Run each verification query section (1-10) individually
3. Confirm all expected results match

**Critical checks**:
- Query #5 should show 100% population of both columns
- Query #7 should show all rows with '✓ Match' status
- Query #10 should return time-based analytics data

### Step 3: Deploy API Changes
The API changes in [`app/api/trades/route.ts`](app/api/trades/route.ts) are already applied in the codebase. Deploy your Next.js application if not already deployed.

## Testing

### Manual Test: Create New Trade
1. Go to your application's trade entry form
2. Create a new trade with an entry_date
3. Run this query in Supabase SQL Editor:

```sql
SELECT 
  ticker,
  entry_date,
  day_of_week,
  hour_of_day,
  EXTRACT(DOW FROM entry_date)::INTEGER as should_be_day,
  EXTRACT(HOUR FROM entry_date)::INTEGER as should_be_hour
FROM trades
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: `day_of_week` and `hour_of_day` should match the calculated values.

### Test Analytics Endpoints
Test both API routes:

```bash
# Time Heatmap
GET /api/analytics/time-heatmap?period=hour

# Best & Worst Times
GET /api/analytics/best-worst-times?limit=5
```

**Expected**: Both should return populated data (not empty arrays).

### Visual Test: Analytics Page
1. Navigate to the Analytics page
2. Verify "Time Performance Heatmap" displays data
3. Verify "Best Trading Times" table has entries
4. Verify "Worst Trading Times" table has entries

## How It Works

### Data Flow for New Trades

1. **User creates trade** via API → [`POST /api/trades`](app/api/trades/route.ts)
2. **API calculates** `day_of_week` and `hour_of_day` from `entry_date`
3. **INSERT query** includes these columns
4. **Database trigger** fires and recalculates (double verification)
5. **Trade saved** with correct time columns

### Data Flow for Existing Trades

1. **Migration runs** → `UPDATE` statement executes
2. **All existing trades** get `day_of_week` and `hour_of_day` calculated from `entry_date`
3. **Trigger installed** for future INSERT/UPDATE operations

### Analytics Query Example

```sql
-- What the API endpoints query
SELECT day_of_week, hour_of_day, net_pnl
FROM trades
WHERE user_id = <user_id>
  AND exit_date IS NOT NULL
  AND day_of_week IS NOT NULL
  AND hour_of_day IS NOT NULL;
```

Now returns data because columns are populated!

## Database Schema Changes

### New Columns
| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| `day_of_week` | INTEGER | CHECK (0-6) | Day of week: 0=Sunday, 6=Saturday |
| `hour_of_day` | INTEGER | CHECK (0-23) | Hour of day in 24-hour format |

### New Indexes
- `idx_trades_day_of_week` - For filtering by day
- `idx_trades_hour_of_day` - For filtering by hour
- `idx_trades_time_slot` - Composite index for day+hour queries

### New Database Objects
- **Function**: `calculate_trade_time_columns()` - Extracts time values from `entry_date`
- **Trigger**: `trigger_calculate_trade_time_columns` - Auto-populates on INSERT/UPDATE

## Rollback Plan

If you need to rollback this migration:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_calculate_trade_time_columns ON trades;

-- Remove function
DROP FUNCTION IF EXISTS calculate_trade_time_columns();

-- Remove indexes
DROP INDEX IF EXISTS idx_trades_day_of_week;
DROP INDEX IF EXISTS idx_trades_hour_of_day;
DROP INDEX IF EXISTS idx_trades_time_slot;

-- Remove columns
ALTER TABLE trades DROP COLUMN IF EXISTS day_of_week;
ALTER TABLE trades DROP COLUMN IF EXISTS hour_of_day;
```

## Performance Impact

### Positive Impacts
- ✅ Indexed columns enable fast time-based queries
- ✅ No runtime calculation needed (pre-computed)
- ✅ Analytics page loads faster with indexed data

### Storage Impact
- 📊 2 additional INTEGER columns per trade row (~8 bytes total)
- 📊 3 indexes (minimal size for small datasets)
- **Total impact**: Negligible for typical trading journal usage

## Related Files Modified

1. **Migration**: `supabase/migrations/20260209015910_add_time_columns_to_trades.sql`
2. **API**: `app/api/trades/route.ts` (lines 131-149)
3. **Verification**: `supabase/migrations/VERIFY_time_columns.sql`
4. **Documentation**: `IMPLEMENTATION_GUIDE.md` (this file)

## Analytics Features Now Working

### Time Performance Heatmap
**Location**: Analytics Page  
**API Route**: [`/api/analytics/time-heatmap`](app/api/analytics/time-heatmap/route.ts)  
**What it shows**: Win rate, trade count, and P&L by day of week and/or hour of day

### Best & Worst Trading Times
**Location**: Analytics Page  
**API Route**: [`/api/analytics/best-worst-times`](app/api/analytics/best-worst-times/route.ts)  
**What it shows**: Top 5 and bottom 5 time slots based on win rate

## Success Criteria Checklist

- [x] Migration file created with idempotent logic
- [x] Columns added with appropriate constraints
- [x] Indexes created for query performance
- [x] Backfill logic populates existing trades
- [x] Trigger auto-populates new trades
- [x] API updated to include time columns
- [x] Verification queries provided
- [x] Documentation complete

## Support

If you encounter issues:

1. Run all verification queries in `VERIFY_time_columns.sql`
2. Check Supabase logs for migration errors
3. Verify RLS policies aren't blocking queries
4. Ensure user timezone is correctly set (affects timestamp interpretation)

## Technical Notes

### Timezone Handling
- `entry_date` is stored as `TIMESTAMPTZ` (timezone-aware)
- `EXTRACT(DOW FROM ...)` uses the database's timezone
- JavaScript `Date.getDay()` uses the client's timezone
- Trigger recalculation ensures consistency with database timezone

### Why Both API Calculation AND Trigger?
- **API calculation**: Explicit, clear in code, works even if trigger fails
- **Trigger**: Catches edge cases, CSV imports, manual INSERTs, ensures data integrity
- **Result**: Defense in depth - multiple layers of safety

### Data Consistency
The trigger ensures that even if:
- Trades are imported via CSV
- Manual SQL INSERTs are run
- `entry_date` is updated

...the time columns will **always** reflect the current `entry_date` value.
