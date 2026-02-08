'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercent } from '@/lib/utils/formatting'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Target, Brain, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Trade {
  id: string
  strategy_id: string | null
  net_pnl: number | null
  actual_rr: number | null
  strategies?: {
    id: string
    name: string
  } | null
  pre_trade_journals?: Array<{
    emotional_state?: string[]
    setup_quality?: number
  }>
  post_trade_journals?: Array<{
    followed_plan?: boolean
    emotional_state?: string[]
  }>
}

interface StrategyBreakdownProps {
  trades?: Trade[]
  loading?: boolean
}

interface StrategyStats {
  strategyId: string
  strategyName: string
  tradeCount: number
  winCount: number
  lossCount: number
  winRate: number
  totalPnL: number
  avgRR: number
  disciplineScore: number
  tradesWithJournals: number
  mostCommonEmotion: string | null
}

export function StrategyBreakdown({ trades = [], loading = false }: StrategyBreakdownProps) {
  const strategyStats = useMemo(() => {
    if (!trades || trades.length === 0) return []

    // Group trades by strategy
    const strategyMap = new Map<string, StrategyStats>()

    trades.forEach(trade => {
      // Skip trades without strategy or PnL
      if (!trade.strategy_id || trade.net_pnl === null) return

      const strategyId = trade.strategy_id
      const strategyName = trade.strategies?.name || 'Unknown Strategy'

      if (!strategyMap.has(strategyId)) {
        strategyMap.set(strategyId, {
          strategyId,
          strategyName,
          tradeCount: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
          totalPnL: 0,
          avgRR: 0,
          disciplineScore: 0,
          tradesWithJournals: 0,
          mostCommonEmotion: null,
        })
      }

      const stats = strategyMap.get(strategyId)!
      stats.tradeCount++
      stats.totalPnL += trade.net_pnl

      if (trade.net_pnl > 0) {
        stats.winCount++
      } else if (trade.net_pnl < 0) {
        stats.lossCount++
      }

      // Track journal data
      if (trade.pre_trade_journals?.[0] && trade.post_trade_journals?.[0]) {
        stats.tradesWithJournals++
      }
    })

    // Calculate win rates, average R:R, and psychology metrics
    const statsArray = Array.from(strategyMap.values()).map(stats => {
      stats.winRate = stats.tradeCount > 0 ? (stats.winCount / stats.tradeCount) * 100 : 0

      const strategyTrades = trades.filter(t => t.strategy_id === stats.strategyId)
      
      // Calculate average R:R for this strategy
      const tradesWithRR = strategyTrades.filter(t => t.actual_rr)
      stats.avgRR = tradesWithRR.length > 0
        ? tradesWithRR.reduce((sum, t) => sum + (t.actual_rr || 0), 0) / tradesWithRR.length
        : 0

      // Calculate discipline score for this strategy
      const journaledTrades = strategyTrades.filter(t => 
        t.pre_trade_journals?.[0] && t.post_trade_journals?.[0]
      )

      if (journaledTrades.length > 0) {
        const followedPlanCount = journaledTrades.filter(t => 
          t.post_trade_journals?.[0]?.followed_plan === true
        ).length
        const ruleAdherence = (followedPlanCount / journaledTrades.length) * 100

        const setupQualities = journaledTrades
          .map(t => t.pre_trade_journals?.[0]?.setup_quality)
          .filter((q): q is number => q !== null && q !== undefined)
        const avgSetupQuality = setupQualities.length > 0
          ? (setupQualities.reduce((a, b) => a + b, 0) / setupQualities.length) * 20
          : 50

        stats.disciplineScore = Math.round(
          (ruleAdherence * 0.5) + (avgSetupQuality * 0.5)
        )
      }

      // Find most common emotion for this strategy
      const emotions: string[] = []
      journaledTrades.forEach(t => {
        if (t.pre_trade_journals?.[0]?.emotional_state) {
          emotions.push(...t.pre_trade_journals[0].emotional_state)
        }
      })

      if (emotions.length > 0) {
        const emotionCounts = emotions.reduce((acc, emotion) => {
          acc[emotion] = (acc[emotion] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        stats.mostCommonEmotion = Object.entries(emotionCounts)
          .sort((a, b) => b[1] - a[1])[0][0]
      }

      return stats
    })

    // Sort by total P&L descending
    return statsArray.sort((a, b) => b.totalPnL - a.totalPnL)
  }, [trades])

  const getDisciplineColor = (score: number) => {
    if (score >= 80) return 'text-accent-profit'
    if (score >= 60) return 'text-accent-info'
    if (score >= 40) return 'text-accent-warning'
    return 'text-accent-loss'
  }

  const getSampleSizeIndicator = (count: number, total: number) => {
    const percentage = (count / total) * 100
    if (percentage >= 80) return { label: 'High confidence', color: 'bg-accent-profit/20 text-accent-profit' }
    if (percentage >= 50) return { label: 'Medium confidence', color: 'bg-accent-info/20 text-accent-info' }
    if (percentage >= 30) return { label: 'Low confidence', color: 'bg-accent-warning/20 text-accent-warning' }
    return { label: 'Insufficient data', color: 'bg-accent-loss/20 text-accent-loss' }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-background-tertiary rounded-lg">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (strategyStats.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No strategy data"
        description="Tag your trades with strategies to see performance breakdown"
        action={{
          label: "View Trades",
          href: "/dashboard/trades"
        }}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strategy</TableHead>
            <TableHead className="text-center">Trades</TableHead>
            <TableHead className="text-center">Win Rate</TableHead>
            <TableHead className="text-right">Total P&L</TableHead>
            <TableHead className="text-center">Avg R:R</TableHead>
            <TableHead className="text-center">Discipline</TableHead>
            <TableHead className="text-center">Top Emotion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategyStats.map((stats) => {
            const sampleSize = getSampleSizeIndicator(stats.tradesWithJournals, stats.tradeCount)
            
            return (
              <TableRow
                key={stats.strategyId}
                className="cursor-pointer hover:bg-background-tertiary/50 transition-colors"
              >
                <TableCell className="font-medium">
                  <Link 
                    href={`/dashboard/trades?strategy=${stats.strategyId}`}
                    className="hover:text-accent-info transition-colors"
                  >
                    {stats.strategyName}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-text-primary font-semibold">{stats.tradeCount}</span>
                      <span className="text-xs text-text-secondary">
                        ({stats.winCount}W / {stats.lossCount}L)
                      </span>
                    </div>
                    {stats.tradesWithJournals > 0 && (
                      <Badge variant="outline" className={cn('text-xs px-1 py-0', sampleSize.color)}>
                        {stats.tradesWithJournals} journaled
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    'font-semibold',
                    stats.winRate >= 50 ? 'text-accent-profit' : 'text-text-secondary'
                  )}>
                    {formatPercent(stats.winRate)}
                  </span>
                </TableCell>
                <TableCell className={cn(
                  'text-right font-mono font-semibold',
                  stats.totalPnL > 0 ? 'text-accent-profit' : stats.totalPnL < 0 ? 'text-accent-loss' : 'text-text-secondary'
                )}>
                  {formatCurrency(stats.totalPnL)}
                </TableCell>
                <TableCell className="text-center font-mono">
                  {stats.avgRR > 0 ? stats.avgRR.toFixed(2) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  {stats.disciplineScore > 0 ? (
                    <div className="flex items-center justify-center gap-1">
                      <Brain className={cn('h-3 w-3', getDisciplineColor(stats.disciplineScore))} />
                      <span className={cn('font-semibold font-mono', getDisciplineColor(stats.disciplineScore))}>
                        {stats.disciplineScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-tertiary">N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {stats.mostCommonEmotion ? (
                    <Badge variant="outline" className="bg-accent-info/10 text-accent-info border-accent-info/30 text-xs">
                      {stats.mostCommonEmotion}
                    </Badge>
                  ) : (
                    <span className="text-xs text-text-tertiary">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-1">
          <Brain className="h-3 w-3" />
          <span>Discipline score based on journaled trades</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span>Click strategy name to filter trades</span>
        </div>
      </div>
    </div>
  )
}
