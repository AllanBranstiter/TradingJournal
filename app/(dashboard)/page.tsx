'use client'

import { useMetrics } from '@/lib/hooks/useMetrics'
import { useTrades } from '@/lib/hooks/useTrades'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EquityCurve } from '@/components/dashboard/EquityCurve'
import { RecentTrades } from '@/components/dashboard/RecentTrades'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { DetailedMetrics } from '@/components/dashboard/DetailedMetrics'
import { StrategyBreakdown } from '@/components/dashboard/StrategyBreakdown'
import { formatCurrency, formatPercent } from '@/lib/utils/formatting'
import { DollarSign, TrendingUp, Hash, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
  const { metrics, loading: metricsLoading } = useMetrics()
  const { trades, loading: tradesLoading } = useTrades()
  
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">Your trading performance at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/trades/new">Log Trade</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/import">Import CSV</Link>
          </Button>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total P&L"
          value={formatCurrency(metrics?.totalPnL || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          trend={metrics && metrics.totalPnL > 0 ? 'up' : metrics && metrics.totalPnL < 0 ? 'down' : 'neutral'}
          loading={metricsLoading}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(metrics?.winRate || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={metrics && metrics.winRate >= 50 ? 'up' : 'neutral'}
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Trades"
          value={metrics?.totalTrades || 0}
          icon={<Hash className="h-5 w-5" />}
          trend="neutral"
          loading={metricsLoading}
        />
        <MetricCard
          title="Current Streak"
          value={`${metrics?.currentStreak || 0}${(metrics?.currentStreak || 0) > 0 ? ' 🔥' : ''}`}
          icon={<Flame className="h-5 w-5" />}
          trend={metrics && metrics.currentStreak > 0 ? 'up' : metrics && metrics.currentStreak < 0 ? 'down' : 'neutral'}
          loading={metricsLoading}
        />
      </div>
      
      {/* Detailed Metrics */}
      <DetailedMetrics 
        metrics={metrics ? {
          avgWin: metrics.avgWin,
          avgLoss: metrics.avgLoss,
          largestWin: metrics.largestWin,
          largestLoss: metrics.largestLoss,
          profitFactor: metrics.profitFactor,
          expectancy: metrics.expectancy,
          avgRR: metrics.avgRR,
        } : null}
        loading={metricsLoading}
      />
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-background-secondary border-background-tertiary">
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityCurve trades={trades} loading={tradesLoading} />
          </CardContent>
        </Card>
        
        <Card className="bg-background-secondary border-background-tertiary">
          <CardHeader>
            <CardTitle>Wins vs Losses</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart trades={trades} loading={tradesLoading} />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Trades */}
      <Card className="bg-background-secondary border-background-tertiary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trades</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/trades">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <RecentTrades trades={trades?.slice(0, 5)} loading={tradesLoading} />
        </CardContent>
      </Card>

      {/* Strategy Breakdown */}
      <Card className="bg-background-secondary border-background-tertiary">
        <CardHeader>
          <CardTitle>Strategy Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <StrategyBreakdown trades={trades} loading={tradesLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
