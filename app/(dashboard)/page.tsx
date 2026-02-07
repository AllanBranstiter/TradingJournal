import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Hash, Flame, PlusCircle, Upload } from 'lucide-react'

export default function DashboardPage() {
  // Placeholder data - will be replaced with real data later
  const metrics = [
    {
      title: 'Total P&L',
      value: '$12,450.00',
      icon: DollarSign,
      trend: '+15.3%',
      positive: true,
    },
    {
      title: 'Win Rate',
      value: '68.5%',
      icon: TrendingUp,
      trend: '+2.4%',
      positive: true,
    },
    {
      title: 'Total Trades',
      value: '247',
      icon: Hash,
      trend: '+12',
      positive: true,
    },
    {
      title: 'Current Streak',
      value: '5 wins',
      icon: Flame,
      trend: '🔥',
      positive: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Dashboard
        </h1>
        <p className="mt-2 text-text-secondary">
          Welcome back! Here's an overview of your trading performance.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card
              key={metric.title}
              className="border-background-tertiary/20 bg-background-secondary"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">
                  {metric.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-text-tertiary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-text-primary">
                  {metric.value}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    metric.positive
                      ? 'text-accent-success'
                      : 'text-accent-danger'
                  }`}
                >
                  {metric.trend} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-text-primary">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard/trades/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Log New Trade
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/import">
              <Upload className="mr-2 h-5 w-5" />
              Import CSV
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Trades Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">
            Recent Trades
          </h2>
          <Button asChild variant="outline">
            <Link href="/dashboard/trades">View All</Link>
          </Button>
        </div>
        <Card className="border-background-tertiary/20 bg-background-secondary">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-background-tertiary">
                <Hash className="h-8 w-8 text-text-tertiary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">
                No trades yet
              </h3>
              <p className="mb-4 text-sm text-text-secondary">
                Start logging your trades to see them here
              </p>
              <Button asChild>
                <Link href="/dashboard/trades/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Log Your First Trade
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
