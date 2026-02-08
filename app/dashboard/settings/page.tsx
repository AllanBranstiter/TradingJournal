import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Profile',
      description: 'Manage your account settings and preferences',
      emoji: '👤',
    },
    {
      title: 'Risk Management',
      description: 'Configure your risk parameters and position sizing rules',
      emoji: '⚠️',
    },
    {
      title: 'AI Configuration',
      description: 'Set up AI-powered insights and analysis preferences',
      emoji: '🤖',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="mt-2 text-text-secondary">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator className="bg-background-tertiary" />

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingsSections.map((section) => (
          <Card
            key={section.title}
            className="border-background-tertiary/20 bg-background-secondary"
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{section.emoji}</span>
                <div>
                  <CardTitle className="text-text-primary">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-text-secondary">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-text-tertiary">
                  Configuration options coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
