/**
 * Calculate profit/loss for a trade
 */
export function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commissions: number = 0
): number {
  const directionMultiplier = direction === 'long' ? 1 : -1
  const grossPnL = (exitPrice - entryPrice) * quantity * directionMultiplier
  return grossPnL - commissions
}

/**
 * Calculate return percentage based on P&L and cost basis
 */
export function calculateReturnPercent(
  pnl: number,
  entryPrice: number,
  quantity: number
): number {
  const costBasis = entryPrice * quantity
  if (costBasis === 0) return 0
  return (pnl / costBasis) * 100
}

/**
 * Calculate risk:reward ratio for a trade setup
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  target: number,
  direction: 'long' | 'short'
): number {
  if (direction === 'long') {
    const risk = entryPrice - stopLoss
    const reward = target - entryPrice
    if (risk === 0) return 0
    return reward / risk
  } else {
    const risk = stopLoss - entryPrice
    const reward = entryPrice - target
    if (risk === 0) return 0
    return reward / risk
  }
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(wins: number, totalTrades: number): number {
  if (totalTrades === 0) return 0
  return (wins / totalTrades) * 100
}

/**
 * Calculate profit factor from total profit and loss
 */
export function calculateProfitFactor(
  totalProfit: number,
  totalLoss: number
): number {
  if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0
  return Math.abs(totalProfit / totalLoss)
}

/**
 * Calculate profit factor from trades array
 */
export function calculateProfitFactorFromTrades(
  trades: Array<{ net_pnl: number | null }>
): number {
  const totalProfit = trades
    .filter(t => t.net_pnl && t.net_pnl > 0)
    .reduce((sum, t) => sum + (t.net_pnl || 0), 0)
  
  const totalLoss = Math.abs(
    trades
      .filter(t => t.net_pnl && t.net_pnl < 0)
      .reduce((sum, t) => sum + (t.net_pnl || 0), 0)
  )
  
  return calculateProfitFactor(totalProfit, totalLoss)
}

/**
 * Calculate expectancy (average P&L per trade)
 */
export function calculateExpectancy(
  trades: Array<{ net_pnl: number | null }>
): number {
  const validTrades = trades.filter(t => t.net_pnl !== null)
  if (validTrades.length === 0) return 0
  
  const totalPnL = validTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
  return totalPnL / validTrades.length
}

/**
 * Calculate average P&L
 */
export function calculateAveragePnL(trades: number[]): number {
  if (trades.length === 0) return 0
  const sum = trades.reduce((acc, val) => acc + val, 0)
  return sum / trades.length
}

/**
 * Calculate Sharpe ratio (simplified version)
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0
): number {
  if (returns.length === 0) return 0
  
  const avgReturn = calculateAveragePnL(returns)
  const excessReturn = avgReturn - riskFreeRate
  
  // Calculate standard deviation
  const squaredDiffs = returns.map(r => Math.pow(r - avgReturn, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / returns.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev === 0) return 0
  return excessReturn / stdDev
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) return 0
  
  let maxDrawdown = 0
  let peak = equityCurve[0]
  
  for (const value of equityCurve) {
    if (value > peak) {
      peak = value
    }
    const drawdown = ((peak - value) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }
  
  return maxDrawdown
}
