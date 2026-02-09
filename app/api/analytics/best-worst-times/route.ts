import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateTimeLabel, type BestWorstTimesResponse, type TimeSlotLabel } from '@/lib/utils/time-analysis'

interface TimeSlotAggregation {
  day: number
  hour: number
  trades: number[]
  wins: number
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '5', 10)
    
    // Validate limit parameter
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive integer' },
        { status: 400 }
      )
    }
    
    // Build query
    let query = supabase
      .from('trades')
      .select('day_of_week, hour_of_day, net_pnl')
      .eq('user_id', user.id)
      .not('exit_date', 'is', null) // Only completed trades
      .not('day_of_week', 'is', null)
      .not('hour_of_day', 'is', null)
    
    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('entry_date', startDate)
    }
    if (endDate) {
      query = query.lte('entry_date', endDate)
    }
    
    const { data: trades, error: tradesError } = await query
    
    if (tradesError) {
      console.error('Error fetching trades:', tradesError)
      return NextResponse.json(
        { error: 'Failed to fetch trade data' },
        { status: 500 }
      )
    }
    
    if (!trades || trades.length === 0) {
      return NextResponse.json({
        bestTimes: [],
        worstTimes: []
      } as BestWorstTimesResponse)
    }
    
    // Aggregate data by day and hour
    const aggregationMap = new Map<string, TimeSlotAggregation>()
    
    for (const trade of trades) {
      const pnl = trade.net_pnl || 0
      const key = `day_${trade.day_of_week}_hour_${trade.hour_of_day}`
      
      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          day: trade.day_of_week,
          hour: trade.hour_of_day,
          trades: [],
          wins: 0
        })
      }
      
      const slot = aggregationMap.get(key)!
      slot.trades.push(pnl)
      if (pnl > 0) {
        slot.wins++
      }
    }
    
    // Convert to array and calculate metrics
    const MIN_TRADES = 5 // Minimum sample size
    const timeSlots: TimeSlotLabel[] = Array.from(aggregationMap.values())
      .filter(slot => slot.trades.length >= MIN_TRADES)
      .map(slot => {
        const tradeCount = slot.trades.length
        const winRate = (slot.wins / tradeCount) * 100
        const totalPnl = slot.trades.reduce((sum, pnl) => sum + pnl, 0)
        const avgPnl = totalPnl / tradeCount
        
        return {
          label: generateTimeLabel(slot.day, slot.hour),
          winRate: Math.round(winRate * 100) / 100,
          tradeCount,
          avgPnl: Math.round(avgPnl * 100) / 100,
          totalPnl: Math.round(totalPnl * 100) / 100
        }
      })
    
    // Sort by win rate and get best times (highest win rate)
    const bestTimes = [...timeSlots]
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit)
    
    // Sort by win rate and get worst times (lowest win rate)
    const worstTimes = [...timeSlots]
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, limit)
    
    return NextResponse.json({
      bestTimes,
      worstTimes
    } as BestWorstTimesResponse)
    
  } catch (error) {
    console.error('Unexpected error in best-worst-times API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
