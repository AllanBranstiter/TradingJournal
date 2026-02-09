// Market Analysis Utility Functions
// Phase 3: Market Correlation Analytics

/**
 * Trade data interface for market analysis
 */
export interface TradeWithMarketContext {
  net_pnl: number
  spy_trend: string | null
  sector_context: string | null
}

/**
 * Aggregated metrics for a market condition
 */
export interface MarketConditionMetrics {
  winRate: number
  profitFactor: number
  avgPnl: number
  tradeCount: number
  totalPnl?: number
}

/**
 * SPY condition performance data
 */
export interface SpyConditionData {
  uptrend: MarketConditionMetrics
  downtrend: MarketConditionMetrics
  sideways: MarketConditionMetrics
  choppy?: MarketConditionMetrics
}

/**
 * Sector performance data
 */
export interface SectorMetrics extends MarketConditionMetrics {
  sector: string
}

/**
 * Market correlation response
 */
export interface MarketCorrelationResponse {
  spyTrending: SpyConditionData
  sectors: SectorMetrics[]
  summary: {
    bestSpyCondition: string
    worstSpyCondition: string
    bestSector: string
    worstSector: string
  }
}

/**
 * Calculate profit factor from an array of trade P&Ls
 * Profit Factor = Gross Profit / Gross Loss
 * Returns 0 if there are no losing trades (avoid division by zero)
 */
export function calculateProfitFactor(pnls: number[]): number {
  const grossProfit = pnls.filter(pnl => pnl > 0).reduce((sum, pnl) => sum + pnl, 0)
  const grossLoss = Math.abs(pnls.filter(pnl => pnl < 0).reduce((sum, pnl) => sum + pnl, 0))
  
  if (grossLoss === 0) {
    return grossProfit > 0 ? 999.99 : 0 // Perfect profit factor or no trades
  }
  
  return grossProfit / grossLoss
}

/**
 * Calculate metrics for a group of trades
 */
export function calculateMetrics(pnls: number[]): MarketConditionMetrics {
  if (pnls.length === 0) {
    return {
      winRate: 0,
      profitFactor: 0,
      avgPnl: 0,
      tradeCount: 0,
      totalPnl: 0
    }
  }
  
  const wins = pnls.filter(pnl => pnl > 0).length
  const winRate = (wins / pnls.length) * 100
  const profitFactor = calculateProfitFactor(pnls)
  const totalPnl = pnls.reduce((sum, pnl) => sum + pnl, 0)
  const avgPnl = totalPnl / pnls.length
  
  return {
    winRate: Math.round(winRate * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    avgPnl: Math.round(avgPnl * 100) / 100,
    tradeCount: pnls.length,
    totalPnl: Math.round(totalPnl * 100) / 100
  }
}

/**
 * Extract sector name from sector_context text
 * Examples:
 * - "Tech sector showing strength" -> "technology"
 * - "Healthcare looking bullish" -> "healthcare"
 * - "Financial sector weakness" -> "financial"
 */
export function parseSectorFromContext(sectorContext: string | null): string | null {
  if (!sectorContext) return null
  
  const sectorKeywords: Record<string, string[]> = {
    'technology': ['tech', 'technology', 'software', 'semiconductor'],
    'healthcare': ['healthcare', 'health', 'biotech', 'pharma', 'pharmaceutical'],
    'financial': ['financial', 'finance', 'bank', 'insurance'],
    'energy': ['energy', 'oil', 'gas'],
    'consumer': ['consumer', 'retail', 'discretionary', 'staples'],
    'industrial': ['industrial', 'manufacturing'],
    'materials': ['materials', 'commodity', 'commodities'],
    'utilities': ['utilities', 'utility'],
    'real estate': ['real estate', 'reit'],
    'communication': ['communication', 'telecom', 'media']
  }
  
  const lowerContext = sectorContext.toLowerCase()
  
  for (const [sector, keywords] of Object.entries(sectorKeywords)) {
    if (keywords.some(keyword => lowerContext.includes(keyword))) {
      return sector
    }
  }
  
  // If no match found, return first word as fallback
  const firstWord = sectorContext.trim().split(/\s+/)[0].toLowerCase()
  return firstWord.length > 2 ? firstWord : null
}

/**
 * Determine best condition based on combined score of win rate and profit factor
 * Score = (winRate * 0.5) + (profitFactor * 10 * 0.5)
 */
function calculateConditionScore(metrics: MarketConditionMetrics): number {
  if (metrics.tradeCount === 0) return 0
  
  // Weighted score: 50% win rate, 50% profit factor (scaled)
  const winRateScore = metrics.winRate * 0.5
  const profitFactorScore = Math.min(metrics.profitFactor * 10, 100) * 0.5
  
  return winRateScore + profitFactorScore
}

/**
 * Determine best and worst market conditions from aggregated data
 */
export function determineBestWorstConditions(
  spyData: SpyConditionData,
  sectorData: SectorMetrics[]
): {
  bestSpyCondition: string
  worstSpyCondition: string
  bestSector: string
  worstSector: string
} {
  // Find best/worst SPY conditions
  const spyConditions = [
    { name: 'uptrend', metrics: spyData.uptrend },
    { name: 'downtrend', metrics: spyData.downtrend },
    { name: 'sideways', metrics: spyData.sideways }
  ]
  
  if (spyData.choppy && spyData.choppy.tradeCount > 0) {
    spyConditions.push({ name: 'choppy', metrics: spyData.choppy })
  }
  
  const validSpyConditions = spyConditions.filter(c => c.metrics.tradeCount > 0)
  
  let bestSpyCondition = 'N/A'
  let worstSpyCondition = 'N/A'
  
  if (validSpyConditions.length > 0) {
    validSpyConditions.sort((a, b) => 
      calculateConditionScore(b.metrics) - calculateConditionScore(a.metrics)
    )
    bestSpyCondition = validSpyConditions[0].name
    worstSpyCondition = validSpyConditions[validSpyConditions.length - 1].name
  }
  
  // Find best/worst sectors
  let bestSector = 'N/A'
  let worstSector = 'N/A'
  
  if (sectorData.length > 0) {
    const sortedSectors = [...sectorData].sort((a, b) => 
      calculateConditionScore(b) - calculateConditionScore(a)
    )
    bestSector = sortedSectors[0].sector
    worstSector = sortedSectors[sortedSectors.length - 1].sector
  }
  
  return {
    bestSpyCondition,
    worstSpyCondition,
    bestSector,
    worstSector
  }
}
