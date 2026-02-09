import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  calculateMetrics,
  parseSectorFromContext,
  determineBestWorstConditions,
  type MarketCorrelationResponse,
  type SpyConditionData,
  type SectorMetrics
} from '@/lib/utils/market-analysis'

interface TradeWithContext {
  net_pnl: number
  spy_trend: string | null
  sector_context: string | null
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const groupBy = searchParams.get('groupBy') || 'both'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Validate groupBy parameter
    if (!['spy_trend', 'sector', 'both'].includes(groupBy)) {
      return NextResponse.json(
        { error: 'Invalid groupBy parameter. Must be "spy_trend", "sector", or "both"' },
        { status: 400 }
      )
    }
    
    // Build query to join trades with pre_trade_journals
    let query = supabase
      .from('trades')
      .select(`
        net_pnl,
        pre_trade_journals (
          spy_trend,
          sector_context
        )
      `)
      .eq('user_id', user.id)
      .not('exit_date', 'is', null) // Only completed trades
    
    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('entry_date', startDate)
    }
    if (endDate) {
      query = query.lte('entry_date', endDate)
    }
    
    const { data: trades, error: tradesError } = await query
    
    if (tradesError) {
      console.error('Error fetching trades with market context:', tradesError)
      return NextResponse.json(
        { error: 'Failed to fetch trade data' },
        { status: 500 }
      )
    }
    
    if (!trades || trades.length === 0) {
      // Return empty response structure
      return NextResponse.json({
        spyTrending: {
          uptrend: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 },
          downtrend: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 },
          sideways: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 }
        },
        sectors: [],
        summary: {
          bestSpyCondition: 'N/A',
          worstSpyCondition: 'N/A',
          bestSector: 'N/A',
          worstSector: 'N/A'
        }
      } as MarketCorrelationResponse)
    }
    
    // Transform data structure - handle both single and array pre_trade_journals
    const tradesWithContext: TradeWithContext[] = trades
      .map(trade => {
        const journal = Array.isArray(trade.pre_trade_journals) 
          ? trade.pre_trade_journals[0] 
          : trade.pre_trade_journals
        
        return {
          net_pnl: trade.net_pnl || 0,
          spy_trend: journal?.spy_trend || null,
          sector_context: journal?.sector_context || null
        }
      })
      .filter(trade => trade.spy_trend !== null || trade.sector_context !== null)
    
    // Aggregate by SPY condition
    const spyAggregation = new Map<string, number[]>()
    const sectorAggregation = new Map<string, number[]>()
    
    for (const trade of tradesWithContext) {
      // Group by SPY trend
      if (trade.spy_trend && (groupBy === 'spy_trend' || groupBy === 'both')) {
        if (!spyAggregation.has(trade.spy_trend)) {
          spyAggregation.set(trade.spy_trend, [])
        }
        spyAggregation.get(trade.spy_trend)!.push(trade.net_pnl)
      }
      
      // Group by sector
      if (trade.sector_context && (groupBy === 'sector' || groupBy === 'both')) {
        const sector = parseSectorFromContext(trade.sector_context)
        if (sector) {
          if (!sectorAggregation.has(sector)) {
            sectorAggregation.set(sector, [])
          }
          sectorAggregation.get(sector)!.push(trade.net_pnl)
        }
      }
    }
    
    // Calculate SPY condition metrics
    const spyTrending: SpyConditionData = {
      uptrend: calculateMetrics(spyAggregation.get('uptrend') || []),
      downtrend: calculateMetrics(spyAggregation.get('downtrend') || []),
      sideways: calculateMetrics(spyAggregation.get('sideways') || [])
    }
    
    // Add choppy if it exists in the data
    if (spyAggregation.has('choppy')) {
      spyTrending.choppy = calculateMetrics(spyAggregation.get('choppy') || [])
    }
    
    // Calculate sector metrics
    const sectors: SectorMetrics[] = Array.from(sectorAggregation.entries())
      .map(([sector, pnls]) => ({
        sector,
        ...calculateMetrics(pnls)
      }))
      .sort((a, b) => b.winRate - a.winRate) // Sort by win rate descending
    
    // Generate summary
    const summary = determineBestWorstConditions(spyTrending, sectors)
    
    // Build response
    const response: MarketCorrelationResponse = {
      spyTrending,
      sectors,
      summary
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Unexpected error in market-correlation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
