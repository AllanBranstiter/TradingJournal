import { Card, CardContent } from '@/components/ui/card'

export default function NewTradePage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Log New Trade
        </h1>
        <p className="mt-2 text-text-secondary">
          Record a new trade with all relevant details
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h2 className="mb-2 text-xl font-semibold text-text-primary">
              Trade Entry Form Coming Soon
            </h2>
            <p className="text-text-secondary">
              The trade logging form will be implemented in the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
