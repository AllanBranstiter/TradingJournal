'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Share2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface TradeInfographicProps {
  trade: {
    symbol: string
    direction: 'long' | 'short'
    entry_price: number
    exit_price: number
    net_pnl: number
    risk_reward_ratio?: number
    entry_date: string
    exit_date: string
  }
  journal?: {
    pre_trade_emotional_state?: string[]
    post_trade_emotional_state?: string[]
    followed_plan?: boolean
    setup_quality?: number
  }
  disciplineScore?: number
}

export function TradeInfographic({ trade, journal, disciplineScore }: TradeInfographicProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const isProfitable = trade.net_pnl > 0
  const priceChange = trade.direction === 'long' 
    ? trade.exit_price - trade.entry_price
    : trade.entry_price - trade.exit_price
  const priceChangePercent = (priceChange / trade.entry_price) * 100

  const handleExportImage = async () => {
    if (!cardRef.current) return
    
    setIsExporting(true)
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default
      
      const canvas = await html2canvas(cardRef.current, {
        background: '#0a0f1e',
        scale: 2,
        logging: false,
      } as any)
      
      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `trade-${trade.symbol}-${new Date(trade.exit_date).toISOString().split('T')[0]}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      })
    } catch (error) {
      console.error('Failed to export image:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShare = async () => {
    if (!cardRef.current) return
    
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        background: '#0a0f1e',
        scale: 2,
        logging: false,
      } as any)
      
      canvas.toBlob(async (blob: Blob | null) => {
        if (blob && navigator.share) {
          const file = new File([blob], `trade-${trade.symbol}.png`, { type: 'image/png' })
          try {
            await navigator.share({
              files: [file],
              title: `${trade.symbol} Trade`,
              text: `${isProfitable ? '✅' : '❌'} ${trade.direction.toUpperCase()} ${trade.symbol} - ${isProfitable ? '+' : ''}$${trade.net_pnl.toFixed(2)}`,
            })
          } catch (err) {
            // User cancelled or share not supported
            console.log('Share cancelled or not supported')
          }
        }
      })
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Infographic Card */}
      <div 
        ref={cardRef} 
        className="relative overflow-hidden rounded-xl border border-background-tertiary/20 bg-gradient-to-br from-background-secondary to-background-primary p-6 shadow-2xl"
        style={{ width: '600px', maxWidth: '100%' }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-text-primary">{trade.symbol}</h3>
            <p className="text-sm text-text-secondary">
              {new Date(trade.entry_date).toLocaleDateString()} - {new Date(trade.exit_date).toLocaleDateString()}
            </p>
          </div>
          <Badge 
            variant={trade.direction === 'long' ? 'profit' : 'loss'}
            className="text-lg px-4 py-1"
          >
            {trade.direction.toUpperCase()}
          </Badge>
        </div>

        {/* P&L Display */}
        <div className="mb-6 rounded-lg bg-background-primary/50 p-6 text-center">
          <p className="mb-2 text-sm text-text-secondary">Net P&L</p>
          <p className={`text-5xl font-bold font-mono ${isProfitable ? 'text-accent-profit' : 'text-accent-loss'}`}>
            {isProfitable ? '+' : ''}{trade.net_pnl > 0 ? '$' : '-$'}{Math.abs(trade.net_pnl).toFixed(2)}
          </p>
          <p className={`mt-2 text-xl ${isProfitable ? 'text-accent-profit' : 'text-accent-loss'}`}>
            {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </p>
        </div>

        {/* Trade Details */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-background-primary/50 p-4">
            <p className="mb-1 text-xs text-text-tertiary">Entry</p>
            <p className="text-lg font-semibold text-text-primary">${trade.entry_price.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-background-primary/50 p-4">
            <p className="mb-1 text-xs text-text-tertiary">Exit</p>
            <p className="text-lg font-semibold text-text-primary">${trade.exit_price.toFixed(2)}</p>
          </div>
        </div>

        {/* Risk:Reward Ratio */}
        {trade.risk_reward_ratio && (
          <div className="mb-6 rounded-lg bg-accent-info/10 border border-accent-info/20 p-4 text-center">
            <p className="mb-1 text-xs text-text-secondary">Risk:Reward Ratio</p>
            <p className="text-2xl font-bold text-accent-info">1:{trade.risk_reward_ratio.toFixed(2)}</p>
          </div>
        )}

        {/* Emotional State */}
        {journal?.pre_trade_emotional_state && journal.pre_trade_emotional_state.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-text-secondary">Emotional State</p>
            <div className="flex flex-wrap gap-2">
              {journal.pre_trade_emotional_state.map((emotion, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline" 
                  className="bg-accent-warning/10 text-accent-warning border-accent-warning/30"
                >
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Discipline Score */}
        {disciplineScore !== undefined && (
          <div className="rounded-lg bg-gradient-to-r from-accent-profit/10 to-accent-info/10 border border-accent-profit/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-secondary">Discipline Score</span>
              <span className={`text-2xl font-bold ${
                disciplineScore >= 80 ? 'text-accent-profit' :
                disciplineScore >= 60 ? 'text-accent-info' :
                disciplineScore >= 40 ? 'text-accent-warning' :
                'text-accent-loss'
              }`}>
                {disciplineScore}/100
              </span>
            </div>
          </div>
        )}

        {/* Plan Adherence */}
        {journal?.followed_plan !== undefined && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm">
            {journal.followed_plan ? (
              <Badge variant="profit" className="text-xs">
                ✅ Followed Plan
              </Badge>
            ) : (
              <Badge variant="loss" className="text-xs">
                ❌ Deviated from Plan
              </Badge>
            )}
          </div>
        )}

        {/* Watermark */}
        <div className="mt-6 pt-4 border-t border-background-tertiary/20 text-center">
          <p className="text-xs text-text-tertiary">The Mindful Trader</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleExportImage}
          disabled={isExporting}
          className="flex-1"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Download Image'}
        </Button>
        
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            onClick={handleShare}
            className="flex-1"
            variant="outline"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-text-tertiary">
        Share your trading journey with the community
      </p>
    </div>
  )
}
