'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export interface AvoidPattern {
  timeSlot: string
  winRate: number
  avgPnl: number
  tradeCount: number
  message: string
}

interface AvoidPatternCardProps {
  pattern: AvoidPattern
  onViewTrades?: () => void
}

export function AvoidPatternCard({ pattern, onViewTrades }: AvoidPatternCardProps) {
  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(2)}`
  }

  return (
    <Card className="border-l-4 border-l-accent-warning bg-background-tertiary">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-accent-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-accent-warning mb-1">
              Avoid Trading Pattern Detected
            </h3>
            <p className="text-sm text-foreground">{pattern.message}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-background-secondary">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className="text-lg font-bold text-accent-loss">
              {pattern.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Avg Loss</div>
            <div className="text-lg font-bold text-accent-loss">
              {formatPnl(pattern.avgPnl)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Trades</div>
            <div className="text-lg font-bold text-foreground">
              {pattern.tradeCount}
            </div>
          </div>
        </div>

        {/* View Trades Button */}
        {onViewTrades && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewTrades}
            className="w-full hover:bg-accent-warning/10 hover:border-accent-warning"
          >
            View Trades in This Time Slot
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
