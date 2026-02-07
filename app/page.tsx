import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background-primary px-4 py-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-text-primary">
            The Mindful Trader
          </h1>
          <p className="text-xl md:text-2xl text-accent-info font-medium">
            Psychology-First Trading Journal
          </p>
        </div>

        {/* Description */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <p className="text-lg text-text-secondary">
            Master your trading psychology and build lasting discipline. 
            Track not just your trades, but your emotions, biases, and growth as a trader.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 pt-8">
            <div className="space-y-2">
              <div className="text-3xl">🧠</div>
              <h3 className="text-text-primary font-semibold">Psychology-First</h3>
              <p className="text-sm text-text-secondary">
                Focus on emotional patterns and mental discipline
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">📊</div>
              <h3 className="text-text-primary font-semibold">Data-Driven</h3>
              <p className="text-sm text-text-secondary">
                Track performance metrics and identify patterns
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">🎮</div>
              <h3 className="text-text-primary font-semibold">Gamified Growth</h3>
              <p className="text-sm text-text-secondary">
                Build streaks, earn achievements, level up
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button asChild size="lg" className="w-full sm:w-auto min-w-[200px]">
            <Link href="/signup">
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px]">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
        </div>

        {/* Footer Text */}
        <p className="text-sm text-text-tertiary pt-8">
          Free to use. Start building better trading habits today.
        </p>
      </div>
    </main>
  )
}
