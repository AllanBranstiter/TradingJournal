'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface Trade {
  id: string
  net_pnl: number | null
}

interface PerformanceChartProps {
  trades?: Trade[]
  loading?: boolean
}

export function PerformanceChart({ trades = [], loading = false }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return []

    const winningTrades = trades.filter(t => t.net_pnl && t.net_pnl > 0).length
    const losingTrades = trades.filter(t => t.net_pnl && t.net_pnl < 0).length
    const totalTrades = winningTrades + losingTrades

    return [
      {
        name: 'Wins',
        count: winningTrades,
        percentage: totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0',
        color: '#10b981',
      },
      {
        name: 'Losses',
        count: losingTrades,
        percentage: totalTrades > 0 ? ((losingTrades / totalTrades) * 100).toFixed(1) : '0',
        color: '#ef4444',
      },
    ]
  }, [trades])

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </div>
    )
  }

  if (chartData.length === 0 || (chartData[0].count === 0 && chartData[1].count === 0)) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="text-lg font-medium">No data yet</p>
          <p className="text-sm mt-1">Complete some trades to see your performance</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252e42" />
        <XAxis
          dataKey="name"
          stroke="#8b92a7"
          style={{ fontSize: '12px' }}
          tickLine={false}
        />
        <YAxis
          stroke="#8b92a7"
          style={{ fontSize: '12px' }}
          tickLine={false}
          label={{ value: 'Trade Count', angle: -90, position: 'insideLeft', style: { fill: '#8b92a7' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#141b2d',
            border: '1px solid #252e42',
            borderRadius: '8px',
            color: '#e0e6ed',
          }}
          formatter={(value: number, name: string, props: any) => [
            `${value} trades (${props.payload.percentage}%)`,
            props.payload.name,
          ]}
          labelStyle={{ color: '#8b92a7' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
