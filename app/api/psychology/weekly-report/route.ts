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

    // Calculate current week and previous week
    const currentWeekEnd = new Date()
    const currentWeekStart = new Date()
    currentWeekStart.setDate(currentWeekEnd.getDate() - 7)

    const previousWeekStart = new Date(currentWeekStart)
    previousWeekStart.setDate(previousWeekStart.getDate() - 7)
    const previousWeekEnd = new Date(currentWeekStart)

    // Fetch current week trades with journals
    const { data: currentWeekTrades } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*)
      `)
      .eq('user_id', user.id)
      .gte('entry_date', currentWeekStart.toISOString())
      .lte('entry_date', currentWeekEnd.toISOString())
      .not('exit_date', 'is', null)

    // Fetch previous week trades with journals
    const { data: previousWeekTrades } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*)
      `)
      .eq('user_id', user.id)
      .gte('entry_date', previousWeekStart.toISOString())
      .lte('entry_date', previousWeekEnd.toISOString())
      .not('exit_date', 'is', null)

    // Helper function to calculate metrics
    const calculateMetrics = (trades: any[]) => {
      if (!trades || trades.length === 0) {
        return {
          total_trades: 0,
          trades_with_journals: 0,
          discipline_score: 0,
          rule_adherence_rate: 0,
          fomo_trade_count: 0,
          emotional_volatility: 0,
          win_rate: 0,
          total_pnl: 0,
        }
      }

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

      const fomoTrades = tradesWithJournals.filter(t =>
        t.pre_trade_journals[0]?.emotional_state?.includes('FOMO')
      )

      // Calculate emotional volatility
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

      // Discipline score
      let disciplineScore = 0
      if (tradesWithJournals.length > 0) {
        const avgEmotionalControl = emotionalVolatility < 2 ? 100 : Math.max(0, 100 - (emotionalVolatility * 15))
        
        const setupQualities = tradesWithJournals
          .map(t => t.pre_trade_journals[0]?.setup_quality)
          .filter((q): q is number => q !== null && q !== undefined)
        const avgSetupQuality = setupQualities.length > 0
          ? (setupQualities.reduce((a, b) => a + b, 0) / setupQualities.length) * 20
          : 50

        disciplineScore = Math.round(
          (ruleAdherenceRate * 0.4) +
          (avgEmotionalControl * 0.3) +
          (avgSetupQuality * 0.3)
        )
      }

      // Performance metrics
      const winningTrades = trades.filter(t => (t.net_pnl || 0) > 0)
      const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0
      const totalPnl = trades.reduce((sum, t) => sum + (t.net_pnl || 0), 0)

      return {
        total_trades: trades.length,
        trades_with_journals: tradesWithJournals.length,
        discipline_score: disciplineScore,
        rule_adherence_rate: Math.round(ruleAdherenceRate * 100) / 100,
        fomo_trade_count: fomoTrades.length,
        emotional_volatility: Math.round(emotionalVolatility * 100) / 100,
        win_rate: Math.round(winRate * 100) / 100,
        total_pnl: Math.round(totalPnl * 100) / 100,
      }
    }

    const currentWeekMetrics = calculateMetrics(currentWeekTrades || [])
    const previousWeekMetrics = calculateMetrics(previousWeekTrades || [])

    // Generate insights
    const insights: string[] = []
    
    // Trading volume insight
    if (currentWeekMetrics.total_trades > previousWeekMetrics.total_trades) {
      insights.push(`📈 You increased your trading activity by ${currentWeekMetrics.total_trades - previousWeekMetrics.total_trades} trades this week.`)
    } else if (currentWeekMetrics.total_trades < previousWeekMetrics.total_trades) {
      insights.push(`📉 You traded ${previousWeekMetrics.total_trades - currentWeekMetrics.total_trades} fewer times this week.`)
    }

    // Discipline insight
    const disciplineChange = currentWeekMetrics.discipline_score - previousWeekMetrics.discipline_score
    if (disciplineChange > 10) {
      insights.push(`✅ Great improvement! Your discipline score increased by ${disciplineChange} points.`)
    } else if (disciplineChange < -10) {
      insights.push(`⚠️ Your discipline score decreased by ${Math.abs(disciplineChange)} points. Review your trading plan adherence.`)
    } else if (currentWeekMetrics.discipline_score >= 80) {
      insights.push(`⭐ Excellent discipline! You maintained a high score of ${currentWeekMetrics.discipline_score}.`)
    }

    // FOMO insight
    if (currentWeekMetrics.fomo_trade_count === 0 && previousWeekMetrics.fomo_trade_count > 0) {
      insights.push(`🎯 Perfect! No FOMO trades this week, down from ${previousWeekMetrics.fomo_trade_count} last week.`)
    } else if (currentWeekMetrics.fomo_trade_count > previousWeekMetrics.fomo_trade_count) {
      insights.push(`⚠️ FOMO trades increased to ${currentWeekMetrics.fomo_trade_count}. Take a step back and focus on your strategy.`)
    }

    // Journaling insight
    const journalingRate = currentWeekMetrics.total_trades > 0 
      ? (currentWeekMetrics.trades_with_journals / currentWeekMetrics.total_trades) * 100 
      : 0
    
    if (journalingRate === 100 && currentWeekMetrics.total_trades > 0) {
      insights.push(`📝 Outstanding! You journaled 100% of your trades this week.`)
    } else if (journalingRate < 50) {
      insights.push(`📝 Try to journal more consistently. You only journaled ${Math.round(journalingRate)}% of trades.`)
    }

    // Performance insight
    const pnlChange = currentWeekMetrics.total_pnl - previousWeekMetrics.total_pnl
    if (currentWeekMetrics.total_pnl > 0 && currentWeekMetrics.total_pnl > previousWeekMetrics.total_pnl) {
      insights.push(`💰 Profitable week! Your P&L improved by $${Math.abs(pnlChange).toFixed(2)}.`)
    } else if (currentWeekMetrics.total_pnl < 0 && currentWeekMetrics.total_pnl < previousWeekMetrics.total_pnl) {
      insights.push(`📊 Focus on discipline. Your P&L declined by $${Math.abs(pnlChange).toFixed(2)} this week.`)
    }

    // Emotional control insight
    if (currentWeekMetrics.emotional_volatility < previousWeekMetrics.emotional_volatility) {
      insights.push(`🧘 Improved emotional control! Your emotional volatility decreased.`)
    } else if (currentWeekMetrics.emotional_volatility > 2.5) {
      insights.push(`🧠 High emotional volatility detected. Consider meditation or breaks between trades.`)
    }

    const report = {
      report_date: currentWeekEnd.toISOString().split('T')[0],
      current_week: {
        start: currentWeekStart.toISOString().split('T')[0],
        end: currentWeekEnd.toISOString().split('T')[0],
        metrics: currentWeekMetrics,
      },
      previous_week: {
        start: previousWeekStart.toISOString().split('T')[0],
        end: previousWeekEnd.toISOString().split('T')[0],
        metrics: previousWeekMetrics,
      },
      insights,
      summary: insights.length > 0 
        ? `This week you made ${currentWeekMetrics.total_trades} trades with a discipline score of ${currentWeekMetrics.discipline_score}/100.`
        : 'Complete more trades with journals to generate meaningful insights.'
    }

    return NextResponse.json({ data: report })

  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly report' },
      { status: 500 }
    )
  }
}
