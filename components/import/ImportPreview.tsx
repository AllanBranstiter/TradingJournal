'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ImportPreviewProps {
  trades: any[]
  onConfirm: () => void
  onBack: () => void
}

export function ImportPreview({ trades, onConfirm, onBack }: ImportPreviewProps) {
  const validTrades = trades.filter(t => t.validation.valid)
  const invalidTrades = trades.filter(t => !t.validation.valid)
  const displayTrades = trades.slice(0, 10)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const calculatePnL = (trade: any) => {
    if (!trade.exit_price || !trade.entry_price) return null
    
    const priceDiff = trade.direction === 'long'
      ? trade.exit_price - trade.entry_price
      : trade.entry_price - trade.exit_price
    
    const grossPnL = priceDiff * trade.quantity
    const netPnL = grossPnL - (trade.commissions || 0)
    
    return netPnL
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <p className="text-sm text-text-secondary mb-1">Total Trades</p>
          <p className="text-2xl font-bold">{trades.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-accent-success" />
            <p className="text-sm text-text-secondary">Valid</p>
          </div>
          <p className="text-2xl font-bold text-accent-success">{validTrades.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-accent-danger" />
            <p className="text-sm text-text-secondary">Invalid</p>
          </div>
          <p className="text-2xl font-bold text-accent-danger">{invalidTrades.length}</p>
        </div>
      </div>

      {/* Invalid Trades Warning */}
      {invalidTrades.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-accent-warning bg-accent-warning/10 p-4">
          <AlertCircle className="h-5 w-5 text-accent-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-accent-warning">
              {invalidTrades.length} trade(s) have validation errors
            </p>
            <p className="text-sm text-accent-warning/90">
              These trades will be skipped during import. Only valid trades will be imported.
            </p>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            Preview (First {Math.min(10, trades.length)} of {trades.length} trades)
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            Edit Mapping
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ticker</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Direction</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Entry Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Entry Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Exit Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Exit Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Est. P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayTrades.map((trade, idx) => {
                const pnl = calculatePnL(trade)
                const isValid = trade.validation.valid

                return (
                  <tr
                    key={idx}
                    className={cn(
                      'hover:bg-background-secondary/50',
                      !isValid && 'bg-accent-danger/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      {isValid ? (
                        <CheckCircle className="h-4 w-4 text-accent-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-accent-danger" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {trade.ticker || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          trade.direction === 'long'
                            ? 'bg-accent-success/10 text-accent-success'
                            : trade.direction === 'short'
                            ? 'bg-accent-danger/10 text-accent-danger'
                            : 'bg-background-secondary text-text-secondary'
                        )}
                      >
                        {trade.direction ? trade.direction.toUpperCase() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.entry_date ? formatDate(trade.entry_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.entry_price ? `$${trade.entry_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.quantity || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.exit_date ? formatDate(trade.exit_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {pnl !== null ? (
                        <span
                          className={cn(
                            'font-medium',
                            pnl >= 0 ? 'text-accent-success' : 'text-accent-danger'
                          )}
                        >
                          ${pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-text-secondary">Open</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Details for Invalid Trades */}
      {invalidTrades.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-accent-danger">Validation Errors</h3>
          <div className="space-y-2">
            {invalidTrades.map((trade, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-accent-danger bg-accent-danger/5 p-4"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-accent-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      Trade {idx + 1}: {trade.ticker || 'Unknown'}
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {trade.validation.errors.map((error: string, errIdx: number) => (
                        <li key={errIdx} className="text-sm text-accent-danger/90">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mapping
        </Button>
        <div className="flex items-center gap-3">
          <p className="text-sm text-text-secondary">
            {validTrades.length} trade(s) will be imported
          </p>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={validTrades.length === 0}
          >
            Confirm Import
          </Button>
        </div>
      </div>
    </div>
  )
}
