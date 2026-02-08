# The Mindful Trader
## Psychology-First Trading Journal

A modern, psychology-focused trading journal application built with Next.js, TypeScript, Supabase, and AI-powered insights.

### Features

**Phase 1 MVP (Completed):**
- ✅ User authentication (email/password)
- ✅ Trade logging with pre-trade journaling
- ✅ Emotional state tracking (12 emotions)
- ✅ Dashboard with key metrics (P&L, Win Rate, Profit Factor)
- ✅ Equity curve and performance charts
- ✅ CSV bulk import
- ✅ Strategy management
- ✅ Mobile-responsive dark theme UI

**Coming in Phase 2:**
- 🔜 AI Coach (OpenRouter integration)
- 🔜 Post-trade reflection journals
- 🔜 Psychology correlation analysis
- 🔜 Gamification (streaks, badges, achievements)
- 🔜 Advanced analytics and heatmaps

### Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **UI Components:** Shadcn/UI, Radix UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Charts:** Recharts
- **CSV Parsing:** PapaParse
- **State Management:** Zustand
- **Deployment:** Railway (recommended)

### Quick Start

#### Prerequisites
- Node.js 18+ and npm
- Supabase account
- OpenRouter API key (for AI features in Phase 2)

#### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/TradingJournal.git
cd TradingJournal
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://pkgnikqykdqdhlqvxrxa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_SECRET_KEY=generate-with-crypto
```

4. Run database migrations in Supabase
- Go to Supabase SQL Editor
- Run migrations in order from `/supabase/migrations/`

5. Start development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Project Structure

```
/TradingJournal
├── app/                      # Next.js app directory
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Dashboard pages
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── dashboard/           # Dashboard-specific
│   ├── import/              # CSV import
│   ├── layout/              # Navigation, sidebar
│   ├── trades/              # Trade components
│   └── ui/                  # Shadcn UI components
├── lib/                     # Utilities and logic
│   ├── auth/                # Auth actions
│   ├── constants/           # Constants and enums
│   ├── hooks/               # React hooks
│   ├── supabase/            # Supabase clients
│   ├── utils/               # Helper functions
│   └── validation/          # Zod schemas
├── supabase/                # Database
│   └── migrations/          # SQL migrations
└── public/                  # Static files

```

### Database Schema

8 core tables:
- `user_profiles` - User settings and AI configuration
- `strategies` - Trading strategies/playbooks
- `trades` - Core trade data
- `pre_trade_journals` - Pre-trade psychology
- `post_trade_journals` - Post-trade reflection
- `psychology_metrics` - Aggregated behavioral data
- `trading_plans` - Daily/weekly plans
- `gamification` - Streaks and achievements

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for complete schema documentation.

### Key Features Explained

#### Trade Logging
Log trades manually or import via CSV. Each trade includes:
- Basic data: Ticker, direction, prices, quantity
- Pre-trade journal: Emotional state, setup quality, thesis
- Automatic P&L calculation
- Strategy association

#### Emotion Tracking
Track your emotional state before trading:
- 12 pre-trade emotions (confident, anxious, FOMO, etc.)
- 1-10 emotional score with visual slider
- Correlation with trade performance

#### Dashboard Metrics
- Total P&L with trend
- Win Rate percentage
- Total Trades count
- Current Streak (wins/losses)
- Equity curve chart
- Performance breakdown

#### CSV Import
Bulk import historical trades:
- Auto-detect column mapping
- Supports common broker formats
- Validates data before import
- Partial import on errors

### Deployment

#### Railway Deployment

1. Push code to GitHub
2. Create new Railway project
3. Connect GitHub repository
4. Add environment variables
5. Deploy automatically

See [`supabase/README.md`](supabase/README.md) for detailed setup instructions.

### Contributing

This is a personal project, but suggestions and feedback are welcome!

### License

MIT License - see LICENSE file

### Acknowledgments

- Trading psychology concepts from Mark Douglas and Dr. Alexander Elder
- UI inspiration from modern fintech dashboards
- Built with love for the trading community

---

**Questions or issues?** Open an issue on GitHub.
