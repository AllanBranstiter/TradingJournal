'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils/formatting'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DetailedMetricsProps {
  metrics?: {
    avgWin: number
    avgLoss: number
    largestWin: number
    largestLoss: number
    profitFactor: number
    expectancy: number
    avgRR: number
  } | null
  loading?: boolean
}

export function DetailedMetrics({ metrics, loading = false }: DetailedMetricsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) {
    return (
      <Card className="bg-background-secondary border-background-tertiary">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <Card className="bg-background-secondary border-background-tertiary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Detailed Metrics</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-secondary hover:text-text-primary"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Expand
            </>
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Win */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Average Win</p>
              <p className="text-2xl font-mono font-bold text-accent-profit">
                {formatCurrency(metrics.avgWin)}
              </p>
            </div>

            {/* Average Loss */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Average Loss</p>
              <p className="text-2xl font-mono font-bold text-accent-loss">
                {formatCurrency(metrics.avgLoss)}
              </p>
            </div>

            {/* Largest Win */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Largest Win</p>
              <p className="text-2xl font-mono font-bold text-accent-profit">
                {formatCurrency(metrics.largestWin)}
              </p>
            </div>

            {/* Largest Loss */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Largest Loss</p>
              <p className="text-2xl font-mono font-bold text-accent-loss">
                {formatCurrency(metrics.largestLoss)}
              </p>
            </div>

            {/* Profit Factor */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Profit Factor</p>
              <p className={cn(
                "text-2xl font-mono font-bold",
                metrics.profitFactor >= 1.5 ? 'text-accent-profit' :
                metrics.profitFactor >= 1.0 ? 'text-accent-warning' :
                'text-accent-loss'
              )}>
                {metrics.profitFactor === Infinity ? '∞' : formatNumber(metrics.profitFactor, 2)}
              </p>
              <p className="text-xs text-text-tertiary">
                {metrics.profitFactor >= 1.5 ? 'Excellent' :
                 metrics.profitFactor >= 1.0 ? 'Good' :
                 'Needs improvement'}
              </p>
            </div>

            {/* Expectancy */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Expectancy</p>
              <p className={cn(
                "text-2xl font-mono font-bold",
                metrics.expectancy > 0 ? 'text-accent-profit' :
                metrics.expectancy < 0 ? 'text-accent-loss' :
                'text-text-secondary'
              )}>
                {formatCurrency(metrics.expectancy)}
              </p>
              <p className="text-xs text-text-tertiary">Per trade average</p>
            </div>

            {/* Average R:R */}
            <div className="space-y-1">
              <p className="text-sm text-text-secondary">Average R:R</p>
              <p className={cn(
                "text-2xl font-mono font-bold",
                metrics.avgRR >= 2.0 ? 'text-accent-profit' :
                metrics.avgRR >= 1.0 ? 'text-text-primary' :
                'text-accent-warning'
              )}>
                {metrics.avgRR > 0 ? formatNumber(metrics.avgRR, 2) : '-'}
              </p>
              <p className="text-xs text-text-tertiary">Risk:Reward ratio</p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
