'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMarketCorrelation } from '@/lib/hooks/useMarketCorrelation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MarketConditionMetrics } from '@/lib/utils/market-analysis'

interface MarketCorrelationChartProps {
  startDate?: string
  endDate?: string
}

const SPY_TREND_LABELS: Record<string, string> = {
  uptrend: 'Uptrend',
  downtrend: 'Downtrend',
  sideways: 'Sideways',
  choppy: 'Choppy'
}

export function MarketCorrelationChart({ startDate, endDate }: MarketCorrelationChartProps) {
  const { spyTrending, sectors, summary, loading, error } = useMarketCorrelation({
    startDate,
    endDate,
    groupBy: 'both'
  })

  // Prepare SPY trend data for chart
  const spyChartData = useMemo(() => {
    return Object.entries(spyTrending)
      .filter(([key, metrics]) => key !== 'choppy' || (metrics && metrics.tradeCount > 0))
      .map(([condition, metrics]) => ({
        condition: SPY_TREND_LABELS[condition] || condition,
        winRate: metrics.winRate,
        tradeCount: metrics.tradeCount,
        avgPnl: metrics.avgPnl,
        profitFactor: metrics.profitFactor
      }))
      .filter(item => item.tradeCount > 0)
  }, [spyTrending])

  // Prepare sector data (already sorted by API)
  const sectorChartData = useMemo(() => {
    return sectors
      .slice(0, 10) // Top 10 sectors
      .map(sector => ({
        sector: sector.sector.charAt(0).toUpperCase() + sector.sector.slice(1),
        winRate: sector.winRate,
        tradeCount: sector.tradeCount,
        avgPnl: sector.avgPnl,
        profitFactor: sector.profitFactor
      }))
  }, [sectors])

  const getBarColor = (winRate: number, avgPnl: number) => {
    if (avgPnl > 0 && winRate >= 50) return '#10b981' // Green - profitable
    if (avgPnl > 0) return '#f59e0b' // Orange - profitable but low win rate
    return '#ef4444' // Red - losing
  }

  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${value.toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>SPY Market Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sector Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Context Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load market correlation data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasSpyData = spyChartData.length > 0
  const hasSectorData = sectorChartData.length > 0

  if (!hasSpyData && !hasSectorData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Context Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No market context data available. Add SPY trend or sector information to your trades.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Insights */}
      {(summary.bestSpyCondition !== 'N/A' || summary.bestSector !== 'N/A') && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.bestSpyCondition !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground">Best Market Condition</p>
                  <p className="text-lg font-semibold capitalize">
                    {summary.bestSpyCondition}
                  </p>
                </div>
              )}
              {summary.bestSector !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground">Top Performing Sector</p>
                  <p className="text-lg font-semibold capitalize">
                    {summary.bestSector}
                  </p>
                </div>
              )}
              {summary.worstSpyCondition !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Challenging Condition
                  </p>
                  <p className="text-lg font-semibold capitalize text-destructive">
                    {summary.worstSpyCondition}
                  </p>
                </div>
              )}
              {summary.worstSector !== 'N/A' && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Weakest Sector
                  </p>
                  <p className="text-lg font-semibold capitalize text-destructive">
                    {summary.worstSector}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SPY Conditions Chart */}
      {hasSpyData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by SPY Market Condition</CardTitle>
            <CardDescription>
              How your trades perform in different market environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={spyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="condition" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="winRate" radius={[8, 8, 0, 0]}>
                  {spyChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry.winRate, entry.avgPnl)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <ChartLegend />
          </CardContent>
        </Card>
      )}

      {/* Sector Performance */}
      {hasSectorData && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Sector</CardTitle>
            <CardDescription>
              Top {sectorChartData.length} sectors ranked by performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sectorChartData.length > 5 ? (
              // Bar chart for many sectors
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorChartData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    type="number"
                    label={{ value: 'Win Rate (%)', position: 'insideBottom', offset: -5 }}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="sector" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={100}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar dataKey="winRate" radius={[0, 8, 8, 0]}>
                    {sectorChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.winRate, entry.avgPnl)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              // Table for few sectors
              <div className="space-y-4">
                {sectorChartData.map((sector, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{
                      backgroundColor: `${getBarColor(sector.winRate, sector.avgPnl)}10`
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{sector.sector}</p>
                      <p className="text-sm text-muted-foreground">{sector.tradeCount} trades</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                        <p className="text-lg font-bold">{sector.winRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg P&L</p>
                        <p className="text-lg font-bold">{formatCurrency(sector.avgPnl)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit Factor</p>
                        <p className="text-lg font-bold">{sector.profitFactor.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {sectorChartData.length > 5 && <ChartLegend />}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  const formatCurrency = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}$${value.toFixed(0)}`
  }

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
      <p className="font-semibold">{data.condition || data.sector}</p>
      <div className="space-y-0.5 text-sm">
        <p>Win Rate: <span className="font-semibold">{data.winRate.toFixed(1)}%</span></p>
        <p>Trades: <span className="font-semibold">{data.tradeCount}</span></p>
        <p>Avg P&L: <span className="font-semibold">{formatCurrency(data.avgPnl)}</span></p>
        <p>Profit Factor: <span className="font-semibold">{data.profitFactor.toFixed(2)}</span></p>
      </div>
    </div>
  )
}

function ChartLegend() {
  return (
    <div className="flex items-center justify-center gap-4 pt-4 border-t mt-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
        <span className="text-xs text-muted-foreground">Profitable (≥50% WR)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
        <span className="text-xs text-muted-foreground">Profitable (&lt;50% WR)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
        <span className="text-xs text-muted-foreground">Losing</span>
      </div>
    </div>
  )
}
