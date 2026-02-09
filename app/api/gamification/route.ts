import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to transform database record to API response format
function transformGamificationData(gamification: any, tradeCount: number = 0) {
  const currentStreak = gamification?.current_journaling_streak ?? 0
  const longestStreak = gamification?.longest_journaling_streak ?? 0
  const badges = gamification?.badges ?? []
  const totalTrades = tradeCount ?? 0
  
  // Calculate level and XP based on total trades
  const level = Math.floor(totalTrades / 10) + 1
  const xp = totalTrades % 10
  const xp_to_next_level = 10
  
  // Generate milestones based on current progress
  const milestones = [
    {
      id: 'first_trade',
      name: 'First Trade',
      description: 'Log your first trade',
      target_value: 1,
      current_value: Math.min(totalTrades, 1),
      completed: totalTrades >= 1
    },
    {
      id: '10_trades',
      name: '10 Trades',
      description: 'Log 10 trades',
      target_value: 10,
      current_value: Math.min(totalTrades, 10),
      completed: totalTrades >= 10
    },
    {
      id: '50_trades',
      name: '50 Trades',
      description: 'Log 50 trades',
      target_value: 50,
      current_value: Math.min(totalTrades, 50),
      completed: totalTrades >= 50
    },
    {
      id: '100_trades',
      name: '100 Trades',
      description: 'Log 100 trades',
      target_value: 100,
      current_value: Math.min(totalTrades, 100),
      completed: totalTrades >= 100
    }
  ]
  
  // Transform badges to match expected format
  const transformedBadges = badges.map((b: any, index: number) => ({
    id: b.badge || `badge_${index}`,
    name: getBadgeName(b.badge),
    description: getBadgeDescription(b.badge),
    icon: getBadgeIcon(b.badge),
    earned_at: b.earned_at
  }))
  
  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_trades: totalTrades,
    total_journal_entries: gamification?.total_days_journaled ?? 0,
    badges: transformedBadges,
    milestones: milestones,
    level: level,
    xp: xp,
    xp_to_next_level: xp_to_next_level
  }
}

// Helper functions for badge display
function getBadgeName(badgeType: string): string {
  const names: { [key: string]: string } = {
    '10_trades': '10 Trades',
    '50_trades': '50 Trades',
    '100_trades': '100 Trades',
    '500_trades': '500 Trades',
    '7_day_streak': '7 Day Streak',
    '30_day_streak': '30 Day Streak',
    '100_day_streak': '100 Day Streak'
  }
  return names[badgeType] || badgeType
}

function getBadgeDescription(badgeType: string): string {
  const descriptions: { [key: string]: string } = {
    '10_trades': 'Logged 10 trades',
    '50_trades': 'Logged 50 trades',
    '100_trades': 'Logged 100 trades',
    '500_trades': 'Logged 500 trades',
    '7_day_streak': 'Maintained a 7-day journaling streak',
    '30_day_streak': 'Maintained a 30-day journaling streak',
    '100_day_streak': 'Maintained a 100-day journaling streak'
  }
  return descriptions[badgeType] || 'Achievement unlocked'
}

function getBadgeIcon(badgeType: string): string {
  const icons: { [key: string]: string } = {
    '10_trades': '🎯',
    '50_trades': '🏆',
    '100_trades': '💎',
    '500_trades': '👑',
    '7_day_streak': '🔥',
    '30_day_streak': '⚡',
    '100_day_streak': '✨'
  }
  return icons[badgeType] || '🏅'
}

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

    // Fetch or create gamification record
    let { data: gamification, error } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If no record exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newRecord, error: createError } = await supabase
        .from('gamification')
        .insert({
          user_id: user.id,
          current_journaling_streak: 0,
          longest_journaling_streak: 0,
          total_trades_logged: 0,
          total_days_journaled: 0,
          badges: []
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: 'Failed to create gamification record' },
          { status: 500 }
        )
      }

      gamification = newRecord
    }

    // Get trade count for level calculation
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Transform data to match expected interface
    const transformedData = transformGamificationData(gamification, tradeCount ?? 0)

    return NextResponse.json({ data: transformedData })

  } catch (error) {
    console.error('Gamification fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gamification data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update streak based on journal activity
    const today = new Date().toISOString().split('T')[0]

    // Get current gamification record
    const { data: current } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!current) {
      return NextResponse.json(
        { error: 'Gamification record not found' },
        { status: 404 }
      )
    }

    let newStreak = current.current_journaling_streak
    let longestStreak = current.longest_journaling_streak
    const lastJournalDate = current.last_journal_date

    // Calculate streak
    if (!lastJournalDate) {
      newStreak = 1
    } else {
      const lastDate = new Date(lastJournalDate)
      const todayDate = new Date(today)
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Same day, don't change streak
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak += 1
      } else {
        // Streak broken, reset to 1
        newStreak = 1
      }
    }

    // Update longest streak
    if (newStreak > longestStreak) {
      longestStreak = newStreak
    }

    // Check for new badges
    const newBadges: any[] = [...(current.badges || [])]
    const badgeTypes = newBadges.map((b: any) => b.badge)

    // Trade milestone badges
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (tradeCount && tradeCount >= 10 && !badgeTypes.includes('10_trades')) {
      newBadges.push({ badge: '10_trades', earned_at: new Date().toISOString() })
    }
    if (tradeCount && tradeCount >= 50 && !badgeTypes.includes('50_trades')) {
      newBadges.push({ badge: '50_trades', earned_at: new Date().toISOString() })
    }
    if (tradeCount && tradeCount >= 100 && !badgeTypes.includes('100_trades')) {
      newBadges.push({ badge: '100_trades', earned_at: new Date().toISOString() })
    }
    if (tradeCount && tradeCount >= 500 && !badgeTypes.includes('500_trades')) {
      newBadges.push({ badge: '500_trades', earned_at: new Date().toISOString() })
    }

    // Journaling streak badges
    if (newStreak >= 7 && !badgeTypes.includes('7_day_streak')) {
      newBadges.push({ badge: '7_day_streak', earned_at: new Date().toISOString() })
    }
    if (newStreak >= 30 && !badgeTypes.includes('30_day_streak')) {
      newBadges.push({ badge: '30_day_streak', earned_at: new Date().toISOString() })
    }
    if (newStreak >= 100 && !badgeTypes.includes('100_day_streak')) {
      newBadges.push({ badge: '100_day_streak', earned_at: new Date().toISOString() })
    }

    // Update gamification record
    const { data: updated, error: updateError } = await supabase
      .from('gamification')
      .update({
        current_journaling_streak: newStreak,
        longest_journaling_streak: longestStreak,
        last_journal_date: today,
        total_trades_logged: tradeCount || 0,
        total_days_journaled: current.total_days_journaled + (lastJournalDate !== today ? 1 : 0),
        badges: newBadges,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update gamification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: updated,
      newBadges: newBadges.filter((b: any) => !badgeTypes.includes(b.badge))
    })

  } catch (error) {
    console.error('Gamification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update gamification data' },
      { status: 500 }
    )
  }
}
