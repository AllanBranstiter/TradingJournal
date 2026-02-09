'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTimeAnalytics, TimeSlotData } from '@/lib/hooks/useTimeAnalytics'
import { interpolateRgb } from 'd3-interpolate'
import { scaleLinear } from 'd3-scale'

interface TimeHeatmapProps {
  period: 'day' | 'hour'
  startDate?: string
  endDate?: string
  onCellClick?: (data: TimeSlotData) => void
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TRADING_HOURS = Array.from({ length: 8 }, (_, i) => i + 9) // 9am - 4pm

export function TimeHeatmap({ period, startDate, endDate, onCellClick }: TimeHeatmapProps) {
  const { heatmapData, loading, error } = useTimeAnalytics({
    period,
    startDate,
    endDate,
  })

  // Color scale from red (0%) -> yellow (50%) -> green (100%)
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 40, 60, 100])
      .range(['#ef4444', '#f59e0b', '#f59e0b', '#10b981'])
      .interpolate(interpolateRgb)
  }, [])

  const getCellColor = (winRate: number, tradeCount: number) => {
    const baseColor = colorScale(winRate)
    // Lower opacity for cells with < 5 trades
    return tradeCount < 5 ? `${baseColor}4D` : baseColor // 4D = 30% opacity in hex
  }

  const getCellData = (day: number, hour?: number): TimeSlotData | null => {
    if (period === 'day') {
      return heatmapData.find((d) => d.dayOfWeek === day) || null
    } else {
      return heatmapData.find((d) => d.dayOfWeek === day && d.hour === hour) || null
    }
  }

  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : ''
    return `${sign}$${pnl.toFixed(0)}`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load heatmap data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No trading data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Time Performance Heatmap
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({period === 'day' ? 'By Day of Week' : 'By Hour & Day'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {period === 'day' ? (
          // Day view: Single row with 7 columns
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {DAY_LABELS.map((day, idx) => {
                const data = getCellData(idx)
                return (
                  <div key={idx} className="text-center">
                    <div className="text-xs font-medium mb-1 text-muted-foreground">{day}</div>
                    <div
                      className="relative rounded-lg p-4 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      style={{
                        backgroundColor: data
                          ? getCellColor(data.winRate, data.tradeCount)
                          : '#1f2940',
                      }}
                      onClick={() => data && onCellClick?.(data)}
                      title={
                        data
                          ? `Win Rate: ${data.winRate.toFixed(1)}%\nTrades: ${data.tradeCount}\nAvg P&L: ${formatPnl(data.avgPnl)}`
                          : 'No data'
                      }
                    >
                      {data ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-white">
                            {data.winRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-white/80">{data.tradeCount} trades</div>
                          <div className="text-xs font-semibold text-white">
                            {formatPnl(data.avgPnl)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No data</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <HeatmapLegend />
          </div>
        ) : (
          // Hour view: Grid with days as rows, hours as columns
          <div className="space-y-4 overflow-x-auto">
            <div className="min-w-max">
              {/* Header row with hour labels */}
              <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}>
                <div /> {/* Empty corner cell */}
                {TRADING_HOURS.map((hour) => (
                  <div key={hour} className="text-xs font-medium text-center text-muted-foreground">
                    {hour % 12 || 12}
                    {hour >= 12 ? 'pm' : 'am'}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {DAY_LABELS.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className="grid gap-1 mb-1"
                  style={{ gridTemplateColumns: '80px repeat(8, 1fr)' }}
                >
                  <div className="text-xs font-medium flex items-center text-muted-foreground">
                    {day}
                  </div>
                  {TRADING_HOURS.map((hour) => {
                    const data = getCellData(dayIdx, hour)
                    return (
                      <div
                        key={hour}
                        className="relative rounded p-2 cursor-pointer hover:ring-2 hover:ring-primary transition-all min-h-[60px] flex items-center justify-center"
                        style={{
                          backgroundColor: data
                            ? getCellColor(data.winRate, data.tradeCount)
                            : '#1f2940',
                        }}
                        onClick={() => data && onCellClick?.(data)}
                        title={
                          data
                            ? `Win Rate: ${data.winRate.toFixed(1)}%\nTrades: ${data.tradeCount}\nAvg P&L: ${formatPnl(data.avgPnl)}`
                            : 'No data'
                        }
                      >
                        {data ? (
                          <div className="text-center">
                            <div className="text-sm font-bold text-white">
                              {data.winRate.toFixed(0)}%
                            </div>
                            <div className="text-[10px] text-white/70">{data.tradeCount}t</div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">-</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <HeatmapLegend />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HeatmapLegend() {
  return (
    <div className="flex items-center justify-center gap-4 pt-2 border-t">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
        <span className="text-xs text-muted-foreground">Poor (&lt;40%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
        <span className="text-xs text-muted-foreground">Average (40-60%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground">Good (&gt;60%)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground">&lt;5 trades</span>
      </div>
    </div>
  )
}
