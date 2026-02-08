import { useState, useCallback } from 'react'

export interface AIAnalysisResult {
  trade_id: string
  analysis: {
    pattern_recognition: string
    emotional_insights: string
    improvement_suggestions: string
    risk_assessment: string
  }
  analyzed_at: string
}

export function useAIAnalysis() {
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AIAnalysisResult | null>(null)

  const analyzeTradeJournal = useCallback(async (tradeId: string) => {
    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/analyze-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tradeId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze trade')
      }

      const data = await response.json()
      setResult(data.data)
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('Failed to analyze trade:', err)
      throw err
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    analyzing,
    error,
    result,
    analyzeTradeJournal,
    clearResult,
  }
}
