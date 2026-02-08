'use client'

import { useState, useEffect, useCallback } from 'react'
import { Strategy } from '@/lib/supabase/types'
import { StrategyInput } from '@/lib/validation/trade'
import { toast } from '@/lib/hooks/use-toast'

interface UseStrategiesReturn {
  strategies: Strategy[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createStrategy: (data: StrategyInput) => Promise<Strategy | null>
}

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/strategies')
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to fetch strategies')
      }

      const { data } = await res.json()
      setStrategies(data || [])
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
  }, [])

  useEffect(() => {
    fetchStrategies()
  }, [fetchStrategies])

  const createStrategy = async (data: StrategyInput): Promise<Strategy | null> => {
    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create strategy')
      }

      const { data: createdStrategy } = await res.json()

      // Add to local state
      setStrategies(prev => [...prev, createdStrategy])

      toast({
        title: 'Success',
        description: 'Strategy created successfully',
        variant: 'success',
      })

      return createdStrategy
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create strategy'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }

  return {
    strategies,
    loading,
    error,
    refetch: fetchStrategies,
    createStrategy,
  }
}
