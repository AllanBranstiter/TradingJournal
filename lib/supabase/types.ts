// Trading Journal - TypeScript Types
// Auto-generated types matching Supabase database schema
// Last updated: 2026-02-07

// =====================================================
// ENUMS
// =====================================================

export type TradingStyle = 'day_trader' | 'swing_trader' | 'position_trader' | 'investor';
export type Direction = 'long' | 'short';
export type MarketBias = 'bullish' | 'bearish' | 'neutral' | 'choppy';
export type SpyTrend = 'uptrend' | 'downtrend' | 'sideways';

export type PreTradeEmotion = 'confident' | 'anxious' | 'neutral' | 'FOMO' | 'revenge' | 'overconfident';
export type PostTradeEmotion = 'relieved' | 'regret' | 'validated' | 'frustrated' | 'proud' | 'disappointed';

export type RuleViolation = 
  | 'moved_stop_loss' 
  | 'oversized_position' 
  | 'exited_early' 
  | 'no_stop_loss' 
  | 'revenge_trade' 
  | 'overtrading';

export type SampleSizeStatus = 'insufficient' | 'building' | 'sufficient';

// =====================================================
// TABLE INTERFACES
// =====================================================

export interface UserProfile {
  id: string; // UUID references auth.users
  display_name: string | null;
  email: string;
  timezone: string;
  trading_style: TradingStyle | null;
  
  // Risk Management
  risk_per_trade_percent: number;
  daily_loss_limit: number | null;
  weekly_loss_limit: number | null;
  account_balance: number | null;
  
  // AI Configuration
  openrouter_api_key: string | null; // Encrypted
  preferred_ai_model: string;
  ai_features_enabled: boolean;
  
  created_at: string; // ISO 8601 timestamp
  updated_at: string;
}

export interface Strategy {
  id: string; // UUID
  user_id: string;
  name: string;
  description: string | null;
  setup_criteria: Record<string, any> | null; // JSONB
  entry_rules: string | null;
  exit_rules: string | null;
  risk_reward_target: number | null;
  win_rate_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string; // UUID
  user_id: string;
  
  // Basic Info
  ticker: string;
  direction: Direction;
  strategy_id: string | null;
  
  // Execution
  entry_date: string; // ISO 8601 timestamp
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  
  // Costs
  commissions: number;
  slippage: number;
  
  // P&L
  gross_pnl: number | null;
  net_pnl: number | null;
  return_percent: number | null;
  
  // Risk Management
  initial_stop_loss: number | null;
  actual_stop_loss: number | null;
  risk_amount: number | null;
  reward_amount: number | null;
  actual_rr: number | null;
  
  // Metadata
  hold_duration_minutes: number | null;
  market_conditions: string[] | null;
  screenshot_url: string | null;
  
  imported_from_csv: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface PreTradeJournal {
  id: string; // UUID
  user_id: string;
  trade_id: string | null;
  
  // Emotional State
  emotional_state: PreTradeEmotion[];
  emotional_score: number | null; // 1-10
  
  // Market Analysis
  market_bias: MarketBias | null;
  spy_trend: SpyTrend | null;
  sector_context: string | null;
  
  // Setup Validation
  strategy_id: string | null;
  setup_quality: number | null; // 1-5
  confluence_factors: string[] | null;
  
  // Checklist
  checklist: Record<string, boolean> | null; // JSONB
  
  // Planned Parameters
  planned_entry: number | null;
  planned_stop_loss: number | null;
  planned_target: number | null;
  planned_risk_reward: number | null;
  planned_position_size: number | null;
  planned_risk_amount: number | null;
  
  // Notes
  thesis: string | null;
  concerns: string | null;
  
  created_at: string;
}

export interface PostTradeJournal {
  id: string; // UUID
  user_id: string;
  trade_id: string | null;
  pre_trade_journal_id: string | null;
  
  // Emotional State
  emotional_state: PostTradeEmotion[];
  emotional_score: number | null; // 1-10
  
  // Execution Analysis
  execution_quality: number | null; // 1-5
  followed_plan: boolean | null;
  rule_violations: RuleViolation[] | null;
  
  // Reflection
  what_went_well: string | null;
  what_went_wrong: string | null;
  lessons_learned: string | null;
  
  // AI Analysis
  reflection_notes: string | null;
  ai_analysis_completed: boolean;
  ai_insights: AIInsights | null; // JSONB
  
  // Repeat Analysis
  would_repeat: boolean | null;
  repeat_reasoning: string | null;
  
  created_at: string;
}

export interface PsychologyMetrics {
  id: string; // UUID
  user_id: string;
  
  // Period
  period_start: string; // Date
  period_end: string; // Date
  
  // Behavioral Metrics
  discipline_score: number | null; // 0-100
  rule_adherence_rate: number | null;
  fomo_trade_count: number;
  revenge_trade_count: number;
  
  // Emotional Patterns
  most_common_pre_trade_emotion: string | null;
  most_common_post_trade_emotion: string | null;
  emotional_volatility: number | null;
  
  // Performance Correlations
  disciplined_trade_win_rate: number | null;
  fomo_trade_win_rate: number | null;
  
  created_at: string;
}

export interface TradingPlan {
  id: string; // UUID
  user_id: string;
  
  plan_date: string; // Date
  market_outlook: string | null;
  watchlist: WatchlistItem[] | null; // JSONB
  max_trades_allowed: number | null;
  max_loss_limit: number | null;
  focus_strategies: string[] | null;
  personal_reminders: string[] | null;
  
  created_at: string;
  updated_at: string;
}

export interface Gamification {
  id: string; // UUID
  user_id: string;
  
  // Streaks
  current_journaling_streak: number;
  longest_journaling_streak: number;
  last_journal_date: string | null; // Date
  
  // Milestones
  total_trades_logged: number;
  total_days_journaled: number;
  
  // Badges
  badges: Badge[]; // JSONB array
  
  updated_at: string;
}

// =====================================================
// NESTED/JSONB TYPES
// =====================================================

export interface AIInsights {
  detected_patterns: string[];
  emotional_insights?: string;
  rule_adherence_feedback?: string;
  actionable_recommendations: string[];
  encouragement?: string;
}

export interface WatchlistItem {
  ticker: string;
  trigger?: string;
  notes?: string;
}

export interface Badge {
  badge: string;
  earned_at: string;
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface TradePerformanceSummary {
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

export interface PsychologyPerformanceCorrelation {
  user_id: string;
  emotional_state: PreTradeEmotion;
  trade_count: number;
  win_rate: number;
  avg_pnl: number;
  avg_emotional_score: number;
  total_pnl: number;
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
  sample_size_status: SampleSizeStatus;
}

export interface RuleAdherenceSummary {
  user_id: string;
  total_trades_with_journal: number;
  trades_followed_plan: number;
  rule_adherence_rate: number;
  
  // Violation counts
  moved_stop_loss_count: number;
  oversized_position_count: number;
  exited_early_count: number;
  no_stop_loss_count: number;
  revenge_trade_count: number;
  overtrading_count: number;
  
  // Performance comparison
  avg_pnl_when_followed_plan: number;
  avg_pnl_when_violated_plan: number;
  win_rate_when_followed: number;
  win_rate_when_violated: number;
}

export interface RecentTradeWithJournals {
  trade_id: string;
  user_id: string;
  ticker: string;
  direction: Direction;
  entry_date: string;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  net_pnl: number | null;
  return_percent: number | null;
  actual_rr: number | null;
  strategy_name: string | null;
  pre_trade_emotions: PreTradeEmotion[] | null;
  pre_trade_emotional_score: number | null;
  setup_quality: number | null;
  followed_plan: boolean | null;
  would_repeat: boolean | null;
  ai_analysis_completed: boolean | null;
  created_at: string;
}

export interface MonthlyPerformance {
  user_id: string;
  month: string; // Date truncated to month
  trades_count: number;
  monthly_pnl: number;
  win_rate: number;
  profit_factor: number;
  avg_risk_reward: number;
}

// =====================================================
// FUNCTION RETURN TYPES
// =====================================================

export interface TradeMetricsResult {
  gross_pnl: number;
  net_pnl: number;
  return_percent: number;
}

export interface UserPerformanceMetrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  avg_risk_reward: number;
  largest_win: number;
  largest_loss: number;
  expectancy: number;
}

// =====================================================
// FORM/INPUT TYPES
// =====================================================

export interface CreateTradeInput {
  ticker: string;
  direction: Direction;
  strategy_id?: string;
  entry_date: string;
  exit_date?: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  commissions?: number;
  slippage?: number;
  initial_stop_loss?: number;
  actual_stop_loss?: number;
  market_conditions?: string[];
  screenshot_url?: string;
}

export interface CreatePreTradeJournalInput {
  trade_id?: string;
  emotional_state: PreTradeEmotion[];
  emotional_score?: number;
  market_bias?: MarketBias;
  spy_trend?: SpyTrend;
  sector_context?: string;
  strategy_id?: string;
  setup_quality?: number;
  confluence_factors?: string[];
  checklist?: Record<string, boolean>;
  planned_entry?: number;
  planned_stop_loss?: number;
  planned_target?: number;
  planned_risk_reward?: number;
  planned_position_size?: number;
  planned_risk_amount?: number;
  thesis?: string;
  concerns?: string;
}

export interface CreatePostTradeJournalInput {
  trade_id: string;
  pre_trade_journal_id?: string;
  emotional_state: PostTradeEmotion[];
  emotional_score?: number;
  execution_quality?: number;
  followed_plan?: boolean;
  rule_violations?: RuleViolation[];
  what_went_well?: string;
  what_went_wrong?: string;
  lessons_learned?: string;
  reflection_notes?: string;
  would_repeat?: boolean;
  repeat_reasoning?: string;
}

export interface UpdateUserProfileInput {
  display_name?: string;
  timezone?: string;
  trading_style?: TradingStyle;
  risk_per_trade_percent?: number;
  daily_loss_limit?: number;
  weekly_loss_limit?: number;
  account_balance?: number;
  openrouter_api_key?: string;
  preferred_ai_model?: string;
  ai_features_enabled?: boolean;
}

// =====================================================
// DATABASE RESPONSE TYPES
// =====================================================

export type DatabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type DatabaseResponse<T> = {
  data: T | null;
  error: DatabaseError | null;
};

export type DatabaseArrayResponse<T> = {
  data: T[] | null;
  error: DatabaseError | null;
  count?: number;
};

// =====================================================
// UTILITY TYPES
// =====================================================

// Make all properties of T optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Pick subset of fields for list views
export type TradeListItem = Pick<Trade, 
  'id' | 'ticker' | 'direction' | 'entry_date' | 'exit_date' | 'net_pnl' | 'return_percent'
>;

export type StrategyListItem = Pick<Strategy, 
  'id' | 'name' | 'description' | 'win_rate_target' | 'risk_reward_target'
>;
