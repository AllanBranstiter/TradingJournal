'use client'

import { useState, useEffect } from 'react'

interface Metrics {
  totalPnL: number
  winRate: number
  totalTrades: number
  profitFactor: number
  avgRR: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  expectancy: number
  currentStreak: number
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchMetrics()
  }, [])
  
  async function fetchMetrics() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      const data = await res.json()
      setMetrics(data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching metrics:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return { metrics, loading, error, refetch: fetchMetrics }
}
