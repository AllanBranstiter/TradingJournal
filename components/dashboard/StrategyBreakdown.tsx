'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatPercent } from '@/lib/utils/formatting'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Target } from 'lucide-react'
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
    })

    // Calculate win rates and average R:R
    const statsArray = Array.from(strategyMap.values()).map(stats => {
      stats.winRate = stats.tradeCount > 0 ? (stats.winCount / stats.tradeCount) * 100 : 0

      // Calculate average R:R for this strategy
      const strategyTrades = trades.filter(t => t.strategy_id === stats.strategyId && t.actual_rr)
      stats.avgRR = strategyTrades.length > 0
        ? strategyTrades.reduce((sum, t) => sum + (t.actual_rr || 0), 0) / strategyTrades.length
        : 0

      return stats
    })

    // Sort by total P&L descending
    return statsArray.sort((a, b) => b.totalPnL - a.totalPnL)
  }, [trades])

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategyStats.map((stats) => (
            <TableRow
              key={stats.strategyId}
              className="cursor-pointer hover:bg-background-tertiary/50 transition-colors"
            >
              <TableCell className="font-medium">{stats.strategyName}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-text-primary font-semibold">{stats.tradeCount}</span>
                  <span className="text-xs text-text-secondary">
                    ({stats.winCount}W / {stats.lossCount}L)
                  </span>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
