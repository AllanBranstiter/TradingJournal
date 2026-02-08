import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string // e.g., "+5% from last week"
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className="bg-background-secondary border-background-tertiary">
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          {change && <Skeleton className="h-3 w-24" />}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-background-secondary border-background-tertiary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-text-secondary">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-text-secondary opacity-70">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-4xl font-mono font-bold",
          trend === 'up' && "text-accent-profit",
          trend === 'down' && "text-accent-loss",
          trend === 'neutral' && "text-text-primary"
        )}>
          {value}
        </div>
        {change && (
          <p className={cn(
            "text-xs mt-1",
            trend === 'up' && "text-accent-profit",
            trend === 'down' && "text-accent-loss",
            trend === 'neutral' && "text-text-tertiary"
          )}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
