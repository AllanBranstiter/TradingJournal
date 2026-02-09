'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/lib/hooks/use-toast'
import type { 
  SpyConditionData, 
  SectorMetrics, 
  MarketCorrelationResponse 
} from '@/lib/utils/market-analysis'

interface UseMarketCorrelationOptions {
  startDate?: string
  endDate?: string
  groupBy?: 'spy_trend' | 'sector' | 'both'
  autoFetch?: boolean
}

interface UseMarketCorrelationReturn {
  spyTrending: SpyConditionData
  sectors: SectorMetrics[]
  summary: {
    bestSpyCondition: string
    worstSpyCondition: string
    bestSector: string
    worstSector: string
  }
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useMarketCorrelation(
  options: UseMarketCorrelationOptions = {}
): UseMarketCorrelationReturn {
  const { groupBy = 'both', startDate, endDate, autoFetch = true } = options
  const { toast } = useToast()

  const [spyTrending, setSpyTrending] = useState<SpyConditionData>({
    uptrend: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 },
    downtrend: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 },
    sideways: { winRate: 0, profitFactor: 0, avgPnl: 0, tradeCount: 0 }
  })
  const [sectors, setSectors] = useState<SectorMetrics[]>([])
  const [summary, setSummary] = useState({
    bestSpyCondition: 'N/A',
    worstSpyCondition: 'N/A',
    bestSector: 'N/A',
    worstSector: 'N/A'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ groupBy })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/analytics/market-correlation?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch market correlation data')
      }

      const data: MarketCorrelationResponse = await response.json()
      
      setSpyTrending(data.spyTrending)
      setSectors(data.sectors)
      setSummary(data.summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market correlation'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [groupBy, startDate, endDate, toast])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return {
    spyTrending,
    sectors,
    summary,
    loading,
    error,
    refetch: fetchData,
  }
}
