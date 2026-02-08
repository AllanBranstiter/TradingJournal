import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week' // week, month, all

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - 1)
    } else {
      startDate = new Date('2020-01-01') // All time
    }

    // Fetch trades with journals for the period
    const { data: trades } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*)
      `)
      .eq('user_id', user.id)
      .gte('entry_date', startDate.toISOString())
      .lte('entry_date', endDate.toISOString())
      .not('exit_date', 'is', null)

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        data: {
          period_start: startDate.toISOString().split('T')[0],
          period_end: endDate.toISOString().split('T')[0],
          total_trades: 0,
          metrics: null
        }
      })
    }

    // Calculate behavioral metrics
    const tradesWithJournals = trades.filter(t => 
      t.pre_trade_journals && t.pre_trade_journals.length > 0 &&
      t.post_trade_journals && t.post_trade_journals.length > 0
    )

    const followedPlanCount = tradesWithJournals.filter(t => 
      t.post_trade_journals[0]?.followed_plan === true
    ).length

    const ruleAdherenceRate = tradesWithJournals.length > 0
      ? (followedPlanCount / tradesWithJournals.length) * 100
      : 0

    // Count FOMO and revenge trades
    const fomoTrades = tradesWithJournals.filter(t =>
      t.pre_trade_journals[0]?.emotional_state?.includes('FOMO')
    )
    const revengeTrades = tradesWithJournals.filter(t =>
      t.pre_trade_journals[0]?.emotional_state?.includes('revenge')
    )

    // Find most common emotions
    const preEmotions: string[] = []
    const postEmotions: string[] = []
    
    tradesWithJournals.forEach(t => {
      if (t.pre_trade_journals[0]?.emotional_state) {
        preEmotions.push(...t.pre_trade_journals[0].emotional_state)
      }
      if (t.post_trade_journals[0]?.emotional_state) {
        postEmotions.push(...t.post_trade_journals[0].emotional_state)
      }
    })

    const getMostCommon = (arr: string[]) => {
      if (arr.length === 0) return null
      const counts = arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    }

    // Calculate emotional volatility (std dev of emotional scores)
    const emotionalScores = tradesWithJournals
      .map(t => t.pre_trade_journals[0]?.emotional_score)
      .filter((score): score is number => score !== null && score !== undefined)

    const avgScore = emotionalScores.length > 0
      ? emotionalScores.reduce((a, b) => a + b, 0) / emotionalScores.length
      : 0

    const variance = emotionalScores.length > 0
      ? emotionalScores.reduce((acc, score) => acc + Math.pow(score - avgScore, 2), 0) / emotionalScores.length
      : 0

    const emotionalVolatility = Math.sqrt(variance)

    // Performance correlations
    const disciplinedTrades = tradesWithJournals.filter(t =>
      t.post_trade_journals[0]?.followed_plan === true
    )
    const disciplinedWins = disciplinedTrades.filter(t => (t.net_pnl || 0) > 0).length
    const disciplinedWinRate = disciplinedTrades.length > 0
      ? (disciplinedWins / disciplinedTrades.length) * 100
      : 0

    const fomoWins = fomoTrades.filter(t => (t.net_pnl || 0) > 0).length
    const fomoWinRate = fomoTrades.length > 0
      ? (fomoWins / fomoTrades.length) * 100
      : 0

    // Discipline score (0-100)
    let disciplineScore = 0
    if (tradesWithJournals.length > 0) {
      const ruleAdherenceWeight = 0.4
      const emotionalControlWeight = 0.3
      const setupQualityWeight = 0.3

      const avgEmotionalControl = emotionalVolatility < 2 ? 100 : Math.max(0, 100 - (emotionalVolatility * 15))
      
      const setupQualities = tradesWithJournals
        .map(t => t.pre_trade_journals[0]?.setup_quality)
        .filter((q): q is number => q !== null && q !== undefined)
      const avgSetupQuality = setupQualities.length > 0
        ? (setupQualities.reduce((a, b) => a + b, 0) / setupQualities.length) * 20
        : 50

      disciplineScore = Math.round(
        (ruleAdherenceRate * ruleAdherenceWeight) +
        (avgEmotionalControl * emotionalControlWeight) +
        (avgSetupQuality * setupQualityWeight)
      )
    }

    // Emotion vs Performance data
    const emotionPerformance = await supabase
      .from('psychology_performance_correlation')
      .select('*')
      .eq('user_id', user.id)

    const metrics = {
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      total_trades: trades.length,
      trades_with_journals: tradesWithJournals.length,
      
      discipline_score: disciplineScore,
      rule_adherence_rate: Math.round(ruleAdherenceRate * 100) / 100,
      fomo_trade_count: fomoTrades.length,
      revenge_trade_count: revengeTrades.length,
      
      most_common_pre_trade_emotion: getMostCommon(preEmotions),
      most_common_post_trade_emotion: getMostCommon(postEmotions),
      emotional_volatility: Math.round(emotionalVolatility * 100) / 100,
      
      disciplined_trade_win_rate: Math.round(disciplinedWinRate * 100) / 100,
      fomo_trade_win_rate: Math.round(fomoWinRate * 100) / 100,
      
      emotion_performance: emotionPerformance.data || []
    }

    return NextResponse.json({ data: metrics })

  } catch (error) {
    console.error('Psychology metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch psychology metrics' },
      { status: 500 }
    )
  }
}
