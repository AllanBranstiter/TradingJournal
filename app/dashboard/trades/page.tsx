'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { List, PlusCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useTrades } from '@/lib/hooks/useTrades'
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils/cn'

export default function TradesPage() {
  const { trades, loading } = useTrades()

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">
              All Trades
            </h1>
            <p className="mt-2 text-text-secondary">
              Loading your trades...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            All Trades
          </h1>
          <p className="mt-2 text-text-secondary">
            View and manage all your trading activity
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/trades/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log Trade
          </Link>
        </Button>
      </div>

      {/* Trades List or Empty State */}
      {trades.length === 0 ? (
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardContent className="pt-6">
            <EmptyState
              icon={List}
              title="No trades yet"
              description="Log your first trade to get started with tracking your trading performance."
              action={{
                label: 'Log Your First Trade',
                href: '/dashboard/trades/new',
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trades.map((trade) => {
            const isProfit = trade.net_pnl && trade.net_pnl > 0
            const isLoss = trade.net_pnl && trade.net_pnl < 0
            const isOpen = !trade.exit_date

            return (
              <Card
                key={trade.id}
                className="border-background-tertiary/20 bg-background-secondary hover:bg-background-tertiary/50 transition-colors cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl font-bold">
                        {trade.ticker}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          'border',
                          trade.direction === 'long'
                            ? 'bg-accent-profit/20 text-accent-profit border-accent-profit/30'
                            : 'bg-accent-loss/20 text-accent-loss border-accent-loss/30'
                        )}
                      >
                        {trade.direction === 'long' ? (
                          <>
                            <TrendingUp className="mr-1 h-3 w-3" />
                            Long
                          </>
                        ) : (
                          <>
                            <TrendingDown className="mr-1 h-3 w-3" />
                            Short
                          </>
                        )}
                      </Badge>
                      {isOpen && (
                        <Badge variant="outline" className="bg-accent-info/20 text-accent-info border-accent-info/30">
                          Open
                        </Badge>
                      )}
                    </div>
                    {trade.net_pnl !== null && (
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            isProfit && 'text-accent-profit',
                            isLoss && 'text-accent-loss',
                            !isProfit && !isLoss && 'text-text-secondary'
                          )}
                        >
                          {formatCurrency(trade.net_pnl)}
                        </p>
                        {trade.return_percent !== null && (
                          <p
                            className={cn(
                              'text-sm',
                              isProfit && 'text-accent-profit',
                              isLoss && 'text-accent-loss',
                              !isProfit && !isLoss && 'text-text-secondary'
                            )}
                          >
                            {formatPercent(trade.return_percent)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-text-tertiary">Entry</p>
                      <p className="text-text-primary font-medium">
                        {formatCurrency(trade.entry_price)}
                      </p>
                      <p className="text-text-tertiary text-xs">
                        {formatDate(trade.entry_date)}
                      </p>
                    </div>
                    {trade.exit_price && (
                      <div>
                        <p className="text-text-tertiary">Exit</p>
                        <p className="text-text-primary font-medium">
                          {formatCurrency(trade.exit_price)}
                        </p>
                        {trade.exit_date && (
                          <p className="text-text-tertiary text-xs">
                            {formatDate(trade.exit_date)}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <p className="text-text-tertiary">Quantity</p>
                      <p className="text-text-primary font-medium">
                        {trade.quantity}
                      </p>
                    </div>
                    {trade.strategies && (
                      <div>
                        <p className="text-text-tertiary">Strategy</p>
                        <p className="text-text-primary font-medium">
                          {trade.strategies.name}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
