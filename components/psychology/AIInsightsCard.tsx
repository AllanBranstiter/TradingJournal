'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAIAnalysis, AIAnalysisResult } from '@/lib/hooks/useAIAnalysis'
import { Brain, Lightbulb, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface AIInsightsCardProps {
  tradeId: string
  existingAnalysis?: AIAnalysisResult | null
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void
}

export function AIInsightsCard({ 
  tradeId, 
  existingAnalysis, 
  onAnalysisComplete 
}: AIInsightsCardProps) {
  const { analyzing, error, analyzeTradeJournal } = useAIAnalysis()
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(existingAnalysis || null)

  const handleAnalyze = async () => {
    try {
      const result = await analyzeTradeJournal(tradeId)
      setAnalysis(result)
      if (onAnalysisComplete) {
        onAnalysisComplete(result)
      }
    } catch (err) {
      // Error is handled by the hook
    }
  }

  if (analyzing) {
    return (
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Brain className="h-5 w-5 text-accent-info animate-pulse" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Brain className="h-5 w-5 text-accent-info" />
            AI Analysis
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Get AI-powered insights on your trade psychology and decision-making
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-accent-info/20 bg-accent-info/5 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent-info mt-0.5" />
              <div>
                <p className="font-medium text-text-primary mb-1">
                  Unlock AI Insights
                </p>
                <p className="text-sm text-text-secondary mb-3">
                  Our AI will analyze your trade journal and provide personalized insights on:
                </p>
                <ul className="text-sm text-text-secondary space-y-1 ml-4 list-disc">
                  <li>Pattern recognition in your trading behavior</li>
                  <li>Emotional state analysis and recommendations</li>
                  <li>Risk management assessment</li>
                  <li>Actionable improvement suggestions</li>
                </ul>
              </div>
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-accent-loss/20 bg-accent-loss/5 p-3">
              <p className="text-sm text-accent-loss">{error}</p>
            </div>
          )}
          <Button 
            onClick={handleAnalyze}
            className="w-full bg-accent-info hover:bg-accent-info/90"
            disabled={analyzing}
          >
            <Brain className="mr-2 h-4 w-4" />
            Analyze with AI
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-background-tertiary/20 bg-background-secondary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Brain className="h-5 w-5 text-accent-info" />
            AI Analysis
          </CardTitle>
          <Badge variant="outline" className="bg-accent-info/10 text-accent-info border-accent-info/30">
            <Sparkles className="mr-1 h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        <CardDescription className="text-text-secondary">
          Generated {new Date(analysis.analyzed_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Recognition */}
        <div className="rounded-lg border border-background-tertiary/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-profit/20">
              <TrendingUp className="h-4 w-4 text-accent-profit" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary mb-1">Pattern Recognition</p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {analysis.analysis.pattern_recognition}
              </p>
            </div>
          </div>
        </div>

        {/* Emotional Insights */}
        <div className="rounded-lg border border-background-tertiary/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-warning/20">
              <Brain className="h-4 w-4 text-accent-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary mb-1">Emotional Insights</p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {analysis.analysis.emotional_insights}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="rounded-lg border border-background-tertiary/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-loss/20">
              <AlertTriangle className="h-4 w-4 text-accent-loss" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary mb-1">Risk Assessment</p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {analysis.analysis.risk_assessment}
              </p>
            </div>
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="rounded-lg border border-accent-info/30 bg-accent-info/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-info/20">
              <Lightbulb className="h-4 w-4 text-accent-info" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-text-primary mb-1">Recommendations</p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {analysis.analysis.improvement_suggestions}
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleAnalyze}
          variant="outline"
          className="w-full"
          disabled={analyzing}
        >
          <Brain className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </CardContent>
    </Card>
  )
}
