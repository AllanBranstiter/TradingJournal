'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useGamification } from '@/lib/hooks/useGamification'
import { Trophy, Flame, Target } from 'lucide-react'

export function GamificationWidget() {
  const { data, loading, error } = useGamification()

  if (loading) {
    return (
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null
  }

  // Add defensive null checks for all data properties
  const milestones = data.milestones ?? []
  const badges = data.badges ?? []
  const currentStreak = data.current_streak ?? 0
  const longestStreak = data.longest_streak ?? 0
  const level = data.level ?? 1
  const xp = data.xp ?? 0
  const xpToNextLevel = data.xp_to_next_level ?? 10
  
  const nextMilestone = milestones.find(m => !m.completed)
  const progressPercentage = nextMilestone
    ? (nextMilestone.current_value / nextMilestone.target_value) * 100
    : 0

  return (
    <Card className="border-background-tertiary/20 bg-background-secondary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-text-primary">
          <Trophy className="h-5 w-5 text-accent-warning" />
          Your Progress
        </CardTitle>
        <CardDescription className="text-text-secondary">
          Keep building your trading discipline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="flex items-center justify-between rounded-lg bg-background-tertiary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Current Streak</p>
              <p className="text-2xl font-bold text-text-primary">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
          {longestStreak > 0 && (
            <div className="text-right">
              <p className="text-xs text-text-tertiary">Best Streak</p>
              <p className="text-sm font-semibold text-accent-warning">
                {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          )}
        </div>

        {/* Badges Earned */}
        {badges.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-text-secondary" />
              <p className="text-sm font-medium text-text-secondary">
                Badges Earned ({badges.length})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.slice(0, 6).map((badge) => (
                <Badge
                  key={badge.id}
                  variant="outline"
                  className="bg-accent-profit/10 text-accent-profit border-accent-profit/30"
                  title={badge.description}
                >
                  <span className="mr-1">{badge.icon}</span>
                  {badge.name}
                </Badge>
              ))}
              {badges.length > 6 && (
                <Badge variant="outline" className="bg-background-tertiary/30">
                  +{badges.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Next Milestone */}
        {nextMilestone && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-text-secondary" />
                <p className="text-sm font-medium text-text-secondary">Next Milestone</p>
              </div>
              <p className="text-xs text-text-tertiary">
                {nextMilestone.current_value} / {nextMilestone.target_value}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-text-primary">{nextMilestone.name}</p>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-text-tertiary">{nextMilestone.description}</p>
            </div>
          </div>
        )}

        {/* Level Info */}
        <div className="rounded-lg border border-accent-info/20 bg-accent-info/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-text-primary">Level {level}</p>
            <p className="text-xs text-text-secondary">
              {xp} / {xp + xpToNextLevel} XP
            </p>
          </div>
          <Progress
            value={(xp / (xp + xpToNextLevel)) * 100}
            className="h-1.5"
          />
        </div>
      </CardContent>
    </Card>
  )
}
