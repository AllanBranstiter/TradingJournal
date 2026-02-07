# Trading Journal - Supabase Database Setup

This directory contains all database migrations, seed data, and setup instructions for "The Mindful Trader" trading journal application.

## 📁 Directory Structure

```
supabase/
├── migrations/
│   ├── 20260207000001_initial_schema.sql     # Core tables
│   ├── 20260207000002_rls_policies.sql       # Row Level Security
│   ├── 20260207000003_views.sql              # Analytics views
│   └── 20260207000004_functions.sql          # Helper functions & triggers
├── seed.sql                                   # Sample data for testing
└── README.md                                  # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Your Supabase project URL: `https://pkgnikqykdqdhlqvxrxa.supabase.co`
- Database access via Supabase Dashboard

### 2. Running Migrations

There are two ways to run migrations:

#### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/pkgnikqykdqdhlqvxrxa
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"+ New Query"**
4. Copy and paste the contents of each migration file **in order**:
   - First: `20260207000001_initial_schema.sql`
   - Second: `20260207000002_rls_policies.sql`
   - Third: `20260207000003_views.sql`
   - Fourth: `20260207000004_functions.sql`
5. Click **"Run"** for each migration
6. Verify success (green checkmark)

#### Option B: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref pkgnikqykdqdhlqvxrxa

# Run all migrations
supabase db push

# Or run individual migrations
supabase db execute --file supabase/migrations/20260207000001_initial_schema.sql
supabase db execute --file supabase/migrations/20260207000002_rls_policies.sql
supabase db execute --file supabase/migrations/20260207000003_views.sql
supabase db execute --file supabase/migrations/20260207000004_functions.sql
```

### 3. Verify Migration Success

Run this query in SQL Editor to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `user_profiles`
- `strategies`
- `trades`
- `pre_trade_journals`
- `post_trade_journals`
- `psychology_metrics`
- `trading_plans`
- `gamification`

### 4. Load Sample Data (Optional)

For development/testing, you can load sample data:

```sql
-- In Supabase SQL Editor, run:
\i supabase/seed.sql
```

Or copy/paste the contents of `seed.sql` into the SQL Editor.

## 📊 Database Schema Overview

### Core Tables

1. **`user_profiles`** - Extended user data with AI configuration
2. **`strategies`** - Trading strategies/playbooks
3. **`trades`** - Core trade execution data
4. **`pre_trade_journals`** - Pre-trade psychological state
5. **`post_trade_journals`** - Post-trade reflection
6. **`psychology_metrics`** - Aggregated behavioral metrics
7. **`trading_plans`** - Daily/weekly trading plans
8. **`gamification`** - Streaks and badges

### Analytics Views

- `trade_performance_summary` - User performance metrics
- `psychology_performance_correlation` - Emotion vs. performance
- `strategy_performance` - Strategy-specific metrics
- `rule_adherence_summary` - Discipline tracking
- `recent_trades_with_journals` - Recent trades with journal data
- `monthly_performance` - Monthly aggregation for charts

### Database Functions

- `update_updated_at_column()` - Auto-update timestamps
- `calculate_trade_metrics()` - Calculate P&L and returns
- `get_user_performance_metrics()` - Comprehensive user stats
- `update_journaling_streak()` - Update daily streaks
- `check_and_award_badges()` - Award milestone badges
- `calculate_discipline_score()` - 0-100 discipline score

## 🔒 Security (Row Level Security)

All tables have RLS enabled. Users can only access their own data:

- **SELECT**: Users can view their own records
- **INSERT**: Users can create records for themselves
- **UPDATE**: Users can update their own records
- **DELETE**: Users can delete their own records

RLS policies use `auth.uid()` to enforce user isolation at the database level.

## 🔄 Generating TypeScript Types

After running migrations, generate TypeScript types to match your schema:

### Method 1: Supabase CLI (Recommended)

```bash
# Generate types from your live database
supabase gen types typescript --project-id pkgnikqykdqdhlqvxrxa > lib/supabase/database.types.ts
```

### Method 2: Manual Update

The types are already created in `lib/supabase/types.ts`, but you can regenerate them if schema changes:

```bash
npx supabase gen types typescript --project-id pkgnikqykdqdhlqvxrxa --schema public > lib/supabase/types.generated.ts
```

Then compare with your existing `types.ts` file and merge changes.

## 🧪 Testing Queries

### Verify RLS Policies

```sql
-- This should return policies for all tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Test Performance Metrics

```sql
-- Get performance summary for a user (replace with actual user_id)
SELECT * FROM trade_performance_summary 
WHERE user_id = 'your-user-uuid-here';

-- Get discipline score
SELECT calculate_discipline_score('your-user-uuid-here');
```

### Test Gamification

```sql
-- Check badges
SELECT check_and_award_badges('your-user-uuid-here');

-- View current gamification status
SELECT * FROM gamification WHERE user_id = 'your-user-uuid-here';
```

## 🗑️ Reset Database (Development Only)

**⚠️ WARNING: This will delete ALL data!**

```sql
-- Drop all tables (cascade removes dependent objects)
DROP TABLE IF EXISTS gamification CASCADE;
DROP TABLE IF EXISTS trading_plans CASCADE;
DROP TABLE IF EXISTS psychology_metrics CASCADE;
DROP TABLE IF EXISTS post_trade_journals CASCADE;
DROP TABLE IF EXISTS pre_trade_journals CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop all views
DROP VIEW IF EXISTS monthly_performance CASCADE;
DROP VIEW IF EXISTS recent_trades_with_journals CASCADE;
DROP VIEW IF EXISTS rule_adherence_summary CASCADE;
DROP VIEW IF EXISTS strategy_performance CASCADE;
DROP VIEW IF EXISTS psychology_performance_correlation CASCADE;
DROP VIEW IF EXISTS trade_performance_summary CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS calculate_discipline_score CASCADE;
DROP FUNCTION IF EXISTS check_and_award_badges CASCADE;
DROP FUNCTION IF EXISTS trigger_update_journaling_streak CASCADE;
DROP FUNCTION IF EXISTS increment_trades_logged CASCADE;
DROP FUNCTION IF EXISTS update_journaling_streak CASCADE;
DROP FUNCTION IF EXISTS get_user_performance_metrics CASCADE;
DROP FUNCTION IF EXISTS calculate_trade_metrics CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- Then re-run all migrations from scratch
```

## 📝 Common Tasks

### Add a New User Profile After Signup

Typically handled automatically by your app, but manual insert:

```sql
INSERT INTO user_profiles (id, email, display_name)
VALUES ('auth-user-uuid', 'user@example.com', 'John Doe');
```

### Add a Strategy

```sql
INSERT INTO strategies (user_id, name, description, win_rate_target, risk_reward_target)
VALUES (
  'your-user-uuid',
  'Bull Flag Breakout',
  'Trade bull flags on daily charts with volume confirmation',
  65.00,
  2.5
);
```

### Log a Trade with Pre/Post Journals

```sql
-- 1. Create trade
INSERT INTO trades (user_id, ticker, direction, entry_date, entry_price, quantity)
VALUES ('your-user-uuid', 'AAPL', 'long', NOW(), 180.50, 100)
RETURNING id;

-- 2. Create pre-trade journal (use returned trade id)
INSERT INTO pre_trade_journals (user_id, trade_id, emotional_state, emotional_score, thesis)
VALUES (
  'your-user-uuid', 
  'trade-uuid-from-step-1',
  ARRAY['confident', 'neutral'],
  5,
  'Strong support at 180, expecting bounce'
);

-- 3. After trade exits, update trade
UPDATE trades 
SET exit_date = NOW(), exit_price = 185.25
WHERE id = 'trade-uuid';

-- 4. Create post-trade journal
INSERT INTO post_trade_journals (user_id, trade_id, emotional_state, followed_plan, lessons_learned)
VALUES (
  'your-user-uuid',
  'trade-uuid',
  ARRAY['relieved', 'validated'],
  TRUE,
  'Waited for confirmation as planned'
);
```

## 🐛 Troubleshooting

### Issue: RLS Policy Blocks Queries

**Problem**: Getting "permission denied" errors even when authenticated.

**Solution**: Ensure your app is using `auth.uid()` correctly:

```typescript
const { data: { user } } = await supabase.auth.getUser();
// user.id should match the user_id in your queries
```

### Issue: Functions Not Found

**Problem**: `function calculate_trade_metrics does not exist`

**Solution**: Run the functions migration again:

```sql
\i supabase/migrations/20260207000004_functions.sql
```

### Issue: Views Return Empty

**Problem**: Views return no data even though tables have data.

**Solution**: Views respect RLS. Make sure you're querying as an authenticated user:

```typescript
const { data } = await supabase
  .from('trade_performance_summary')
  .select('*')
  .single(); // RLS filters to current user automatically
```

### Issue: Types Don't Match Database

**Problem**: TypeScript errors about missing/incorrect fields.

**Solution**: Regenerate types from live database:

```bash
supabase gen types typescript --project-id pkgnikqykdqdhlqvxrxa > lib/supabase/types.generated.ts
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

## 🆘 Need Help?

1. Check Supabase Dashboard logs: **Logs → Postgres Logs**
2. Review this project's ARCHITECTURE.md for schema details
3. Test queries in SQL Editor before using in code
4. Ensure environment variables are set correctly in `.env.local`

## ✅ Migration Checklist

- [ ] Run `20260207000001_initial_schema.sql`
- [ ] Run `20260207000002_rls_policies.sql`
- [ ] Run `20260207000003_views.sql`
- [ ] Run `20260207000004_functions.sql`
- [ ] Verify all tables exist
- [ ] Verify RLS policies are enabled
- [ ] Load seed data (optional)
- [ ] Generate TypeScript types
- [ ] Update `.env.local` with connection details
- [ ] Test authentication flow
- [ ] Test CRUD operations via app

---

**Last Updated**: 2026-02-07  
**Database Version**: 1.0.0  
**Supabase Project**: pkgnikqykdqdhlqvxrxa
