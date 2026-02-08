import { z } from 'zod'

/**
 * Enum for trade direction
 */
export const tradeDirectionSchema = z.enum(['long', 'short'])

/**
 * Enum for market bias
 */
export const marketBiasSchema = z.enum(['bullish', 'bearish', 'neutral', 'choppy'])

/**
 * Available emotions for emotional state
 */
export const emotionsSchema = z.array(
  z.enum([
    'confident',
    'anxious',
    'neutral',
    'fomo',
    'revenge',
    'overconfident',
    'fearful',
    'greedy',
    'frustrated',
    'disciplined',
    'impulsive',
    'patient',
  ])
)

/**
 * Rule violations enum
 */
export const ruleViolationsSchema = z.array(
  z.enum([
    'moved_stop_loss',
    'oversized_position',
    'exited_early',
    'held_too_long',
    'ignored_plan',
    'revenge_trade',
    'over_leveraged',
    'no_stop_loss',
    'fomo_entry',
    'poor_risk_reward',
  ])
)

/**
 * Trade schema for creating/updating trades
 */
export const tradeSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker must be 10 characters or less')
    .transform((val) => val.toUpperCase()),
  direction: tradeDirectionSchema,
  entry_date: z.string().min(1, 'Entry date is required'),
  exit_date: z.string().optional().nullable(),
  entry_price: z
    .number({ invalid_type_error: 'Entry price must be a number' })
    .positive('Entry price must be positive'),
  exit_price: z
    .number({ invalid_type_error: 'Exit price must be a number' })
    .positive('Exit price must be positive')
    .optional()
    .nullable(),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive'),
  commissions: z
    .number({ invalid_type_error: 'Commissions must be a number' })
    .min(0, 'Commissions cannot be negative')
    .default(0),
  notes: z.string().optional().nullable(),
  screenshot_url: z.string().url('Invalid URL').optional().nullable(),
})

/**
 * Pre-trade journal schema
 */
export const preTradeJournalSchema = z.object({
  emotional_state: emotionsSchema.optional().default([]),
  emotional_score: z
    .number()
    .min(1, 'Emotional score must be between 1 and 10')
    .max(10, 'Emotional score must be between 1 and 10')
    .optional()
    .nullable(),
  market_bias: marketBiasSchema.optional().nullable(),
  strategy_id: z.string().uuid('Invalid strategy ID').optional().nullable(),
  setup_quality: z
    .number()
    .min(1, 'Setup quality must be between 1 and 5')
    .max(5, 'Setup quality must be between 1 and 5')
    .optional()
    .nullable(),
  planned_entry: z
    .number()
    .positive('Planned entry must be positive')
    .optional()
    .nullable(),
  planned_stop_loss: z
    .number()
    .positive('Planned stop loss must be positive')
    .optional()
    .nullable(),
  planned_target: z
    .number()
    .positive('Planned target must be positive')
    .optional()
    .nullable(),
  thesis: z.string().max(2000, 'Thesis is too long').optional().nullable(),
})

/**
 * Post-trade journal schema
 */
export const postTradeJournalSchema = z.object({
  emotional_state: emotionsSchema.optional().default([]),
  emotional_score: z
    .number()
    .min(1, 'Emotional score must be between 1 and 10')
    .max(10, 'Emotional score must be between 1 and 10')
    .optional()
    .nullable(),
  followed_plan: z.boolean().optional().default(false),
  rule_violations: ruleViolationsSchema.optional().default([]),
  what_went_well: z
    .string()
    .max(2000, 'What went well is too long')
    .optional()
    .nullable(),
  what_went_wrong: z
    .string()
    .max(2000, 'What went wrong is too long')
    .optional()
    .nullable(),
  lessons_learned: z
    .string()
    .max(2000, 'Lessons learned is too long')
    .optional()
    .nullable(),
  would_repeat: z.boolean().optional().nullable(),
})

/**
 * Combined trade entry form schema (trade + journals)
 */
export const tradeEntrySchema = z.object({
  trade: tradeSchema,
  preTradeJournal: preTradeJournalSchema.optional(),
  postTradeJournal: postTradeJournalSchema.optional(),
})

/**
 * Strategy schema
 */
export const strategySchema = z.object({
  name: z
    .string()
    .min(1, 'Strategy name is required')
    .max(100, 'Strategy name is too long'),
  description: z.string().max(500, 'Description is too long').optional().nullable(),
  rules: z.string().max(2000, 'Rules are too long').optional().nullable(),
})

/**
 * Type exports
 */
export type TradeDirection = z.infer<typeof tradeDirectionSchema>
export type MarketBias = z.infer<typeof marketBiasSchema>
export type Emotions = z.infer<typeof emotionsSchema>
export type RuleViolations = z.infer<typeof ruleViolationsSchema>
export type TradeInput = z.infer<typeof tradeSchema>
export type PreTradeJournalInput = z.infer<typeof preTradeJournalSchema>
export type PostTradeJournalInput = z.infer<typeof postTradeJournalSchema>
export type TradeEntryInput = z.infer<typeof tradeEntrySchema>
export type StrategyInput = z.infer<typeof strategySchema>
