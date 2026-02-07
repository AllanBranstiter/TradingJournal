import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - The Mindful Trader',
  description: 'Sign in to The Mindful Trader trading journal',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-primary px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            The Mindful Trader
          </h1>
          <p className="text-text-secondary text-sm">
            Psychology-First Trading Journal
          </p>
        </div>

        {/* Auth Form Content */}
        {children}
      </div>
    </div>
  )
}
