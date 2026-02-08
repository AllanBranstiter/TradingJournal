'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface PsychologyMetrics {
  period_start: string
  period_end: string
  total_trades: number
  trades_with_journals: number
  discipline_score: number
  rule_adherence_rate: number
  fomo_trade_count: number
  revenge_trade_count: number
  most_common_pre_trade_emotion: string | null
  most_common_post_trade_emotion: string | null
  emotional_volatility: number
  disciplined_trade_win_rate: number
  fomo_trade_win_rate: number
  emotion_performance: any[]
}

export default function PsychologyPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [metrics, setMetrics] = useState<PsychologyMetrics | null>(null)

  const loadMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/psychology/metrics?period=${period}`)
      const data = await response.json()
      setMetrics(data.data)
    } catch (error) {
      console.error('Failed to load psychology metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  const getDisciplineColor = (score: number) => {
    if (score >= 80) return 'text-accent-profit'
    if (score >= 60) return 'text-accent-info'
    if (score >= 40) return 'text-accent-warning'
    return 'text-accent-loss'
  }

  const getDisciplineLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  // Emotion badge colors
  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      confident: 'bg-accent-profit/20 text-accent-profit border-accent-profit/50',
      anxious: 'bg-accent-warning/20 text-accent-warning border-accent-warning/50',
      neutral: 'bg-accent-info/20 text-accent-info border-accent-info/50',
      FOMO: 'bg-accent-loss/20 text-accent-loss border-accent-loss/50',
      revenge: 'bg-accent-loss/20 text-accent-loss border-accent-loss/50',
      overconfident: 'bg-accent-warning/20 text-accent-warning border-accent-warning/50',
      relieved: 'bg-accent-profit/20 text-accent-profit border-accent-profit/50',
      regret: 'bg-accent-loss/20 text-accent-loss border-accent-loss/50',
      validated: 'bg-accent-profit/20 text-accent-profit border-accent-profit/50',
      frustrated: 'bg-accent-loss/20 text-accent-loss border-accent-loss/50',
      proud: 'bg-accent-profit/20 text-accent-profit border-accent-profit/50',
      disappointed: 'bg-accent-warning/20 text-accent-warning border-accent-warning/50',
    }
    return colors[emotion] || 'bg-background-tertiary/20 text-text-secondary border-background-tertiary'
  }

  // Chart colors
  const COLORS = {
    profit: '#10b981',
    loss: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    purple: '#8b5cf6',
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Trading Psychology</h1>
          <p className="mt-2 text-text-secondary">Track your emotional state and mental patterns</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Trading Psychology
          </h1>
          <p className="mt-2 text-text-secondary">
            Track your emotional state and mental patterns during trades
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-background-secondary border-background-tertiary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Discipline Score */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Discipline Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl font-bold font-mono ${getDisciplineColor(metrics?.discipline_score || 0)}`}>
                {metrics?.discipline_score || 0}
              </span>
              <span className="text-xl text-text-tertiary">/100</span>
            </div>
            <p className={`mt-2 text-sm font-medium ${getDisciplineColor(metrics?.discipline_score || 0)}`}>
              {getDisciplineLabel(metrics?.discipline_score || 0)}
            </p>
            <Progress 
              value={metrics?.discipline_score || 0} 
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        {/* Rule Adherence */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Rule Adherence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl font-bold font-mono ${(metrics?.rule_adherence_rate || 0) >= 70 ? 'text-accent-profit' : 'text-accent-warning'}`}>
                {metrics?.rule_adherence_rate?.toFixed(1) || 0}%
              </span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {metrics?.trades_with_journals || 0} trades with journals
            </p>
          </CardContent>
        </Card>

        {/* Emotional Volatility */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Emotional Volatility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl font-bold font-mono ${(metrics?.emotional_volatility || 0) < 2 ? 'text-accent-profit' : 'text-accent-warning'}`}>
                {metrics?.emotional_volatility?.toFixed(2) || 0}
              </span>
            </div>
            <p className="mt-2 text-sm text-text-secondary">
              {(metrics?.emotional_volatility || 0) < 2 ? 'Stable emotions' : 'High variance'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Emotional Patterns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Most Common Emotions */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader>
            <CardTitle className="text-text-primary">Common Emotional States</CardTitle>
            <CardDescription className="text-text-secondary">
              Your typical emotions before and after trades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-text-secondary">Pre-Trade</p>
              {metrics?.most_common_pre_trade_emotion ? (
                <Badge className={getEmotionColor(metrics.most_common_pre_trade_emotion)}>
                  {metrics.most_common_pre_trade_emotion}
                </Badge>
              ) : (
                <p className="text-sm text-text-tertiary">No data yet</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-text-secondary">Post-Trade</p>
              {metrics?.most_common_post_trade_emotion ? (
                <Badge className={getEmotionColor(metrics.most_common_post_trade_emotion)}>
                  {metrics.most_common_post_trade_emotion}
                </Badge>
              ) : (
                <p className="text-sm text-text-tertiary">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Problem Areas */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader>
            <CardTitle className="text-text-primary">Problem Areas</CardTitle>
            <CardDescription className="text-text-secondary">
              Trades driven by problematic emotions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">FOMO Trades</span>
              <Badge variant="loss" className="font-mono">
                {metrics?.fomo_trade_count || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Revenge Trades</span>
              <Badge variant="loss" className="font-mono">
                {metrics?.revenge_trade_count || 0}
              </Badge>
            </div>
            {(metrics?.fomo_trade_count || 0) + (metrics?.revenge_trade_count || 0) === 0 && (
              <p className="text-sm text-accent-profit">✅ Great job! No problematic trades detected.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <CardTitle className="text-text-primary">Discipline vs Performance</CardTitle>
          <CardDescription className="text-text-secondary">
            Win rate comparison: disciplined trades vs FOMO trades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Disciplined Trades',
                  'Win Rate': metrics?.disciplined_trade_win_rate || 0,
                  fill: COLORS.profit
                },
                {
                  name: 'FOMO Trades',
                  'Win Rate': metrics?.fomo_trade_win_rate || 0,
                  fill: COLORS.loss
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#252e42" />
              <XAxis dataKey="name" stroke="#8b92a7" />
              <YAxis stroke="#8b92a7" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#141b2d', 
                  border: '1px solid #1f2940',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="Win Rate" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {metrics?.disciplined_trade_win_rate && metrics?.fomo_trade_win_rate && (
            <div className="mt-4 text-center">
              <p className="text-sm text-text-secondary">
                {metrics.disciplined_trade_win_rate > metrics.fomo_trade_win_rate ? (
                  <span className="text-accent-profit">
                    ✅ Your disciplined trades perform {(metrics.disciplined_trade_win_rate - metrics.fomo_trade_win_rate).toFixed(1)}% better!
                  </span>
                ) : (
                  <span className="text-accent-warning">
                    ⚠️ Consider following your plan more consistently
                  </span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {(metrics?.total_trades || 0) < 10 && (
        <Card className="border-accent-warning/20 bg-accent-warning/5">
          <CardContent className="py-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium text-text-primary">Build Your Data</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Log at least 10 trades with pre and post-trade journals to see meaningful psychology insights.
                  You have {metrics?.trades_with_journals || 0} journaled trades so far.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
