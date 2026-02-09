import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateWinRate, calculateProfitFactorFromTrades, calculateExpectancy } from '@/lib/utils/calculations'

export async function GET(request: Request) {
  console.log('[API/METRICS GET] Creating Supabase client...')
  const supabase = await createClient()
  
  console.log('[API/METRICS GET] Getting user...')
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('[API/METRICS GET] Auth result:', {
    hasUser: !!user,
    userId: user?.id,
    hasError: !!authError,
    errorMessage: authError?.message
  })
  
  if (!user) {
    console.error('[API/METRICS GET] No user - returning 401')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  console.log('[API/METRICS GET] Auth successful, calculating metrics...')
  
  // Fetch all closed trades
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .not('exit_date', 'is', null)
    .order('exit_date', { ascending: false })
  
  if (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }

  if (!trades || trades.length === 0) {
    return NextResponse.json({
      totalPnL: 0,
      winRate: 0,
      totalTrades: 0,
      profitFactor: 0,
      avgRR: 0,
      avgWin: 0,
      avgLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      expectancy: 0,
      currentStreak: 0,
    })
  }
  
  // Calculate metrics
  const totalPnL = trades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)
  const winningTrades = trades.filter(t => (t.net_pnl || 0) > 0)
  const losingTrades = trades.filter(t => (t.net_pnl || 0) < 0)
  
  const winRate = calculateWinRate(winningTrades.length, trades.length)
  const profitFactor = calculateProfitFactorFromTrades(trades)
  const expectancy = calculateExpectancy(trades)
  
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0) / winningTrades.length 
    : 0
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + Math.abs(t.net_pnl || 0), 0) / losingTrades.length
    : 0
  
  const largestWin = winningTrades.length > 0 
    ? Math.max(...winningTrades.map(t => t.net_pnl || 0)) 
    : 0
  const largestLoss = losingTrades.length > 0 
    ? Math.min(...losingTrades.map(t => t.net_pnl || 0)) 
    : 0
  
  const avgRR = trades
    .filter(t => t.actual_rr && t.actual_rr > 0)
    .reduce((sum, t, _, arr) => sum + (t.actual_rr || 0) / arr.length, 0)
  
  // Calculate current streak
  let currentStreak = 0
  if (trades.length > 0) {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.exit_date!).getTime() - new Date(a.exit_date!).getTime()
    )
    const isWinningStreak = (sortedTrades[0].net_pnl || 0) > 0
    for (const trade of sortedTrades) {
      const pnl = trade.net_pnl || 0
      if ((isWinningStreak && pnl > 0) || (!isWinningStreak && pnl <= 0)) {
        currentStreak++
      } else {
        break
      }
    }
    if (!isWinningStreak) currentStreak = -currentStreak
  }
  
  return NextResponse.json({
    totalPnL,
    winRate,
    totalTrades: trades.length,
    profitFactor,
    avgRR,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    expectancy,
    currentStreak,
  })
}
