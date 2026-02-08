'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, getPnLColorClass } from '@/lib/utils/formatting'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Trade {
  id: string
  ticker: string
  direction: 'long' | 'short'
  net_pnl: number | null
  exit_date: string | null
  entry_date: string
}

interface RecentTradesProps {
  trades?: Trade[]
  loading?: boolean
}

export function RecentTrades({ trades = [], loading = false }: RecentTradesProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-3 border border-background-tertiary rounded-lg">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (!trades || trades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No trades yet"
        description="Start logging trades to see them here"
        action={{
          label: "Log Trade",
          href: "/dashboard/trades/new"
        }}
      />
    )
  }

  // Desktop view
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow
                key={trade.id}
                className="cursor-pointer hover:bg-background-tertiary/50 transition-colors"
                onClick={() => window.location.href = `/dashboard/trades/${trade.id}`}
              >
                <TableCell className="font-mono font-medium">{trade.ticker}</TableCell>
                <TableCell>
                  <Badge
                    variant={trade.direction === 'long' ? 'info' : 'loss'}
                  >
                    {trade.direction.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className={cn('text-right font-mono font-semibold', getPnLColorClass(trade.net_pnl || 0))}>
                  {trade.net_pnl !== null ? formatCurrency(trade.net_pnl) : '-'}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {formatDate(trade.exit_date || trade.entry_date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-2">
        {trades.map((trade) => (
          <Link
            key={trade.id}
            href={`/dashboard/trades/${trade.id}`}
            className="block p-4 border border-background-tertiary rounded-lg hover:bg-background-tertiary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-lg">{trade.ticker}</span>
                <Badge
                  variant={trade.direction === 'long' ? 'info' : 'loss'}
                  className="text-xs"
                >
                  {trade.direction.toUpperCase()}
                </Badge>
              </div>
              <span className={cn('font-mono font-semibold text-lg', getPnLColorClass(trade.net_pnl || 0))}>
                {trade.net_pnl !== null ? formatCurrency(trade.net_pnl) : '-'}
              </span>
            </div>
            <div className="text-sm text-text-secondary">
              {formatDate(trade.exit_date || trade.entry_date)}
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
