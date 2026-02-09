import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { detectAvoidPatterns, type HeatmapResponse, type TimeSlotData } from '@/lib/utils/time-analysis'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'day' // "day" or "hour"
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Validate period parameter
    if (period !== 'day' && period !== 'hour') {
      return NextResponse.json(
        { error: 'Invalid period parameter. Must be "day" or "hour"' },
        { status: 400 }
      )
    }
    
    // Build query based on period type
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
        heatmapData: [],
        avoidPatterns: []
      } as HeatmapResponse)
    }
    
    // Aggregate data based on period
    const aggregationMap = new Map<string, {
      day: number | null
      hour: number | null
      trades: number[]
      wins: number
    }>()
    
    for (const trade of trades) {
      const pnl = trade.net_pnl || 0
      let key: string
      let day: number | null
      let hour: number | null
      
      if (period === 'day') {
        // Aggregate by day only
        key = `day_${trade.day_of_week}`
        day = trade.day_of_week
        hour = null
      } else {
        // Aggregate by day and hour
        key = `day_${trade.day_of_week}_hour_${trade.hour_of_day}`
        day = trade.day_of_week
        hour = trade.hour_of_day
      }
      
      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          day,
          hour,
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
    
    // Convert aggregation map to response format
    const heatmapData: TimeSlotData[] = Array.from(aggregationMap.values()).map(slot => {
      const tradeCount = slot.trades.length
      const winRate = tradeCount > 0 ? (slot.wins / tradeCount) * 100 : 0
      const totalPnl = slot.trades.reduce((sum, pnl) => sum + pnl, 0)
      const avgPnl = tradeCount > 0 ? totalPnl / tradeCount : 0
      
      return {
        day: slot.day,
        hour: slot.hour,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
        tradeCount,
        avgPnl: Math.round(avgPnl * 100) / 100,
        totalPnl: Math.round(totalPnl * 100) / 100
      }
    })
    
    // Sort heatmap data for consistent ordering
    heatmapData.sort((a, b) => {
      if (a.day !== b.day) {
        return (a.day || 0) - (b.day || 0)
      }
      return (a.hour || 0) - (b.hour || 0)
    })
    
    // Detect avoid patterns (winRate < 40% AND tradeCount >= 10)
    const avoidPatterns = detectAvoidPatterns(heatmapData, 10, 40)
    
    return NextResponse.json({
      heatmapData,
      avoidPatterns
    } as HeatmapResponse)
    
  } catch (error) {
    console.error('Unexpected error in time-heatmap API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
