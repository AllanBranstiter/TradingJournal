# Phase 2: Database Layer

## Prerequisites
- Phase 1 completed successfully
- Electron app window opens with placeholder content
- `better-sqlite3` installed and native module rebuilt
- Directory structure from Phase 1 exists

## Context
The Electron app shell is working. Now we need to create the SQLite database layer that will replace Supabase. This includes translating the PostgreSQL schema to SQLite, creating a connection manager, building a Data Access Layer (DAL), and implementing a migration system.

**Entering State:** Electron app opens, no database
**Exiting State:** Database initialized with all tables, DAL functions work, migrations run

## Objectives
1. Create SQLite connection manager with WAL mode
2. Design and create migration system
3. Translate PostgreSQL schema to SQLite (8 tables)
4. Create SQLite views for analytics
5. Build Data Access Layer (DAL) with typed functions
6. Wire up database initialization to app startup
7. Test CRUD operations from main process

---

## Files to Create

| File Path | Purpose | Source Reference |
|-----------|---------|-----------------|
| `src/main/database/connection.ts` | SQLite connection manager | New file |
| `src/main/database/migrations/runner.ts` | Migration execution system | New file |
| `src/main/database/migrations/001_initial_schema.sql` | Core tables | `supabase/migrations/20260207000001_initial_schema.sql` |
| `src/main/database/migrations/002_views.sql` | Analytics views | `supabase/migrations/20260207000003_views.sql` |
| `src/main/database/migrations/003_indexes.sql` | Performance indexes | New file |
| `src/main/database/dal/trades.ts` | Trade CRUD operations | New file |
| `src/main/database/dal/strategies.ts` | Strategy CRUD operations | New file |
| `src/main/database/dal/journals.ts` | Journal CRUD operations | New file |
| `src/main/database/dal/analytics.ts` | Analytics queries | New file |
| `src/main/database/dal/gamification.ts` | Gamification queries | New file |
| `src/main/database/dal/settings.ts` | User settings queries | New file |
| `src/main/database/dal/index.ts` | DAL exports | New file |

## Files to Modify

| File Path | Modifications |
|-----------|--------------|
| `src/main/index.ts` | Add database initialization on app ready |

---

## Detailed Instructions

### Task 2.1: Create Database Connection Manager

**Step 1:** Create directory structure:
```bash
mkdir -p src/main/database/migrations
mkdir -p src/main/database/dal
```

**Step 2:** Create `src/main/database/connection.ts`:
```typescript
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database | null = null;

/**
 * Get the database file path
 * In production: ~/Library/Application Support/TradingJournal-Mac/trading_journal.db
 * In development: ./dev_data/trading_journal.db
 */
export function getDatabasePath(): string {
  if (process.env.NODE_ENV === 'development') {
    const devPath = path.join(process.cwd(), 'dev_data');
    if (!fs.existsSync(devPath)) {
      fs.mkdirSync(devPath, { recursive: true });
    }
    return path.join(devPath, 'trading_journal.db');
  }
  
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'trading_journal.db');
}

/**
 * Initialize the database connection
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  console.log('Initializing database at:', dbPath);

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access and crash recovery
  db.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Performance optimizations
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');

  return db;
}

/**
 * Get the database instance
 * @throws Error if database not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Get database info for debugging
 */
export function getDatabaseInfo(): {
  path: string;
  version: string;
  walMode: boolean;
  tableCount: number;
} {
  const database = getDatabase();
  const tables = database
    .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .get() as { count: number };

  const walCheck = database.pragma('journal_mode') as { journal_mode: string }[];

  return {
    path: getDatabasePath(),
    version: database.prepare('SELECT sqlite_version()').get() as string,
    walMode: walCheck[0]?.journal_mode === 'wal',
    tableCount: tables.count,
  };
}

export { db };
```

---

### Task 2.2: Create Migration Runner

**Step 1:** Create `src/main/database/migrations/runner.ts`:
```typescript
import { getDatabase } from '../connection';
import fs from 'fs';
import path from 'path';

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: string;
}

/**
 * Ensure the migrations tracking table exists
 */
function ensureMigrationsTable(): void {
  const db = getDatabase();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

/**
 * Get list of applied migrations
 */
function getAppliedMigrations(): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT name FROM _migrations ORDER BY id').all() as MigrationRecord[];
  return rows.map(row => row.name);
}

/**
 * Get all migration files from the migrations directory
 */
function getMigrationFiles(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    console.warn('Migrations directory not found:', migrationsDir);
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically to ensure order
}

/**
 * Run a single migration
 */
function runMigration(migrationPath: string, migrationName: string): void {
  const db = getDatabase();
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`Running migration: ${migrationName}`);

  // Run migration in a transaction
  const transaction = db.transaction(() => {
    // Execute the migration SQL
    db.exec(sql);
    
    // Record the migration
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migrationName);
  });

  transaction();
  console.log(`Migration completed: ${migrationName}`);
}

/**
 * Run all pending migrations
 */
export function runMigrations(migrationsDir?: string): void {
  // Default to the migrations directory relative to this file
  const defaultDir = path.join(__dirname);
  const dir = migrationsDir || defaultDir;

  console.log('Running migrations from:', dir);

  ensureMigrationsTable();

  const appliedMigrations = getAppliedMigrations();
  const migrationFiles = getMigrationFiles(dir);

  const pendingMigrations = migrationFiles.filter(
    file => !appliedMigrations.includes(file)
  );

  if (pendingMigrations.length === 0) {
    console.log('No pending migrations');
    return;
  }

  console.log(`Found ${pendingMigrations.length} pending migrations`);

  for (const migrationFile of pendingMigrations) {
    const migrationPath = path.join(dir, migrationFile);
    runMigration(migrationPath, migrationFile);
  }

  console.log('All migrations completed');
}

/**
 * Get migration status
 */
export function getMigrationStatus(migrationsDir?: string): {
  applied: string[];
  pending: string[];
} {
  const defaultDir = path.join(__dirname);
  const dir = migrationsDir || defaultDir;

  ensureMigrationsTable();

  const appliedMigrations = getAppliedMigrations();
  const migrationFiles = getMigrationFiles(dir);

  const pendingMigrations = migrationFiles.filter(
    file => !appliedMigrations.includes(file)
  );

  return {
    applied: appliedMigrations,
    pending: pendingMigrations,
  };
}

/**
 * Reset database (DANGEROUS - for development only)
 */
export function resetDatabase(): void {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('resetDatabase can only be called in development');
  }

  const db = getDatabase();
  
  // Get all tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];

  // Drop all tables
  for (const table of tables) {
    db.exec(`DROP TABLE IF EXISTS "${table.name}"`);
  }

  console.log('Database reset complete');
}
```

---

### Task 2.3: Create Initial Schema Migration

**Step 1:** Create `src/main/database/migrations/001_initial_schema.sql`:
```sql
-- Trading Journal Mac - Initial Schema Migration
-- Translated from PostgreSQL to SQLite
-- Created: 2026-02-09

-- =====================================================
-- 1. USER PROFILES (Extended User Data)
-- Note: For local single-user app, we use a constant user_id
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  email TEXT NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'America/Los_Angeles',
  trading_style TEXT CHECK (trading_style IN ('day_trader', 'swing_trader', 'position_trader', 'investor')),
  
  -- Risk Management Settings
  risk_per_trade_percent REAL DEFAULT 1.00,
  daily_loss_limit REAL,
  weekly_loss_limit REAL,
  account_balance REAL,
  
  -- AI Configuration
  -- Note: API key stored in macOS Keychain, not database
  preferred_ai_model TEXT DEFAULT 'openai/gpt-4-turbo',
  ai_features_enabled INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create default local user
INSERT OR IGNORE INTO user_profiles (id, email, display_name)
VALUES ('local-user', 'local@tradingjournal.app', 'Trader');

-- =====================================================
-- 2. STRATEGIES (Trading Setups/Playbooks)
-- =====================================================
CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  name TEXT NOT NULL,
  description TEXT,
  setup_criteria TEXT, -- JSON string
  entry_rules TEXT,
  exit_rules TEXT,
  risk_reward_target REAL,
  win_rate_target REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. TRADES (Core Trade Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  
  -- Basic Trade Info
  ticker TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  strategy_id TEXT,
  
  -- Execution Data
  entry_date TEXT NOT NULL,
  exit_date TEXT,
  entry_price REAL NOT NULL,
  exit_price REAL,
  quantity INTEGER NOT NULL,
  
  -- Costs
  commissions REAL DEFAULT 0,
  slippage REAL DEFAULT 0,
  
  -- P&L Calculations
  gross_pnl REAL,
  net_pnl REAL,
  return_percent REAL,
  
  -- Risk Management
  initial_stop_loss REAL,
  actual_stop_loss REAL,
  risk_amount REAL,
  reward_amount REAL,
  actual_rr REAL,
  
  -- Trade Metadata
  hold_duration_minutes INTEGER,
  market_conditions TEXT, -- JSON array as string
  screenshot_url TEXT,
  
  -- Time analysis columns
  day_of_week INTEGER, -- 0=Sunday, 6=Saturday
  hour_of_day INTEGER, -- 0-23
  
  -- Import flag
  imported_from_csv INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. PRE-TRADE JOURNALS (Before Trade Execution)
-- =====================================================
CREATE TABLE IF NOT EXISTS pre_trade_journals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  trade_id TEXT,
  
  -- Emotional State
  emotional_state TEXT DEFAULT '[]', -- JSON array
  emotional_score INTEGER CHECK (emotional_score BETWEEN 1 AND 10),
  
  -- Market Analysis
  market_bias TEXT CHECK (market_bias IN ('bullish', 'bearish', 'neutral', 'choppy')),
  spy_trend TEXT CHECK (spy_trend IN ('uptrend', 'downtrend', 'sideways')),
  sector_context TEXT,
  
  -- Trade Setup Validation
  strategy_id TEXT,
  setup_quality INTEGER CHECK (setup_quality BETWEEN 1 AND 5),
  confluence_factors TEXT, -- JSON array
  
  -- Pre-Trade Checklist
  checklist TEXT, -- JSON object
  
  -- Planned Trade Parameters
  planned_entry REAL,
  planned_stop_loss REAL,
  planned_target REAL,
  planned_risk_reward REAL,
  planned_position_size INTEGER,
  planned_risk_amount REAL,
  
  -- Notes
  thesis TEXT,
  concerns TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
  FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- =====================================================
-- 5. POST-TRADE JOURNALS (After Trade Exit)
-- =====================================================
CREATE TABLE IF NOT EXISTS post_trade_journals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  trade_id TEXT,
  pre_trade_journal_id TEXT,
  
  -- Emotional State Post-Trade
  emotional_state TEXT DEFAULT '[]', -- JSON array
  emotional_score INTEGER CHECK (emotional_score BETWEEN 1 AND 10),
  
  -- Execution Analysis
  execution_quality INTEGER CHECK (execution_quality BETWEEN 1 AND 5),
  followed_plan INTEGER, -- Boolean as integer
  rule_violations TEXT, -- JSON array
  
  -- What Went Right/Wrong
  what_went_well TEXT,
  what_went_wrong TEXT,
  lessons_learned TEXT,
  
  -- AI Analysis
  reflection_notes TEXT,
  ai_analysis_completed INTEGER DEFAULT 0,
  ai_insights TEXT, -- JSON object
  
  -- Would You Take This Trade Again?
  would_repeat INTEGER, -- Boolean as integer
  repeat_reasoning TEXT,
  
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE,
  FOREIGN KEY (pre_trade_journal_id) REFERENCES pre_trade_journals(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. PSYCHOLOGY METRICS (Aggregated Insights)
-- =====================================================
CREATE TABLE IF NOT EXISTS psychology_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  
  -- Time Period
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  
  -- Behavioral Metrics
  discipline_score INTEGER CHECK (discipline_score BETWEEN 0 AND 100),
  rule_adherence_rate REAL,
  fomo_trade_count INTEGER DEFAULT 0,
  revenge_trade_count INTEGER DEFAULT 0,
  
  -- Emotional Patterns
  most_common_pre_trade_emotion TEXT,
  most_common_post_trade_emotion TEXT,
  emotional_volatility REAL,
  
  -- Performance Correlations
  disciplined_trade_win_rate REAL,
  fomo_trade_win_rate REAL,
  
  created_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 7. TRADING PLANS (Daily/Weekly Plans)
-- =====================================================
CREATE TABLE IF NOT EXISTS trading_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user',
  
  plan_date TEXT NOT NULL,
  market_outlook TEXT,
  watchlist TEXT, -- JSON array
  max_trades_allowed INTEGER,
  max_loss_limit REAL,
  focus_strategies TEXT, -- JSON array
  personal_reminders TEXT, -- JSON array
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(user_id, plan_date),
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 8. GAMIFICATION (Achievements & Streaks)
-- =====================================================
CREATE TABLE IF NOT EXISTS gamification (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user' UNIQUE,
  
  -- Streaks
  current_journaling_streak INTEGER DEFAULT 0,
  longest_journaling_streak INTEGER DEFAULT 0,
  last_journal_date TEXT,
  
  -- Milestones
  total_trades_logged INTEGER DEFAULT 0,
  total_days_journaled INTEGER DEFAULT 0,
  
  -- Badges Earned
  badges TEXT DEFAULT '[]', -- JSON array
  
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Create default gamification record
INSERT OR IGNORE INTO gamification (id, user_id)
VALUES ('local-gamification', 'local-user');

-- =====================================================
-- 9. USER SETTINGS (Application Preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local-user' UNIQUE,
  
  -- App preferences stored as JSON
  settings TEXT DEFAULT '{}',
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Create default settings
INSERT OR IGNORE INTO user_settings (id, user_id, settings)
VALUES ('local-settings', 'local-user', '{"theme": "dark", "currency": "USD"}');
```

---

### Task 2.4: Create Views Migration

**Step 1:** Create `src/main/database/migrations/002_views.sql`:
```sql
-- Trading Journal Mac - Analytics Views
-- Translated from PostgreSQL to SQLite
-- Created: 2026-02-09

-- =====================================================
-- 1. TRADE PERFORMANCE SUMMARY VIEW
-- =====================================================
DROP VIEW IF EXISTS trade_performance_summary;
CREATE VIEW trade_performance_summary AS
SELECT 
  user_id,
  COUNT(*) as total_trades,
  SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  SUM(CASE WHEN net_pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
  SUM(CASE WHEN net_pnl = 0 THEN 1 ELSE 0 END) as breakeven_trades,
  
  -- Win Rate
  ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 2) as win_rate,
  
  -- Total P&L
  SUM(net_pnl) as total_pnl,
  SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) as total_wins,
  ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)) as total_losses,
  
  -- Average P&L
  ROUND(AVG(net_pnl), 2) as avg_pnl,
  ROUND(AVG(CASE WHEN net_pnl > 0 THEN net_pnl END), 2) as avg_win,
  ROUND(AVG(CASE WHEN net_pnl < 0 THEN ABS(net_pnl) END), 2) as avg_loss,
  
  -- Profit Factor
  ROUND(
    CASE 
      WHEN ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)) = 0 THEN 0
      ELSE SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
           ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END))
    END,
    2
  ) as profit_factor,
  
  -- Average Risk:Reward
  ROUND(AVG(actual_rr), 2) as avg_risk_reward,
  
  -- Largest Win/Loss
  MAX(net_pnl) as largest_win,
  MIN(net_pnl) as largest_loss,
  
  -- Average Hold Time
  ROUND(AVG(hold_duration_minutes), 0) as avg_hold_minutes,
  
  -- Commission/Fees
  SUM(commissions) as total_commissions,
  SUM(slippage) as total_slippage
  
FROM trades
WHERE exit_date IS NOT NULL
GROUP BY user_id;

-- =====================================================
-- 2. STRATEGY PERFORMANCE VIEW
-- =====================================================
DROP VIEW IF EXISTS strategy_performance;
CREATE VIEW strategy_performance AS
SELECT 
  t.user_id,
  s.id as strategy_id,
  s.name as strategy_name,
  COUNT(*) as total_trades,
  SUM(CASE WHEN t.net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
  ROUND(100.0 * SUM(CASE WHEN t.net_pnl > 0 THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 2) as win_rate,
  SUM(t.net_pnl) as total_pnl,
  ROUND(AVG(t.net_pnl), 2) as avg_pnl,
  ROUND(AVG(t.actual_rr), 2) as avg_risk_reward,
  ROUND(
    CASE 
      WHEN ABS(SUM(CASE WHEN t.net_pnl < 0 THEN t.net_pnl ELSE 0 END)) = 0 THEN 0
      ELSE SUM(CASE WHEN t.net_pnl > 0 THEN t.net_pnl ELSE 0 END) / 
           ABS(SUM(CASE WHEN t.net_pnl < 0 THEN t.net_pnl ELSE 0 END))
    END,
    2
  ) as profit_factor,
  s.win_rate_target,
  s.risk_reward_target,
  CASE 
    WHEN COUNT(*) < 20 THEN 'insufficient'
    WHEN COUNT(*) < 50 THEN 'building'
    ELSE 'sufficient'
  END as sample_size_status
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id
WHERE t.exit_date IS NOT NULL
GROUP BY t.user_id, s.id, s.name, s.win_rate_target, s.risk_reward_target;

-- =====================================================
-- 3. RULE ADHERENCE SUMMARY VIEW
-- =====================================================
DROP VIEW IF EXISTS rule_adherence_summary;
CREATE VIEW rule_adherence_summary AS
SELECT 
  t.user_id,
  COUNT(*) as total_trades_with_journal,
  SUM(CASE WHEN postj.followed_plan = 1 THEN 1 ELSE 0 END) as trades_followed_plan,
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = 1 THEN 1 ELSE 0 END) / 
    MAX(COUNT(*), 1),
    2
  ) as rule_adherence_rate,
  
  -- Performance comparison
  ROUND(
    AVG(CASE WHEN postj.followed_plan = 1 THEN t.net_pnl END),
    2
  ) as avg_pnl_when_followed_plan,
  ROUND(
    AVG(CASE WHEN postj.followed_plan = 0 THEN t.net_pnl END),
    2
  ) as avg_pnl_when_violated_plan,
  
  -- Win rates
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = 1 AND t.net_pnl > 0 THEN 1 ELSE 0 END) /
    MAX(SUM(CASE WHEN postj.followed_plan = 1 THEN 1 ELSE 0 END), 1),
    2
  ) as win_rate_when_followed,
  ROUND(
    100.0 * SUM(CASE WHEN postj.followed_plan = 0 AND t.net_pnl > 0 THEN 1 ELSE 0 END) /
    MAX(SUM(CASE WHEN postj.followed_plan = 0 THEN 1 ELSE 0 END), 1),
    2
  ) as win_rate_when_violated
  
FROM trades t
JOIN post_trade_journals postj ON t.id = postj.trade_id
WHERE t.exit_date IS NOT NULL
GROUP BY t.user_id;

-- =====================================================
-- 4. RECENT TRADES WITH JOURNALS VIEW
-- =====================================================
DROP VIEW IF EXISTS recent_trades_with_journals;
CREATE VIEW recent_trades_with_journals AS
SELECT 
  t.id as trade_id,
  t.user_id,
  t.ticker,
  t.direction,
  t.entry_date,
  t.exit_date,
  t.entry_price,
  t.exit_price,
  t.quantity,
  t.net_pnl,
  t.return_percent,
  t.actual_rr,
  s.name as strategy_name,
  ptj.emotional_state as pre_trade_emotions,
  ptj.emotional_score as pre_trade_emotional_score,
  ptj.setup_quality,
  postj.followed_plan,
  postj.would_repeat,
  postj.ai_analysis_completed,
  t.created_at
FROM trades t
LEFT JOIN strategies s ON t.strategy_id = s.id
LEFT JOIN pre_trade_journals ptj ON t.id = ptj.trade_id
LEFT JOIN post_trade_journals postj ON t.id = postj.trade_id
ORDER BY t.entry_date DESC;

-- =====================================================
-- 5. MONTHLY PERFORMANCE VIEW
-- =====================================================
DROP VIEW IF EXISTS monthly_performance;
CREATE VIEW monthly_performance AS
SELECT 
  user_id,
  strftime('%Y-%m', entry_date) as month,
  COUNT(*) as trades_count,
  SUM(net_pnl) as monthly_pnl,
  ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 2) as win_rate,
  ROUND(
    CASE 
      WHEN ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END)) = 0 THEN 0
      ELSE SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) / 
           ABS(SUM(CASE WHEN net_pnl < 0 THEN net_pnl ELSE 0 END))
    END,
    2
  ) as profit_factor,
  ROUND(AVG(actual_rr), 2) as avg_risk_reward
FROM trades
WHERE exit_date IS NOT NULL
GROUP BY user_id, strftime('%Y-%m', entry_date)
ORDER BY user_id, month DESC;

-- =====================================================
-- 6. TIME ANALYSIS VIEW (Day of Week / Hour)
-- =====================================================
DROP VIEW IF EXISTS time_analysis;
CREATE VIEW time_analysis AS
SELECT
  user_id,
  day_of_week,
  hour_of_day,
  COUNT(*) as trade_count,
  SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) as wins,
  ROUND(100.0 * SUM(CASE WHEN net_pnl > 0 THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 2) as win_rate,
  SUM(net_pnl) as total_pnl,
  ROUND(AVG(net_pnl), 2) as avg_pnl
FROM trades
WHERE exit_date IS NOT NULL
  AND day_of_week IS NOT NULL
  AND hour_of_day IS NOT NULL
GROUP BY user_id, day_of_week, hour_of_day;
```

---

### Task 2.5: Create Indexes Migration

**Step 1:** Create `src/main/database/migrations/003_indexes.sql`:
```sql
-- Trading Journal Mac - Performance Indexes
-- Created: 2026-02-09

-- Trades table indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON trades(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_exit_date ON trades(exit_date);
CREATE INDEX IF NOT EXISTS idx_trades_time ON trades(day_of_week, hour_of_day);

-- Journals indexes
CREATE INDEX IF NOT EXISTS idx_pre_trade_journals_user ON pre_trade_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_pre_trade_journals_trade ON pre_trade_journals(trade_id);
CREATE INDEX IF NOT EXISTS idx_post_trade_journals_user ON post_trade_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_post_trade_journals_trade ON post_trade_journals(trade_id);

-- Strategies index
CREATE INDEX IF NOT EXISTS idx_strategies_user ON strategies(user_id);

-- Psychology metrics index
CREATE INDEX IF NOT EXISTS idx_psychology_metrics_user_period ON psychology_metrics(user_id, period_start, period_end);

-- Trading plans index
CREATE INDEX IF NOT EXISTS idx_trading_plans_user_date ON trading_plans(user_id, plan_date DESC);
```

---

### Task 2.6: Create Trades DAL

**Step 1:** Create `src/main/database/dal/trades.ts`:
```typescript
import { getDatabase } from '../connection';
import { v4 as uuidv4 } from 'uuid';

export interface Trade {
  id: string;
  user_id: string;
  ticker: string;
  direction: 'long' | 'short';
  strategy_id: string | null;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  commissions: number;
  slippage: number;
  gross_pnl: number | null;
  net_pnl: number | null;
  return_percent: number | null;
  initial_stop_loss: number | null;
  actual_stop_loss: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  actual_rr: number | null;
  hold_duration_minutes: number | null;
  market_conditions: string | null;
  screenshot_url: string | null;
  day_of_week: number | null;
  hour_of_day: number | null;
  imported_from_csv: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTradeInput {
  ticker: string;
  direction: 'long' | 'short';
  strategy_id?: string | null;
  entry_date: string;
  exit_date?: string | null;
  entry_price: number;
  exit_price?: number | null;
  quantity: number;
  commissions?: number;
  slippage?: number;
  initial_stop_loss?: number | null;
  actual_stop_loss?: number | null;
  market_conditions?: string[] | null;
  screenshot_url?: string | null;
}

export interface TradeFilters {
  ticker?: string;
  direction?: 'long' | 'short';
  strategy_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commissions: number
): { gross_pnl: number; net_pnl: number; return_percent: number } {
  const multiplier = direction === 'long' ? 1 : -1;
  const gross_pnl = (exitPrice - entryPrice) * quantity * multiplier;
  const net_pnl = gross_pnl - commissions;
  const return_percent = (net_pnl / (entryPrice * quantity)) * 100;
  return { gross_pnl, net_pnl, return_percent };
}

function calculateHoldDuration(entryDate: string, exitDate: string): number {
  const entry = new Date(entryDate).getTime();
  const exit = new Date(exitDate).getTime();
  return Math.floor((exit - entry) / (1000 * 60));
}

export const tradesDAL = {
  findAll(filters: TradeFilters = {}): Trade[] {
    const db = getDatabase();
    let sql = 'SELECT * FROM trades WHERE user_id = ?';
    const params: any[] = ['local-user'];

    if (filters.ticker) {
      sql += ' AND ticker LIKE ?';
      params.push(`%${filters.ticker}%`);
    }
    if (filters.direction) {
      sql += ' AND direction = ?';
      params.push(filters.direction);
    }
    if (filters.strategy_id) {
      sql += ' AND strategy_id = ?';
      params.push(filters.strategy_id);
    }
    if (filters.start_date) {
      sql += ' AND entry_date >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ' AND entry_date <= ?';
      params.push(filters.end_date);
    }

    sql += ' ORDER BY entry_date DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ' OFFSET ?';
      params.push(filters.offset);
    }

    return db.prepare(sql).all(...params) as Trade[];
  },

  findById(id: string): Trade | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM trades WHERE id = ? AND user_id = ?')
      .get(id, 'local-user');
    return (result as Trade) || null;
  },

  findWithJournals(id: string): any {
    const db = getDatabase();
    const trade = this.findById(id);
    if (!trade) return null;

    const preJournal = db
      .prepare('SELECT * FROM pre_trade_journals WHERE trade_id = ?')
      .get(id);
    const postJournal = db
      .prepare('SELECT * FROM post_trade_journals WHERE trade_id = ?')
      .get(id);
    const strategy = trade.strategy_id
      ? db.prepare('SELECT * FROM strategies WHERE id = ?').get(trade.strategy_id)
      : null;

    return {
      ...trade,
      pre_trade_journals: preJournal ? [preJournal] : [],
      post_trade_journals: postJournal ? [postJournal] : [],
      strategies: strategy,
    };
  },

  create(data: CreateTradeInput): Trade {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const entryDate = new Date(data.entry_date);
    
    // Calculate P&L if exit price provided
    let pnlData = { gross_pnl: null as number | null, net_pnl: null as number | null, return_percent: null as number | null };
    let holdDuration: number | null = null;
    
    if (data.exit_price && data.exit_date) {
      pnlData = calculatePnL(
        data.direction,
        data.entry_price,
        data.exit_price,
        data.quantity,
        data.commissions || 0
      );
      holdDuration = calculateHoldDuration(data.entry_date, data.exit_date);
    }

    const stmt = db.prepare(`
      INSERT INTO trades (
        id, user_id, ticker, direction, strategy_id,
        entry_date, exit_date, entry_price, exit_price, quantity,
        commissions, slippage, gross_pnl, net_pnl, return_percent,
        initial_stop_loss, actual_stop_loss, hold_duration_minutes,
        market_conditions, screenshot_url, day_of_week, hour_of_day,
        imported_from_csv, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `);

    stmt.run(
      id,
      'local-user',
      data.ticker.toUpperCase(),
      data.direction,
      data.strategy_id || null,
      data.entry_date,
      data.exit_date || null,
      data.entry_price,
      data.exit_price || null,
      data.quantity,
      data.commissions || 0,
      data.slippage || 0,
      pnlData.gross_pnl,
      pnlData.net_pnl,
      pnlData.return_percent,
      data.initial_stop_loss || null,
      data.actual_stop_loss || null,
      holdDuration,
      data.market_conditions ? JSON.stringify(data.market_conditions) : null,
      data.screenshot_url || null,
      entryDate.getDay(),
      entryDate.getHours(),
      0,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: Partial<CreateTradeInput>): Trade | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    // Build dynamic update query
    const allowedFields = [
      'ticker', 'direction', 'strategy_id', 'entry_date', 'exit_date',
      'entry_price', 'exit_price', 'quantity', 'commissions', 'slippage',
      'initial_stop_loss', 'actual_stop_loss', 'market_conditions', 'screenshot_url'
    ];

    for (const field of allowedFields) {
      if (field in data) {
        updates.push(`${field} = ?`);
        let value = (data as any)[field];
        if (field === 'market_conditions' && Array.isArray(value)) {
          value = JSON.stringify(value);
        }
        if (field === 'ticker' && typeof value === 'string') {
          value = value.toUpperCase();
        }
        params.push(value);
      }
    }

    if (updates.length === 0) return existing;

    // Recalculate P&L if relevant fields changed
    const entryPrice = data.entry_price ?? existing.entry_price;
    const exitPrice = data.exit_price ?? existing.exit_price;
    const quantity = data.quantity ?? existing.quantity;
    const commissions = data.commissions ?? existing.commissions;
    const direction = data.direction ?? existing.direction;
    const entryDate = data.entry_date ?? existing.entry_date;
    const exitDate = data.exit_date ?? existing.exit_date;

    if (exitPrice && exitDate) {
      const pnlData = calculatePnL(direction, entryPrice, exitPrice, quantity, commissions);
      const holdDuration = calculateHoldDuration(entryDate, exitDate);
      
      updates.push('gross_pnl = ?', 'net_pnl = ?', 'return_percent = ?', 'hold_duration_minutes = ?');
      params.push(pnlData.gross_pnl, pnlData.net_pnl, pnlData.return_percent, holdDuration);
    }

    // Update time analysis fields if entry_date changed
    if (data.entry_date) {
      const newEntryDate = new Date(data.entry_date);
      updates.push('day_of_week = ?', 'hour_of_day = ?');
      params.push(newEntryDate.getDay(), newEntryDate.getHours());
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id, 'local-user');

    const sql = `UPDATE trades SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM trades WHERE id = ? AND user_id = ?')
      .run(id, 'local-user');
    return result.changes > 0;
  },

  count(filters: TradeFilters = {}): number {
    const db = getDatabase();
    let sql = 'SELECT COUNT(*) as count FROM trades WHERE user_id = ?';
    const params: any[] = ['local-user'];

    if (filters.ticker) {
      sql += ' AND ticker LIKE ?';
      params.push(`%${filters.ticker}%`);
    }
    if (filters.strategy_id) {
      sql += ' AND strategy_id = ?';
      params.push(filters.strategy_id);
    }

    const result = db.prepare(sql).get(...params) as { count: number };
    return result.count;
  },
};
```

---

### Task 2.7: Create Strategies DAL

**Step 1:** Create `src/main/database/dal/strategies.ts`:
```typescript
import { getDatabase } from '../connection';
import { v4 as uuidv4 } from 'uuid';

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  setup_criteria: string | null;
  entry_rules: string | null;
  exit_rules: string | null;
  risk_reward_target: number | null;
  win_rate_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyInput {
  name: string;
  description?: string | null;
  setup_criteria?: Record<string, any> | null;
  entry_rules?: string | null;
  exit_rules?: string | null;
  risk_reward_target?: number | null;
  win_rate_target?: number | null;
}

export const strategiesDAL = {
  findAll(): Strategy[] {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM strategies WHERE user_id = ? ORDER BY name')
      .all('local-user') as Strategy[];
  },

  findById(id: string): Strategy | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM strategies WHERE id = ? AND user_id = ?')
      .get(id, 'local-user');
    return (result as Strategy) || null;
  },

  create(data: CreateStrategyInput): Strategy {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO strategies (
        id, user_id, name, description, setup_criteria,
        entry_rules, exit_rules, risk_reward_target, win_rate_target,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      'local-user',
      data.name,
      data.description || null,
      data.setup_criteria ? JSON.stringify(data.setup_criteria) : null,
      data.entry_rules || null,
      data.exit_rules || null,
      data.risk_reward_target || null,
      data.win_rate_target || null,
      now,
      now
    );

    return this.findById(id)!;
  },

  update(id: string, data: Partial<CreateStrategyInput>): Strategy | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.setup_criteria !== undefined) {
      updates.push('setup_criteria = ?');
      params.push(data.setup_criteria ? JSON.stringify(data.setup_criteria) : null);
    }
    if (data.entry_rules !== undefined) {
      updates.push('entry_rules = ?');
      params.push(data.entry_rules);
    }
    if (data.exit_rules !== undefined) {
      updates.push('exit_rules = ?');
      params.push(data.exit_rules);
    }
    if (data.risk_reward_target !== undefined) {
      updates.push('risk_reward_target = ?');
      params.push(data.risk_reward_target);
    }
    if (data.win_rate_target !== undefined) {
      updates.push('win_rate_target = ?');
      params.push(data.win_rate_target);
    }

    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id, 'local-user');

    const sql = `UPDATE strategies SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(sql).run(...params);

    return this.findById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare('DELETE FROM strategies WHERE id = ? AND user_id = ?')
      .run(id, 'local-user');
    return result.changes > 0;
  },
};
```

---

### Task 2.8: Create Journals DAL

**Step 1:** Create `src/main/database/dal/journals.ts`:
```typescript
import { getDatabase } from '../connection';
import { v4 as uuidv4 } from 'uuid';

export interface PreTradeJournal {
  id: string;
  user_id: string;
  trade_id: string | null;
  emotional_state: string;
  emotional_score: number | null;
  market_bias: string | null;
  spy_trend: string | null;
  sector_context: string | null;
  strategy_id: string | null;
  setup_quality: number | null;
  confluence_factors: string | null;
  checklist: string | null;
  planned_entry: number | null;
  planned_stop_loss: number | null;
  planned_target: number | null;
  planned_risk_reward: number | null;
  planned_position_size: number | null;
  planned_risk_amount: number | null;
  thesis: string | null;
  concerns: string | null;
  created_at: string;
}

export interface PostTradeJournal {
  id: string;
  user_id: string;
  trade_id: string | null;
  pre_trade_journal_id: string | null;
  emotional_state: string;
  emotional_score: number | null;
  execution_quality: number | null;
  followed_plan: number | null;
  rule_violations: string | null;
  what_went_well: string | null;
  what_went_wrong: string | null;
  lessons_learned: string | null;
  reflection_notes: string | null;
  ai_analysis_completed: number;
  ai_insights: string | null;
  would_repeat: number | null;
  repeat_reasoning: string | null;
  created_at: string;
}

export interface CreatePreTradeJournalInput {
  trade_id?: string | null;
  emotional_state?: string[];
  emotional_score?: number | null;
  market_bias?: string | null;
  spy_trend?: string | null;
  sector_context?: string | null;
  strategy_id?: string | null;
  setup_quality?: number | null;
  confluence_factors?: string[];
  checklist?: Record<string, boolean>;
  planned_entry?: number | null;
  planned_stop_loss?: number | null;
  planned_target?: number | null;
  planned_risk_reward?: number | null;
  planned_position_size?: number | null;
  planned_risk_amount?: number | null;
  thesis?: string | null;
  concerns?: string | null;
}

export interface CreatePostTradeJournalInput {
  trade_id: string;
  pre_trade_journal_id?: string | null;
  emotional_state?: string[];
  emotional_score?: number | null;
  execution_quality?: number | null;
  followed_plan?: boolean | null;
  rule_violations?: string[];
  what_went_well?: string | null;
  what_went_wrong?: string | null;
  lessons_learned?: string | null;
  reflection_notes?: string | null;
  would_repeat?: boolean | null;
  repeat_reasoning?: string | null;
}

export const journalsDAL = {
  // Pre-trade journals
  findPreTradeByTradeId(tradeId: string): PreTradeJournal | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM pre_trade_journals WHERE trade_id = ? AND user_id = ?')
      .get(tradeId, 'local-user');
    return (result as PreTradeJournal) || null;
  },

  createPreTrade(data: CreatePreTradeJournalInput): PreTradeJournal {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO pre_trade_journals (
        id, user_id, trade_id, emotional_state, emotional_score,
        market_bias, spy_trend, sector_context, strategy_id, setup_quality,
        confluence_factors, checklist, planned_entry, planned_stop_loss,
        planned_target, planned_risk_reward, planned_position_size,
        planned_risk_amount, thesis, concerns, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      'local-user',
      data.trade_id || null,
      JSON.stringify(data.emotional_state || []),
      data.emotional_score || null,
      data.market_bias || null,
      data.spy_trend || null,
      data.sector_context || null,
      data.strategy_id || null,
      data.setup_quality || null,
      data.confluence_factors ? JSON.stringify(data.confluence_factors) : null,
      data.checklist ? JSON.stringify(data.checklist) : null,
      data.planned_entry || null,
      data.planned_stop_loss || null,
      data.planned_target || null,
      data.planned_risk_reward || null,
      data.planned_position_size || null,
      data.planned_risk_amount || null,
      data.thesis || null,
      data.concerns || null,
      now
    );

    return db.prepare('SELECT * FROM pre_trade_journals WHERE id = ?').get(id) as PreTradeJournal;
  },

  updatePreTrade(id: string, data: Partial<CreatePreTradeJournalInput>): PreTradeJournal | null {
    const db = getDatabase();
    const existing = db
      .prepare('SELECT * FROM pre_trade_journals WHERE id = ? AND user_id = ?')
      .get(id, 'local-user') as PreTradeJournal | undefined;
    
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof CreatePreTradeJournalInput)[] = [
      'trade_id', 'emotional_score', 'market_bias', 'spy_trend',
      'sector_context', 'strategy_id', 'setup_quality', 'planned_entry',
      'planned_stop_loss', 'planned_target', 'planned_risk_reward',
      'planned_position_size', 'planned_risk_amount', 'thesis', 'concerns'
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // Handle array/object fields
    if (data.emotional_state !== undefined) {
      updates.push('emotional_state = ?');
      params.push(JSON.stringify(data.emotional_state));
    }
    if (data.confluence_factors !== undefined) {
      updates.push('confluence_factors = ?');
      params.push(JSON.stringify(data.confluence_factors));
    }
    if (data.checklist !== undefined) {
      updates.push('checklist = ?');
      params.push(JSON.stringify(data.checklist));
    }

    if (updates.length === 0) return existing;

    params.push(id, 'local-user');
    const sql = `UPDATE pre_trade_journals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(sql).run(...params);

    return db.prepare('SELECT * FROM pre_trade_journals WHERE id = ?').get(id) as PreTradeJournal;
  },

  // Post-trade journals
  findPostTradeByTradeId(tradeId: string): PostTradeJournal | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM post_trade_journals WHERE trade_id = ? AND user_id = ?')
      .get(tradeId, 'local-user');
    return (result as PostTradeJournal) || null;
  },

  createPostTrade(data: CreatePostTradeJournalInput): PostTradeJournal {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO post_trade_journals (
        id, user_id, trade_id, pre_trade_journal_id, emotional_state,
        emotional_score, execution_quality, followed_plan, rule_violations,
        what_went_well, what_went_wrong, lessons_learned, reflection_notes,
        ai_analysis_completed, ai_insights, would_repeat, repeat_reasoning, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      'local-user',
      data.trade_id,
      data.pre_trade_journal_id || null,
      JSON.stringify(data.emotional_state || []),
      data.emotional_score || null,
      data.execution_quality || null,
      data.followed_plan !== undefined ? (data.followed_plan ? 1 : 0) : null,
      data.rule_violations ? JSON.stringify(data.rule_violations) : null,
      data.what_went_well || null,
      data.what_went_wrong || null,
      data.lessons_learned || null,
      data.reflection_notes || null,
      0,
      null,
      data.would_repeat !== undefined ? (data.would_repeat ? 1 : 0) : null,
      data.repeat_reasoning || null,
      now
    );

    return db.prepare('SELECT * FROM post_trade_journals WHERE id = ?').get(id) as PostTradeJournal;
  },

  updatePostTrade(id: string, data: Partial<CreatePostTradeJournalInput>): PostTradeJournal | null {
    const db = getDatabase();
    const existing = db
      .prepare('SELECT * FROM post_trade_journals WHERE id = ? AND user_id = ?')
      .get(id, 'local-user') as PostTradeJournal | undefined;
    
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    const fields: (keyof CreatePostTradeJournalInput)[] = [
      'trade_id', 'pre_trade_journal_id', 'emotional_score', 'execution_quality',
      'what_went_well', 'what_went_wrong', 'lessons_learned', 'reflection_notes',
      'repeat_reasoning'
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    // Handle boolean fields
    if (data.followed_plan !== undefined) {
      updates.push('followed_plan = ?');
      params.push(data.followed_plan ? 1 : 0);
    }
    if (data.would_repeat !== undefined) {
      updates.push('would_repeat = ?');
      params.push(data.would_repeat ? 1 : 0);
    }

    // Handle array fields
    if (data.emotional_state !== undefined) {
      updates.push('emotional_state = ?');
      params.push(JSON.stringify(data.emotional_state));
    }
    if (data.rule_violations !== undefined) {
      updates.push('rule_violations = ?');
      params.push(JSON.stringify(data.rule_violations));
    }

    if (updates.length === 0) return existing;

    params.push(id, 'local-user');
    const sql = `UPDATE post_trade_journals SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    db.prepare(sql).run(...params);

    return db.prepare('SELECT * FROM post_trade_journals WHERE id = ?').get(id) as PostTradeJournal;
  },

  // Update AI insights
  updateAIInsights(id: string, insights: any): boolean {
    const db = getDatabase();
    const result = db
      .prepare(`
        UPDATE post_trade_journals 
        SET ai_insights = ?, ai_analysis_completed = 1 
        WHERE id = ? AND user_id = ?
      `)
      .run(JSON.stringify(insights), id, 'local-user');
    return result.changes > 0;
  },
};
```

---

### Task 2.9: Create Analytics DAL

**Step 1:** Create `src/main/database/dal/analytics.ts`:
```typescript
import { getDatabase } from '../connection';

export interface PerformanceSummary {
  user_id: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  breakeven_trades: number;
  win_rate: number;
  total_pnl: number;
  total_wins: number;
  total_losses: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  avg_risk_reward: number;
  largest_win: number;
  largest_loss: number;
  avg_hold_minutes: number;
  total_commissions: number;
  total_slippage: number;
}

export interface StrategyPerformance {
  user_id: string;
  strategy_id: string | null;
  strategy_name: string | null;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
  avg_risk_reward: number;
  profit_factor: number;
  win_rate_target: number | null;
  risk_reward_target: number | null;
  sample_size_status: string;
}

export interface MonthlyPerformance {
  user_id: string;
  month: string;
  trades_count: number;
  monthly_pnl: number;
  win_rate: number;
  profit_factor: number;
  avg_risk_reward: number;
}

export interface TimeAnalysis {
  user_id: string;
  day_of_week: number;
  hour_of_day: number;
  trade_count: number;
  wins: number;
  win_rate: number;
  total_pnl: number;
  avg_pnl: number;
}

export const analyticsDAL = {
  getPerformanceSummary(): PerformanceSummary | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM trade_performance_summary WHERE user_id = ?')
      .get('local-user');
    return (result as PerformanceSummary) || null;
  },

  getStrategyPerformance(): StrategyPerformance[] {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM strategy_performance WHERE user_id = ?')
      .all('local-user') as StrategyPerformance[];
  },

  getMonthlyPerformance(): MonthlyPerformance[] {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM monthly_performance WHERE user_id = ? ORDER BY month DESC')
      .all('local-user') as MonthlyPerformance[];
  },

  getTimeAnalysis(): TimeAnalysis[] {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM time_analysis WHERE user_id = ?')
      .all('local-user') as TimeAnalysis[];
  },

  getRuleAdherenceSummary(): any {
    const db = getDatabase();
    return db
      .prepare('SELECT * FROM rule_adherence_summary WHERE user_id = ?')
      .get('local-user');
  },

  getRecentTradesWithJournals(limit: number = 10): any[] {
    const db = getDatabase();
    return db
      .prepare(`
        SELECT * FROM recent_trades_with_journals 
        WHERE user_id = ? 
        ORDER BY entry_date DESC 
        LIMIT ?
      `)
      .all('local-user', limit);
  },

  // Equity curve data
  getEquityCurve(): { date: string; cumulative_pnl: number }[] {
    const db = getDatabase();
    const trades = db
      .prepare(`
        SELECT entry_date, net_pnl 
        FROM trades 
        WHERE user_id = ? AND exit_date IS NOT NULL AND net_pnl IS NOT NULL
        ORDER BY entry_date ASC
      `)
      .all('local-user') as { entry_date: string; net_pnl: number }[];

    let cumulative = 0;
    return trades.map(t => {
      cumulative += t.net_pnl;
      return { date: t.entry_date, cumulative_pnl: cumulative };
    });
  },

  // Psychology correlation (emotions vs performance)
  getPsychologyCorrelation(): any[] {
    const db = getDatabase();
    // Note: This is a simplified version since SQLite doesn't have UNNEST
    // We'll need to parse JSON in application code
    const results = db
      .prepare(`
        SELECT 
          ptj.emotional_state,
          t.net_pnl
        FROM trades t
        JOIN pre_trade_journals ptj ON t.id = ptj.trade_id
        WHERE t.user_id = ? AND t.exit_date IS NOT NULL
      `)
      .all('local-user') as { emotional_state: string; net_pnl: number }[];

    // Process in application to extract emotion correlations
    const emotionStats: Record<string, { wins: number; losses: number; total_pnl: number; count: number }> = {};

    for (const row of results) {
      try {
        const emotions = JSON.parse(row.emotional_state) as string[];
        for (const emotion of emotions) {
          if (!emotionStats[emotion]) {
            emotionStats[emotion] = { wins: 0, losses: 0, total_pnl: 0, count: 0 };
          }
          emotionStats[emotion].count++;
          emotionStats[emotion].total_pnl += row.net_pnl;
          if (row.net_pnl > 0) {
            emotionStats[emotion].wins++;
          } else if (row.net_pnl < 0) {
            emotionStats[emotion].losses++;
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }

    return Object.entries(emotionStats).map(([emotion, stats]) => ({
      emotional_state: emotion,
      trade_count: stats.count,
      win_rate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0,
      avg_pnl: stats.count > 0 ? stats.total_pnl / stats.count : 0,
      total_pnl: stats.total_pnl,
    }));
  },
};
```

---

### Task 2.10: Create Gamification DAL

**Step 1:** Create `src/main/database/dal/gamification.ts`:
```typescript
import { getDatabase } from '../connection';

export interface GamificationStatus {
  id: string;
  user_id: string;
  current_journaling_streak: number;
  longest_journaling_streak: number;
  last_journal_date: string | null;
  total_trades_logged: number;
  total_days_journaled: number;
  badges: string;
  updated_at: string;
}

export interface Badge {
  badge: string;
  earned_at: string;
}

const BADGE_DEFINITIONS = {
  first_trade: { name: 'First Trade', description: 'Log your first trade' },
  ten_trades: { name: '10 Trades', description: 'Log 10 trades' },
  fifty_trades: { name: '50 Trades', description: 'Log 50 trades' },
  hundred_trades: { name: '100 Trades', description: 'Log 100 trades' },
  week_streak: { name: 'Week Warrior', description: '7-day journaling streak' },
  month_streak: { name: 'Monthly Master', description: '30-day journaling streak' },
  rule_follower: { name: 'Rule Follower', description: '90% rule adherence for a week' },
  calm_trader: { name: 'Calm Trader', description: '5 trades with emotional score 4-6' },
};

export const gamificationDAL = {
  getStatus(): GamificationStatus | null {
    const db = getDatabase();
    const result = db
      .prepare('SELECT * FROM gamification WHERE user_id = ?')
      .get('local-user');
    return (result as GamificationStatus) || null;
  },

  updateStreak(): GamificationStatus | null {
    const db = getDatabase();
    const status = this.getStatus();
    if (!status) return null;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = status.current_journaling_streak;
    let longestStreak = status.longest_journaling_streak;

    if (status.last_journal_date === today) {
      // Already journaled today, no change
    } else if (status.last_journal_date === yesterday) {
      // Continuing streak
      newStreak++;
    } else {
      // Streak broken, start new
      newStreak = 1;
    }

    if (newStreak > longestStreak) {
      longestStreak = newStreak;
    }

    db.prepare(`
      UPDATE gamification 
      SET current_journaling_streak = ?, 
          longest_journaling_streak = ?,
          last_journal_date = ?,
          total_days_journaled = total_days_journaled + 1,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(newStreak, longestStreak, today, 'local-user');

    return this.getStatus();
  },

  incrementTradeCount(): void {
    const db = getDatabase();
    db.prepare(`
      UPDATE gamification 
      SET total_trades_logged = total_trades_logged + 1,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run('local-user');
  },

  checkAndAwardBadges(): Badge[] {
    const db = getDatabase();
    const status = this.getStatus();
    if (!status) return [];

    const currentBadges: Badge[] = JSON.parse(status.badges || '[]');
    const earnedBadgeNames = currentBadges.map(b => b.badge);
    const newBadges: Badge[] = [];
    const now = new Date().toISOString();

    // Check trade count badges
    if (status.total_trades_logged >= 1 && !earnedBadgeNames.includes('first_trade')) {
      newBadges.push({ badge: 'first_trade', earned_at: now });
    }
    if (status.total_trades_logged >= 10 && !earnedBadgeNames.includes('ten_trades')) {
      newBadges.push({ badge: 'ten_trades', earned_at: now });
    }
    if (status.total_trades_logged >= 50 && !earnedBadgeNames.includes('fifty_trades')) {
      newBadges.push({ badge: 'fifty_trades', earned_at: now });
    }
    if (status.total_trades_logged >= 100 && !earnedBadgeNames.includes('hundred_trades')) {
      newBadges.push({ badge: 'hundred_trades', earned_at: now });
    }

    // Check streak badges
    if (status.current_journaling_streak >= 7 && !earnedBadgeNames.includes('week_streak')) {
      newBadges.push({ badge: 'week_streak', earned_at: now });
    }
    if (status.current_journaling_streak >= 30 && !earnedBadgeNames.includes('month_streak')) {
      newBadges.push({ badge: 'month_streak', earned_at: now });
    }

    // Save new badges
    if (newBadges.length > 0) {
      const allBadges = [...currentBadges, ...newBadges];
      db.prepare(`
        UPDATE gamification 
        SET badges = ?, updated_at = datetime('now')
        WHERE user_id = ?
      `).run(JSON.stringify(allBadges), 'local-user');
    }

    return newBadges;
  },

  getBadgeDefinitions(): typeof BADGE_DEFINITIONS {
    return BADGE_DEFINITIONS;
  },
};
```

---

### Task 2.11: Create Settings DAL

**Step 1:** Create `src/main/database/dal/settings.ts`:
```typescript
import { getDatabase } from '../connection';

export interface UserSettings {
  theme: 'dark' | 'light';
  currency: string;
  timezone: string;
  defaultStrategy?: string;
  riskPerTrade?: number;
  dailyLossLimit?: number;
  [key: string]: any;
}

export const settingsDAL = {
  getAll(): UserSettings {
    const db = getDatabase();
    const result = db
      .prepare('SELECT settings FROM user_settings WHERE user_id = ?')
      .get('local-user') as { settings: string } | undefined;

    if (!result) {
      return { theme: 'dark', currency: 'USD', timezone: 'America/Los_Angeles' };
    }

    try {
      return JSON.parse(result.settings);
    } catch {
      return { theme: 'dark', currency: 'USD', timezone: 'America/Los_Angeles' };
    }
  },

  get(key: string): any {
    const settings = this.getAll();
    return settings[key];
  },

  set(key: string, value: any): void {
    const db = getDatabase();
    const settings = this.getAll();
    settings[key] = value;

    db.prepare(`
      UPDATE user_settings 
      SET settings = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(JSON.stringify(settings), 'local-user');
  },

  setMultiple(updates: Partial<UserSettings>): void {
    const db = getDatabase();
    const settings = this.getAll();
    
    for (const [key, value] of Object.entries(updates)) {
      settings[key] = value;
    }

    db.prepare(`
      UPDATE user_settings 
      SET settings = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(JSON.stringify(settings), 'local-user');
  },

  reset(): void {
    const db = getDatabase();
    const defaultSettings: UserSettings = {
      theme: 'dark',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
    };

    db.prepare(`
      UPDATE user_settings 
      SET settings = ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(JSON.stringify(defaultSettings), 'local-user');
  },
};
```

---

### Task 2.12: Create DAL Index

**Step 1:** Create `src/main/database/dal/index.ts`:
```typescript
export { tradesDAL } from './trades';
export { strategiesDAL } from './strategies';
export { journalsDAL } from './journals';
export { analyticsDAL } from './analytics';
export { gamificationDAL } from './gamification';
export { settingsDAL } from './settings';

// Re-export types
export type { Trade, CreateTradeInput, TradeFilters } from './trades';
export type { Strategy, CreateStrategyInput } from './strategies';
export type { PreTradeJournal, PostTradeJournal, CreatePreTradeJournalInput, CreatePostTradeJournalInput } from './journals';
export type { PerformanceSummary, StrategyPerformance, MonthlyPerformance, TimeAnalysis } from './analytics';
export type { GamificationStatus, Badge } from './gamification';
export type { UserSettings } from './settings';
```

---

### Task 2.13: Update Main Process to Initialize Database

**Step 1:** Update `src/main/index.ts`:

Add at the top of the file after imports:
```typescript
import { initializeDatabase, closeDatabase, getDatabasePath } from './database/connection';
import { runMigrations } from './database/migrations/runner';
import path from 'path';
```

Add before `createWindow()` function:
```typescript
/**
 * Initialize database and run migrations
 */
function initializeDatabaseLayer(): void {
  try {
    console.log('Initializing database...');
    initializeDatabase();
    
    // Get migrations directory path
    // In development: src/main/database/migrations
    // In production: resources/migrations (need to copy)
    let migrationsDir: string;
    
    if (process.env.NODE_ENV === 'development') {
      migrationsDir = path.join(process.cwd(), 'src', 'main', 'database', 'migrations');
    } else {
      migrationsDir = path.join(__dirname, 'migrations');
    }
    
    console.log('Running migrations from:', migrationsDir);
    runMigrations(migrationsDir);
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
```

Update `app.whenReady()`:
```typescript
app.whenReady().then(() => {
  // Initialize database before creating window
  initializeDatabaseLayer();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
```

Add before quit handler:
```typescript
app.on('before-quit', () => {
  closeDatabase();
});
```

---

## Success Criteria

- [ ] `npm run dev` starts without database errors
- [ ] Database file created at correct location
- [ ] All 8 tables + 1 migrations table + 1 settings table exist
- [ ] Views created successfully (6 views)
- [ ] Indexes created on key columns
- [ ] Default user profile exists (`local-user`)
- [ ] Default gamification record exists
- [ ] Default settings record exists
- [ ] Can manually test DAL functions from main process

### Test Commands

Add to main process for testing (remove after verification):
```typescript
// Temporary test - add after database init
import { tradesDAL, strategiesDAL, gamificationDAL, analyticsDAL } from './database/dal';

// Test trade creation
const testTrade = tradesDAL.create({
  ticker: 'AAPL',
  direction: 'long',
  entry_date: new Date().toISOString(),
  exit_date: new Date().toISOString(),
  entry_price: 150.00,
  exit_price: 155.00,
  quantity: 100,
  commissions: 1.00,
});
console.log('Created test trade:', testTrade);

// Test read
const trades = tradesDAL.findAll();
console.log('All trades:', trades);

// Test analytics
const summary = analyticsDAL.getPerformanceSummary();
console.log('Performance summary:', summary);

// Test gamification
gamificationDAL.incrementTradeCount();
const status = gamificationDAL.getStatus();
console.log('Gamification status:', status);
```

---

## Handoff to Next Phase

### Completed in This Phase
- SQLite database connection manager with WAL mode
- Migration system for schema versioning
- All 8 core tables translated from PostgreSQL
- 6 analytics views created
- Performance indexes added
- Complete Data Access Layer (DAL) for all entities
- Database initialization wired to app startup

### Files Ready for Phase 3
- All DAL modules ready for IPC handler wiring
- Database schema matches source application types

### State of the App
- Electron window opens
- Database initialized with schema
- Migrations run automatically
- DAL functions available for data operations
- No UI connected to database yet

### Next Phase Prerequisites Met
- Database layer fully functional
- Type-safe DAL ready for IPC handlers
- Test data can be created programmatically

---

**Next Document:** `03_PHASE_CORE_FEATURES.md`
