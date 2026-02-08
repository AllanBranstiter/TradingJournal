# Setup Guide - The Mindful Trader

Complete step-by-step setup instructions for local development.

## Step 1: Prerequisites

### Required Software
- Node.js 18 or higher ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git ([Download](https://git-scm.com/))
- Code editor (VS Code recommended)

### Required Accounts
- Supabase account ([Sign up](https://supabase.com))
- Railway account for deployment ([Sign up](https://railway.app))
- OpenRouter account for AI features in Phase 2 ([Sign up](https://openrouter.ai))

## Step 2: Clone and Install

```bash
# Clone repository
git clone https://github.com/yourusername/TradingJournal.git
cd TradingJournal

# Install dependencies
npm install

# Verify installation
npm run dev
```

## Step 3: Supabase Setup

### Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - Name: "Trading Journal"
   - Database Password: (save this!)
   - Region: United States West
5. Wait for project to initialize (~2 minutes)

### Get API Keys

1. Go to Project Settings > API
2. Copy these values:
   - Project URL: `https://your-project.supabase.co`
   - `anon` `public` key
   - `service_role` `secret` key (keep secure!)

### Run Database Migrations

1. Go to SQL Editor in Supabase dashboard
2. Create new query
3. Copy contents of `/supabase/migrations/20260207000001_initial_schema.sql`
4. Run query
5. Repeat for remaining migration files in order:
   - `20260207000002_rls_policies.sql`
   - `20260207000003_views.sql`
   - `20260207000004_functions.sql`

### Verify Database

Run this query to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- gamification
- post_trade_journals
- pre_trade_journals
- psychology_metrics
- strategies
- trades
- trading_plans
- user_profiles

## Step 4: Environment Configuration

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output.

### Create .env.local

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Supabase (from Step 3)
NEXT_PUBLIC_SUPABASE_URL=https://pkgnikqykdqdhlqvxrxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Encryption (generated above)
ENCRYPTION_SECRET_KEY=your-32-byte-hex-key-here

# OpenRouter (optional for Phase 2)
ADMIN_OPENROUTER_API_KEY=your-openrouter-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see the landing page!

## Step 6: Test the Application

### Create Account
1. Click "Get Started"
2. Enter email and password
3. Create account
4. You should be redirected to dashboard

### Log First Trade
1. Click "Log Trade" button
2. Fill out trade details:
   - Ticker: AAPL
   - Direction: Long
   - Entry Date: Today
   - Entry Price: 150.00
   - Quantity: 100
3. Fill emotional state
4. Save trade
5. Trade appears on dashboard

### Test CSV Import
1. Go to Import CSV page
2. Download sample CSV
3. Upload the sample file
4. Map columns (should auto-detect)
5. Preview and import
6. Trades appear in dashboard

## Troubleshooting

### "Unauthorized" errors
- Check Supabase URL and keys in .env.local
- Verify RLS policies were run (migration 002)
- Try signing out and back in

### "Failed to fetch" errors
- Ensure development server is running
- Check browser console for errors
- Verify API routes exist

### CSS not loading
- Clear browser cache
- Restart dev server
- Check tailwind.config.ts syntax

### Database connection errors
- Verify Supabase project is active
- Check internet connection
- Confirm API keys are correct

## Next Steps

### Phase 1 Complete! ✅
You now have a fully functional trading journal with:
- Authentication
- Trade logging
- Dashboard metrics
- CSV import

### Phase 2 Features (To Be Built)
- AI Coach integration
- Post-trade reflection
- Psychology correlation analysis
- Gamification system
- Advanced analytics

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for Phase 2 roadmap.

## Need Help?

- Check [supabase/README.md](supabase/README.md) for database help
- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Open GitHub issue for bugs

---

Happy Trading! 📈
