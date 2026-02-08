'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trade } from '@/lib/supabase/types'
import { TradeEntryInput } from '@/lib/validation/trade'
import { toast } from '@/lib/hooks/use-toast'

interface TradeWithRelations extends Trade {
  pre_trade_journals?: any[]
  post_trade_journals?: any[]
  strategies?: { id: string; name: string } | null
}

interface UseTradesReturn {
  trades: TradeWithRelations[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createTrade: (data: TradeEntryInput) => Promise<TradeWithRelations | null>
  updateTrade: (id: string, data: Partial<TradeEntryInput>) => Promise<TradeWithRelations | null>
  deleteTrade: (id: string) => Promise<boolean>
  getTrade: (id: string) => Promise<TradeWithRelations | null>
}

interface UseTradesOptions {
  ticker?: string
  direction?: 'long' | 'short'
  strategyId?: string
  startDate?: string
  endDate?: string
  limit?: number
  autoFetch?: boolean
}

export function useTrades(options: UseTradesOptions = {}): UseTradesReturn {
  const [trades, setTrades] = useState<TradeWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      if (options.ticker) params.append('ticker', options.ticker)
      if (options.direction) params.append('direction', options.direction)
      if (options.strategyId) params.append('strategy_id', options.strategyId)
      if (options.startDate) params.append('start_date', options.startDate)
      if (options.endDate) params.append('end_date', options.endDate)
      if (options.limit) params.append('limit', options.limit.toString())

      const res = await fetch(`/api/trades?${params.toString()}`)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch trades')
      }

      const { data } = await res.json()
      setTrades(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [options.ticker, options.direction, options.strategyId, options.startDate, options.endDate, options.limit])

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchTrades()
    }
  }, [fetchTrades, options.autoFetch])

  const createTrade = async (data: TradeEntryInput): Promise<TradeWithRelations | null> => {
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create trade')
      }

      const { data: createdData } = await res.json()
      const createdTrade = createdData.trade

      // Add to local state
      setTrades(prev => [createdTrade, ...prev])

      toast({
        title: 'Success',
        description: 'Trade created successfully',
        variant: 'success',
      })

      return createdTrade
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create trade'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }

  const updateTrade = async (
    id: string,
    data: Partial<TradeEntryInput>
  ): Promise<TradeWithRelations | null> => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update trade')
      }

      const { data: updatedTrade } = await res.json()

      // Update local state
      setTrades(prev =>
        prev.map(trade => (trade.id === id ? updatedTrade : trade))
      )

      toast({
        title: 'Success',
        description: 'Trade updated successfully',
        variant: 'success',
      })

      return updatedTrade
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trade'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }

  const deleteTrade = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete trade')
      }

      // Remove from local state
      setTrades(prev => prev.filter(trade => trade.id !== id))

      toast({
        title: 'Success',
        description: 'Trade deleted successfully',
        variant: 'success',
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trade'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return false
    }
  }

  const getTrade = async (id: string): Promise<TradeWithRelations | null> => {
    try {
      const res = await fetch(`/api/trades/${id}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch trade')
      }

      const { data } = await res.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trade'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }

  return {
    trades,
    loading,
    error,
    refetch: fetchTrades,
    createTrade,
    updateTrade,
    deleteTrade,
    getTrade,
  }
}
