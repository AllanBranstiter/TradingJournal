import { useState, useEffect, useCallback } from 'react'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned_at: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  target_value: number
  current_value: number
  completed: boolean
  completion_date?: string
}

export interface GamificationData {
  current_streak: number
  longest_streak: number
  total_trades: number
  total_journal_entries: number
  badges: Badge[]
  milestones: Milestone[]
  level: number
  xp: number
  xp_to_next_level: number
}

export function useGamification() {
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGamification = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/gamification')
      if (!response.ok) {
        throw new Error('Failed to fetch gamification data')
      }
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Failed to fetch gamification data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGamification()
  }, [fetchGamification])

  const refresh = useCallback(() => {
    fetchGamification()
  }, [fetchGamification])

  return {
    data,
    loading,
    error,
    refresh,
  }
}
