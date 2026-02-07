// Trading Journal - Database Constants
// Enums and constant arrays matching database schema
// Last updated: 2026-02-07

// =====================================================
// TRADING STYLES
// =====================================================

export const TRADING_STYLES = [
  'day_trader',
  'swing_trader',
  'position_trader',
  'investor',
] as const;

export const TRADING_STYLE_LABELS: Record<typeof TRADING_STYLES[number], string> = {
  day_trader: 'Day Trader',
  swing_trader: 'Swing Trader',
  position_trader: 'Position Trader',
  investor: 'Investor',
};

export const TRADING_STYLE_DESCRIPTIONS: Record<typeof TRADING_STYLES[number], string> = {
  day_trader: 'Close all positions by end of day',
  swing_trader: 'Hold positions for days to weeks',
  position_trader: 'Hold positions for weeks to months',
  investor: 'Long-term buy and hold',
};

// =====================================================
// TRADE DIRECTIONS
// =====================================================

export const DIRECTIONS = ['long', 'short'] as const;

export const DIRECTION_LABELS: Record<typeof DIRECTIONS[number], string> = {
  long: 'Long',
  short: 'Short',
};

export const DIRECTION_COLORS: Record<typeof DIRECTIONS[number], string> = {
  long: 'text-green-500',
  short: 'text-red-500',
};

// =====================================================
// MARKET CONDITIONS
// =====================================================

export const MARKET_BIAS = ['bullish', 'bearish', 'neutral', 'choppy'] as const;

export const MARKET_BIAS_LABELS: Record<typeof MARKET_BIAS[number], string> = {
  bullish: 'Bullish',
  bearish: 'Bearish',
  neutral: 'Neutral',
  choppy: 'Choppy',
};

export const MARKET_BIAS_COLORS: Record<typeof MARKET_BIAS[number], string> = {
  bullish: 'text-green-500',
  bearish: 'text-red-500',
  neutral: 'text-gray-500',
  choppy: 'text-yellow-500',
};

export const SPY_TREND = ['uptrend', 'downtrend', 'sideways'] as const;

export const SPY_TREND_LABELS: Record<typeof SPY_TREND[number], string> = {
  uptrend: 'Uptrend',
  downtrend: 'Downtrend',
  sideways: 'Sideways',
};

export const SPY_TREND_COLORS: Record<typeof SPY_TREND[number], string> = {
  uptrend: 'text-green-500',
  downtrend: 'text-red-500',
  sideways: 'text-gray-500',
};

export const MARKET_CONDITIONS = [
  'trending',
  'volatile',
  'pre_market',
  'post_market',
  'high_volume',
  'low_volume',
  'earnings',
  'news_driven',
] as const;

// =====================================================
// EMOTIONAL STATES
// =====================================================

export const PRE_TRADE_EMOTIONS = [
  'confident',
  'anxious',
  'neutral',
  'FOMO',
  'revenge',
  'overconfident',
] as const;

export const POST_TRADE_EMOTIONS = [
  'relieved',
  'regret',
  'validated',
  'frustrated',
  'proud',
  'disappointed',
] as const;

export const EMOTIONAL_STATE_LABELS = {
  // Pre-trade
  confident: 'Confident',
  anxious: 'Anxious',
  neutral: 'Neutral',
  FOMO: 'FOMO',
  revenge: 'Revenge',
  overconfident: 'Overconfident',
  
  // Post-trade
  relieved: 'Relieved',
  regret: 'Regret',
  validated: 'Validated',
  frustrated: 'Frustrated',
  proud: 'Proud',
  disappointed: 'Disappointed',
} as const;

export const EMOTIONAL_STATE_COLORS = {
  // Pre-trade
  confident: 'text-blue-500 bg-blue-500/10',
  anxious: 'text-yellow-500 bg-yellow-500/10',
  neutral: 'text-gray-500 bg-gray-500/10',
  FOMO: 'text-orange-500 bg-orange-500/10',
  revenge: 'text-red-500 bg-red-500/10',
  overconfident: 'text-purple-500 bg-purple-500/10',
  
  // Post-trade
  relieved: 'text-green-500 bg-green-500/10',
  regret: 'text-red-500 bg-red-500/10',
  validated: 'text-blue-500 bg-blue-500/10',
  frustrated: 'text-orange-500 bg-orange-500/10',
  proud: 'text-purple-500 bg-purple-500/10',
  disappointed: 'text-gray-500 bg-gray-500/10',
} as const;

// Emoji representations for quick UI display
export const EMOTIONAL_STATE_EMOJIS = {
  // Pre-trade
  confident: '😎',
  anxious: '😰',
  neutral: '😐',
  FOMO: '😱',
  revenge: '😤',
  overconfident: '🤑',
  
  // Post-trade
  relieved: '😌',
  regret: '😔',
  validated: '✅',
  frustrated: '😠',
  proud: '😊',
  disappointed: '😞',
} as const;

// =====================================================
// RULE VIOLATIONS
// =====================================================

export const RULE_VIOLATIONS = [
  'moved_stop_loss',
  'oversized_position',
  'exited_early',
  'no_stop_loss',
  'revenge_trade',
  'overtrading',
] as const;

export const RULE_VIOLATION_LABELS: Record<typeof RULE_VIOLATIONS[number], string> = {
  moved_stop_loss: 'Moved Stop Loss',
  oversized_position: 'Oversized Position',
  exited_early: 'Exited Early',
  no_stop_loss: 'No Stop Loss',
  revenge_trade: 'Revenge Trade',
  overtrading: 'Overtrading',
};

export const RULE_VIOLATION_DESCRIPTIONS: Record<typeof RULE_VIOLATIONS[number], string> = {
  moved_stop_loss: 'Moved stop loss after entry (usually to avoid taking loss)',
  oversized_position: 'Position size exceeded risk management rules',
  exited_early: 'Exited trade before target or without valid reason',
  no_stop_loss: 'Entered trade without setting a stop loss',
  revenge_trade: 'Took trade to recover from previous loss',
  overtrading: 'Exceeded max trades per day limit',
};

// =====================================================
// RATING SCALES
// =====================================================

export const SETUP_QUALITY_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export const EXECUTION_QUALITY_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export const EMOTIONAL_SCORE_LABELS: Record<number, string> = {
  1: 'Fearful',
  2: 'Anxious',
  3: 'Cautious',
  4: 'Calm',
  5: 'Neutral',
  6: 'Confident',
  7: 'Optimistic',
  8: 'Excited',
  9: 'Euphoric',
  10: 'Overconfident',
};

// =====================================================
// CONFLUENCE FACTORS
// =====================================================

export const CONFLUENCE_FACTORS = [
  '200MA support',
  '200MA resistance',
  '50MA support',
  '50MA resistance',
  'VWAP support',
  'VWAP resistance',
  'previous day high',
  'previous day low',
  'bullish divergence',
  'bearish divergence',
  'volume spike',
  'volume dry-up',
  'higher timeframe trend',
  'institutional level',
  'gap fill',
  'earnings catalyst',
  'news catalyst',
] as const;

// =====================================================
// CHECKLIST ITEMS
// =====================================================

export const PRE_TRADE_CHECKLIST_ITEMS = [
  { key: 'higher_tf_aligned', label: 'Higher timeframe aligned' },
  { key: 'position_size_correct', label: 'Position size within risk limits' },
  { key: 'stop_loss_set', label: 'Stop loss defined' },
  { key: 'target_defined', label: 'Profit target defined' },
  { key: 'risk_reward_acceptable', label: 'Risk:Reward > 2:1' },
  { key: 'catalyst_identified', label: 'Catalyst or reason identified' },
  { key: 'emotional_state_neutral', label: 'Emotional state is neutral' },
  { key: 'setup_matches_strategy', label: 'Setup matches playbook' },
  { key: 'volume_acceptable', label: 'Volume is acceptable' },
  { key: 'time_of_day_ok', label: 'Trading during best hours' },
] as const;

// =====================================================
// BADGES
// =====================================================

export const BADGE_DEFINITIONS = {
  // Trade milestones
  '10_trades': {
    name: 'First 10',
    description: 'Logged your first 10 trades',
    icon: '📊',
    color: 'bg-blue-500',
  },
  '50_trades': {
    name: 'Halfway to 100',
    description: 'Logged 50 trades',
    icon: '📈',
    color: 'bg-green-500',
  },
  '100_trades': {
    name: 'Century',
    description: 'Logged 100 trades',
    icon: '💯',
    color: 'bg-purple-500',
  },
  '500_trades': {
    name: 'Veteran',
    description: 'Logged 500 trades',
    icon: '🏆',
    color: 'bg-yellow-500',
  },
  
  // Journaling streaks
  '7_day_streak': {
    name: 'Week Warrior',
    description: '7 days of consistent journaling',
    icon: '🔥',
    color: 'bg-orange-500',
  },
  '30_day_streak': {
    name: 'Monthly Master',
    description: '30 days of consistent journaling',
    icon: '⭐',
    color: 'bg-blue-500',
  },
  '100_day_streak': {
    name: 'Discipline Legend',
    description: '100 days of consistent journaling',
    icon: '👑',
    color: 'bg-yellow-500',
  },
  
  // Performance badges
  'first_profit': {
    name: 'First Win',
    description: 'Your first profitable trade',
    icon: '💰',
    color: 'bg-green-500',
  },
  'profitable_month': {
    name: 'Monthly Winner',
    description: 'First profitable month',
    icon: '📅',
    color: 'bg-green-500',
  },
  '90_percent_adherence': {
    name: 'Rule Follower',
    description: '90% rule adherence for a week',
    icon: '✅',
    color: 'bg-blue-500',
  },
  'calm_confidence': {
    name: 'Calm Confidence',
    description: '5 trades with emotional score 4-6',
    icon: '😌',
    color: 'bg-purple-500',
  },
} as const;

// =====================================================
// AI MODELS (OpenRouter)
// =====================================================

export const AI_MODELS = [
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', cost: 'High' },
  { id: 'openai/gpt-4', name: 'GPT-4', cost: 'High' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', cost: 'Low' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', cost: 'High' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', cost: 'Medium' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', cost: 'Low' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B', cost: 'Low' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', cost: 'Medium' },
] as const;

// =====================================================
// TIME ZONES
// =====================================================

export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
] as const;

// =====================================================
// DISPLAY CONSTANTS
// =====================================================

export const CURRENCY_FORMAT = {
  locale: 'en-US',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

export const PERCENTAGE_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const;

export const DATE_FORMAT = 'MMM dd, yyyy' as const;
export const DATETIME_FORMAT = 'MMM dd, yyyy HH:mm' as const;
export const TIME_FORMAT = 'HH:mm' as const;

// =====================================================
// VALIDATION CONSTANTS
// =====================================================

export const VALIDATION_RULES = {
  ticker: {
    minLength: 1,
    maxLength: 10,
    pattern: /^[A-Z0-9]+$/,
  },
  quantity: {
    min: 1,
    max: 1000000,
  },
  price: {
    min: 0.01,
    max: 1000000,
  },
  emotional_score: {
    min: 1,
    max: 10,
  },
  setup_quality: {
    min: 1,
    max: 5,
  },
  execution_quality: {
    min: 1,
    max: 5,
  },
  risk_per_trade_percent: {
    min: 0.1,
    max: 10,
  },
} as const;

// =====================================================
// SAMPLE SIZE THRESHOLDS
// =====================================================

export const SAMPLE_SIZE_THRESHOLDS = {
  insufficient: 20,
  building: 50,
  sufficient: 50,
} as const;

// =====================================================
// DEFAULT VALUES
// =====================================================

export const DEFAULT_VALUES = {
  risk_per_trade_percent: 1.0,
  preferred_ai_model: 'openai/gpt-4-turbo',
  timezone: 'America/Los_Angeles',
  commissions: 0,
  slippage: 0,
} as const;
