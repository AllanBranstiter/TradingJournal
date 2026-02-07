import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { List, PlusCircle } from 'lucide-react'

export default function TradesPage() {
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

      {/* Empty State */}
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
    </div>
  )
}
