'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save } from 'lucide-react'
import { useTrades } from '@/lib/hooks/useTrades'
import { useStrategies } from '@/lib/hooks/useStrategies'
import { formatDateTimeLocal } from '@/lib/utils/formatting'
import { EmotionSelector } from '@/components/trades/EmotionSelector'
import { StarRating } from '@/components/trades/StarRating'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils/cn'

const EMOTION_SCORE_LABELS = [
  '',
  '😰 Very Anxious',
  '😟 Anxious',
  '😐 Slightly Anxious',
  '🙂 Neutral',
  '😊 Calm',
  '😌 Confident',
  '💪 Very Confident',
  '🎯 Extremely Confident',
  '🚀 Peak State',
  '🧘 Zen Master',
]

export default function NewTradePage() {
  const router = useRouter()
  const { createTrade } = useTrades({ autoFetch: false })
  const { strategies } = useStrategies()
  const [loading, setLoading] = useState(false)

  // Trade data
  const [ticker, setTicker] = useState('')
  const [direction, setDirection] = useState<'long' | 'short'>('long')
  const [entryDate, setEntryDate] = useState(formatDateTimeLocal(new Date()))
  const [exitDate, setExitDate] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [commissions, setCommissions] = useState('0')

  // Pre-trade journal
  const [emotions, setEmotions] = useState<string[]>([])
  const [emotionalScore, setEmotionalScore] = useState(5)
  const [setupQuality, setSetupQuality] = useState(3)
  const [strategyId, setStrategyId] = useState<string>('')
  const [thesis, setThesis] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tradeData = {
        trade: {
          ticker: ticker.toUpperCase(),
          direction,
          entry_date: entryDate,
          exit_date: exitDate || undefined,
          entry_price: parseFloat(entryPrice),
          exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
          quantity: parseInt(quantity),
          commissions: parseFloat(commissions),
        },
        preTradeJournal: {
          emotional_state: emotions as any,
          emotional_score: emotionalScore,
          setup_quality: setupQuality,
          strategy_id: strategyId || undefined,
          thesis: thesis || undefined,
        },
      }

      const result = await createTrade(tradeData)
      
      if (result) {
        router.push('/dashboard/trades')
      }
    } catch (error) {
      console.error('Error creating trade:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/trades">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Log New Trade
          </h1>
          <p className="mt-2 text-text-secondary">
            Record your trade details and pre-trade mindset
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Details */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker Symbol *</Label>
                <Input
                  id="ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  required
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Direction *</Label>
                <RadioGroup value={direction} onValueChange={(v) => setDirection(v as 'long' | 'short')}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long" />
                      <Label htmlFor="long" className="cursor-pointer">Long</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short" />
                      <Label htmlFor="short" className="cursor-pointer">Short</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryDate">Entry Date & Time *</Label>
                <Input
                  id="entryDate"
                  type="datetime-local"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitDate">Exit Date & Time</Label>
                <Input
                  id="exitDate"
                  type="datetime-local"
                  value={exitDate}
                  onChange={(e) => setExitDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryPrice">Entry Price *</Label>
                <Input
                  id="entryPrice"
                  type="number"
                  step="0.01"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  placeholder="150.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitPrice">Exit Price</Label>
                <Input
                  id="exitPrice"
                  type="number"
                  step="0.01"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value)}
                  placeholder="155.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissions">Commissions</Label>
                <Input
                  id="commissions"
                  type="number"
                  step="0.01"
                  value={commissions}
                  onChange={(e) => setCommissions(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Trade Journal */}
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardHeader>
            <CardTitle>Pre-Trade Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Emotional State</Label>
              <EmotionSelector
                value={emotions}
                onChange={setEmotions}
                type="pre-trade"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Emotional Score (1-10)</Label>
                <span className="text-sm font-medium text-text-secondary">
                  {emotionalScore} - {EMOTION_SCORE_LABELS[emotionalScore]}
                </span>
              </div>
              <Slider
                value={[emotionalScore]}
                onValueChange={(v) => setEmotionalScore(v[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Setup Quality</Label>
              <StarRating
                value={setupQuality}
                onChange={setSetupQuality}
                max={5}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select value={strategyId} onValueChange={setStrategyId}>
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="Select a strategy (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thesis">Trade Thesis</Label>
              <Textarea
                id="thesis"
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="Why are you taking this trade? What's your setup?"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Trade'}
          </Button>
        </div>
      </form>
    </div>
  )
}
