'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimeHeatmap } from '@/components/analytics/TimeHeatmap'
import { AvoidPatternCard } from '@/components/analytics/AvoidPatternCard'
import { BestWorstTimesPanel } from '@/components/analytics/BestWorstTimesPanel'
import { MarketCorrelationChart } from '@/components/analytics/MarketCorrelationChart'
import { useTimeAnalytics } from '@/lib/hooks/useTimeAnalytics'
import { Calendar, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

export default function AdvancedAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'hour'>('day')
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  const { avoidPatterns } = useTimeAnalytics({
    period: selectedPeriod,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Discover patterns in your trading performance across time and market conditions
        </p>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="time-analysis" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="time-analysis" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Analysis
          </TabsTrigger>
          <TabsTrigger value="market-context" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Context
          </TabsTrigger>
        </TabsList>

        {/* Time Analysis Tab */}
        <TabsContent value="time-analysis" className="space-y-6">
          {/* Date Range Filter Section - Future Enhancement */}
          {/* Can add DateRangePicker component here later */}

          {/* Avoid Patterns Section */}
          {avoidPatterns && avoidPatterns.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold">Patterns to Avoid</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {avoidPatterns.map((pattern, idx) => (
                  <AvoidPatternCard key={idx} pattern={pattern} />
                ))}
              </div>
            </div>
          )}

          {/* Time Performance Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Time Performance Heatmap</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('day')}
                >
                  By Day
                </Button>
                <Button
                  variant={selectedPeriod === 'hour' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('hour')}
                >
                  By Hour
                </Button>
              </div>
            </div>

            <TimeHeatmap
              period={selectedPeriod}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* Best and Worst Times */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Best & Worst Trading Times</h2>
            <BestWorstTimesPanel
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">How to Use Time Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • <strong>Heatmap:</strong> Darker green = better performance, red = poor performance
              </p>
              <p>
                • <strong>Avoid Patterns:</strong> Times with consistently poor results (&lt;40% win rate)
              </p>
              <p>
                • <strong>Best Times:</strong> Focus your trading during these high-performing periods
              </p>
              <p>
                • <strong>Sample Size:</strong> Patterns with fewer than 5 trades are shown with reduced opacity
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Context Tab */}
        <TabsContent value="market-context" className="space-y-6">
          {/* Market Correlation Charts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Market Condition Performance</h2>
            </div>

            <MarketCorrelationChart
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Understanding Market Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                • <strong>SPY Trends:</strong> How your trades perform in different market environments (uptrend, downtrend, sideways, choppy)
              </p>
              <p>
                • <strong>Sector Analysis:</strong> Which sectors you perform best in
              </p>
              <p>
                • <strong>Green bars:</strong> Profitable conditions with ≥50% win rate
              </p>
              <p>
                • <strong>Orange bars:</strong> Profitable but with &lt;50% win rate (large winners)
              </p>
              <p>
                • <strong>Red bars:</strong> Unprofitable conditions - consider avoiding these
              </p>
              <p className="pt-2 italic">
                Tip: Add SPY trend and sector context to your pre-trade journals for more insights
              </p>
            </CardContent>
          </Card>

          {/* Future Enhancement Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              <CardDescription>
                Filter trades by specific market conditions (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Future updates will allow you to filter your trades page by SPY trends and sectors
                to analyze specific market conditions in detail.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
