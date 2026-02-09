'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/hooks/use-toast'

export interface TimeSlotData {
  dayOfWeek?: number
  hour?: number
  winRate: number
  tradeCount: number
  avgPnl: number
  totalPnl: number
}

export interface AvoidPattern {
  timeSlot: string
  winRate: number
  avgPnl: number
  tradeCount: number
  message: string
}

export interface TimeSlotLabel {
  label: string
  winRate: number
  avgPnl: number
  tradeCount: number
  totalPnl: number
  period: string
}

interface UseTimeAnalyticsOptions {
  period?: 'day' | 'hour'
  startDate?: string
  endDate?: string
  autoFetch?: boolean
}

interface UseTimeAnalyticsReturn {
  heatmapData: TimeSlotData[]
  avoidPatterns: AvoidPattern[]
  bestTimes: TimeSlotLabel[]
  worstTimes: TimeSlotLabel[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTimeAnalytics(options: UseTimeAnalyticsOptions = {}): UseTimeAnalyticsReturn {
  const { period = 'day', startDate, endDate, autoFetch = true } = options
  const { toast } = useToast()

  const [heatmapData, setHeatmapData] = useState<TimeSlotData[]>([])
  const [avoidPatterns, setAvoidPatterns] = useState<AvoidPattern[]>([])
  const [bestTimes, setBestTimes] = useState<TimeSlotLabel[]>([])
  const [worstTimes, setWorstTimes] = useState<TimeSlotLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const heatmapParams = new URLSearchParams({ period })
      if (startDate) heatmapParams.append('startDate', startDate)
      if (endDate) heatmapParams.append('endDate', endDate)

      const bestWorstParams = new URLSearchParams()
      if (startDate) bestWorstParams.append('startDate', startDate)
      if (endDate) bestWorstParams.append('endDate', endDate)

      // Fetch heatmap data
      const heatmapResponse = await fetch(`/api/analytics/time-heatmap?${heatmapParams}`)
      if (!heatmapResponse.ok) {
        throw new Error('Failed to fetch heatmap data')
      }
      const heatmapResult = await heatmapResponse.json()
      setHeatmapData(heatmapResult.data || [])
      setAvoidPatterns(heatmapResult.avoidPatterns || [])

      // Fetch best/worst times
      const bestWorstResponse = await fetch(`/api/analytics/best-worst-times?${bestWorstParams}`)
      if (!bestWorstResponse.ok) {
        throw new Error('Failed to fetch best/worst times')
      }
      const bestWorstResult = await bestWorstResponse.json()
      setBestTimes(bestWorstResult.bestTimes || [])
      setWorstTimes(bestWorstResult.worstTimes || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch time analytics'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [period, startDate, endDate, toast])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return {
    heatmapData,
    avoidPatterns,
    bestTimes,
    worstTimes,
    loading,
    error,
    refetch: fetchData,
  }
}
