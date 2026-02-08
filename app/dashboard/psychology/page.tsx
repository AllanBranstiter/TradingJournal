import { Card, CardContent } from '@/components/ui/card'

export default function PsychologyPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Trading Psychology
        </h1>
        <p className="mt-2 text-text-secondary">
          Track your emotional state and mental patterns during trades
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 text-6xl">🧠</div>
            <h2 className="mb-2 text-xl font-semibold text-text-primary">
              Psychology Dashboard Coming Soon
            </h2>
            <p className="text-text-secondary">
              Mental state tracking, emotional analysis, and behavioral insights will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
