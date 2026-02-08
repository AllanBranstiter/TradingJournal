import { useState, useEffect, useCallback } from 'react'

export interface PsychologyMetrics {
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

export type PeriodType = 'week' | 'month' | 'all'

export function usePsychologyMetrics(initialPeriod: PeriodType = 'week') {
  const [data, setData] = useState<PsychologyMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodType>(initialPeriod)

  const fetchMetrics = useCallback(async (currentPeriod: PeriodType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/psychology/metrics?period=${currentPeriod}`)
      if (!response.ok) {
        throw new Error('Failed to fetch psychology metrics')
      }
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Failed to fetch psychology metrics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics(period)
  }, [period, fetchMetrics])

  const changePeriod = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod)
  }, [])

  const refresh = useCallback(() => {
    fetchMetrics(period)
  }, [period, fetchMetrics])

  return {
    data,
    loading,
    error,
    period,
    changePeriod,
    refresh,
  }
}
