'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils/formatting'
import { Skeleton } from '@/components/ui/skeleton'

interface Trade {
  id: string
  entry_date: string
  exit_date: string | null
  net_pnl: number | null
}

interface EquityCurveProps {
  trades?: Trade[]
  loading?: boolean
}

export function EquityCurve({ trades = [], loading = false }: EquityCurveProps) {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return []

    // Filter only closed trades with P&L
    const closedTrades = trades
      .filter(t => t.exit_date && t.net_pnl !== null)
      .sort((a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime())

    // Calculate cumulative P&L
    let cumulative = 0
    return closedTrades.map(trade => {
      cumulative += trade.net_pnl || 0
      return {
        date: trade.exit_date!,
        pnl: cumulative,
        formattedDate: formatDate(trade.exit_date!),
      }
    })
  }, [trades])

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm mt-1">Complete some trades to see your equity curve</p>
        </div>
      </div>
    )
  }

  const isPositive = chartData[chartData.length - 1]?.pnl >= 0

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#252e42" />
        <XAxis
          dataKey="formattedDate"
          stroke="#8b92a7"
          style={{ fontSize: '12px' }}
          tickLine={false}
        />
        <YAxis
          stroke="#8b92a7"
          style={{ fontSize: '12px' }}
          tickLine={false}
          tickFormatter={(value) => formatCurrency(value)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#141b2d',
            border: '1px solid #252e42',
            borderRadius: '8px',
            color: '#e0e6ed',
          }}
          formatter={(value: number) => [formatCurrency(value), 'P&L']}
          labelStyle={{ color: '#8b92a7' }}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth={2}
          fill={isPositive ? 'url(#profitGradient)' : 'url(#lossGradient)'}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
