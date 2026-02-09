/**
 * Time Analysis Utility Functions
 * Helper functions for time-based trading analysis
 */

// Day of week mapping (0=Sunday, 1=Monday, etc.)
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// TypeScript types for time analysis
export interface TimeSlotData {
  day: number | null
  hour: number | null
  winRate: number
  tradeCount: number
  avgPnl: number
  totalPnl: number
}

export interface AvoidPattern {
  timeSlot: string
  winRate: number
  avgPnl: number
  tradeCount: number
  message: string
}

export interface HeatmapResponse {
  heatmapData: TimeSlotData[]
  avoidPatterns: AvoidPattern[]
}

export interface TimeSlotLabel {
  label: string
  winRate: number
  tradeCount: number
  avgPnl: number
  totalPnl: number
}

export interface BestWorstTimesResponse {
  bestTimes: TimeSlotLabel[]
  worstTimes: TimeSlotLabel[]
}

/**
 * Convert day of week number to name
 * @param dayNum - Day number (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns Day name
 */
export function getDayName(dayNum: number): string {
  if (dayNum < 0 || dayNum > 6) {
    return 'Unknown'
  }
  return DAY_NAMES[dayNum]
}

/**
 * Convert hour (0-23) to readable 12-hour format
 * @param hour - Hour in 24-hour format (0-23)
 * @returns Formatted time string (e.g., "9am", "2pm")
 */
export function formatHour(hour: number): string {
  if (hour < 0 || hour > 23) {
    return 'Invalid'
  }
  
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}

/**
 * Generate a human-readable time slot label
 * @param dayNum - Day of week number (optional)
 * @param hour - Hour of day (optional)
 * @returns Formatted label (e.g., "Tuesday 10am", "Wednesday", "2pm")
 */
export function generateTimeLabel(dayNum?: number | null, hour?: number | null): string {
  if (dayNum !== null && dayNum !== undefined && hour !== null && hour !== undefined) {
    return `${getDayName(dayNum)} ${formatHour(hour)}`
  } else if (dayNum !== null && dayNum !== undefined) {
    return getDayName(dayNum)
  } else if (hour !== null && hour !== undefined) {
    return formatHour(hour)
  }
  return 'Unknown'
}

/**
 * Generate an avoid pattern message
 * @param timeSlot - Human-readable time slot label
 * @param winRate - Win rate percentage
 * @param avgPnl - Average P&L
 * @returns Warning message
 */
export function generateAvoidMessage(timeSlot: string, winRate: number, avgPnl: number): string {
  const parts = timeSlot.split(' ')
  
  if (parts.length === 2) {
    // Has both day and hour
    const [day, time] = parts
    if (avgPnl < 0) {
      return `You lose money trading ${day}s after ${time.replace(/\d+/, (match) => {
        const num = parseInt(match)
        return num === 12 ? '12' : num.toString()
      })}`
    } else {
      return `Low win rate (${winRate.toFixed(1)}%) on ${day}s at ${time}`
    }
  } else {
    // Only day or only hour
    if (avgPnl < 0) {
      return `You lose money trading on ${timeSlot}`
    } else {
      return `Low win rate (${winRate.toFixed(1)}%) on ${timeSlot}`
    }
  }
}

/**
 * Detect avoid patterns from heatmap data
 * @param data - Array of time slot data
 * @param minTrades - Minimum number of trades to consider (default: 10)
 * @param maxWinRate - Maximum win rate to flag as avoid pattern (default: 40%)
 * @returns Array of avoid patterns
 */
export function detectAvoidPatterns(
  data: TimeSlotData[],
  minTrades: number = 10,
  maxWinRate: number = 40
): AvoidPattern[] {
  return data
    .filter(slot => slot.tradeCount >= minTrades && slot.winRate < maxWinRate)
    .map(slot => {
      const timeSlot = generateTimeLabel(slot.day, slot.hour)
      return {
        timeSlot,
        winRate: slot.winRate,
        avgPnl: slot.avgPnl,
        tradeCount: slot.tradeCount,
        message: generateAvoidMessage(timeSlot, slot.winRate, slot.avgPnl)
      }
    })
    .sort((a, b) => a.winRate - b.winRate) // Sort by worst win rate first
}
