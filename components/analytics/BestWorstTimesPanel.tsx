'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTimeAnalytics } from '@/lib/hooks/useTimeAnalytics'
import { Trophy, AlertTriangle } from 'lucide-react'

interface BestWorstTimesPanelProps {
  startDate?: string
  endDate?: string
  limit?: number
}

export function BestWorstTimesPanel({ startDate, endDate, limit = 5 }: BestWorstTimesPanelProps) {
  const { bestTimes, worstTimes, loading, error } = useTimeAnalytics({
    startDate,
    endDate,
    autoFetch: true,
  })

  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(0)}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Best & Worst Trading Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Best & Worst Trading Times</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load best/worst times data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayBestTimes = bestTimes.slice(0, limit)
  const displayWorstTimes = worstTimes.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best & Worst Trading Times</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Best Times Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent-profit/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-accent-profit" />
              </div>
              <h3 className="text-lg font-semibold text-accent-profit">Best Times</h3>
            </div>

            {displayBestTimes.length > 0 ? (
              <div className="space-y-2">
                {displayBestTimes.map((time, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-background-tertiary border border-accent-profit/20 hover:border-accent-profit/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{time.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {time.tradeCount} trades
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Win:</span>
                        <span className="font-semibold text-accent-profit">
                          {time.winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Avg:</span>
                        <span className="font-semibold text-accent-profit">
                          {formatPnl(time.avgPnl)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No profitable time slots found
              </div>
            )}
          </div>

          {/* Worst Times Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent-loss/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-accent-loss" />
              </div>
              <h3 className="text-lg font-semibold text-accent-loss">Worst Times</h3>
            </div>

            {displayWorstTimes.length > 0 ? (
              <div className="space-y-2">
                {displayWorstTimes.map((time, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-background-tertiary border border-accent-loss/20 hover:border-accent-loss/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{time.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {time.tradeCount} trades
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Win:</span>
                        <span className="font-semibold text-accent-loss">
                          {time.winRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Avg:</span>
                        <span className="font-semibold text-accent-loss">
                          {formatPnl(time.avgPnl)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No unprofitable time slots found
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
