import { Card, CardContent } from '@/components/ui/card'

export default function ImportPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Import Trades
        </h1>
        <p className="mt-2 text-text-secondary">
          Import your trades from CSV files or brokerage platforms
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">📤</div>
            <h2 className="mb-2 text-xl font-semibold text-text-primary">
              CSV Import Coming Soon
            </h2>
            <p className="text-text-secondary">
              Bulk import your trades from CSV files or connect to your broker.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
