'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/lib/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  
  // AI Config State
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4-turbo')
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setProfile(data)
          setSelectedModel(data.preferred_ai_model || 'openai/gpt-4-turbo')
          setAiEnabled(data.ai_features_enabled || false)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSaveAPIKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/user/update-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          preferredModel: selectedModel,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'API key saved successfully! AI features are now enabled.',
        })
        setApiKey('') // Clear input for security
        setAiEnabled(true)
        await loadProfile()
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to save API key',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API key',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAPIKey = async () => {
    if (!confirm('Are you sure you want to remove your API key? This will disable AI features.')) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/user/update-ai-config', {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'API key removed successfully',
        })
        setAiEnabled(false)
        await loadProfile()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove API key',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove API key',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

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

      {/* AI Configuration Section */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🤖</span>
            <div>
              <CardTitle className="text-text-primary">
                AI Configuration
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Set up AI-powered insights and analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          <Alert className={aiEnabled ? 'border-accent-profit/50 bg-accent-profit/10' : 'border-accent-warning/50 bg-accent-warning/10'}>
            <AlertDescription>
              {aiEnabled ? (
                <div className="flex items-center justify-between">
                  <span className="text-text-primary">
                    ✅ AI features are <strong>enabled</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAPIKey}
                    disabled={loading}
                    className="text-accent-loss hover:bg-accent-loss/10"
                  >
                    Remove API Key
                  </Button>
                </div>
              ) : (
                <span className="text-text-primary">
                  ⚠️ AI features are <strong>disabled</strong>. Add your OpenRouter API key to enable AI-powered trade analysis.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <div className="rounded-lg border border-accent-info/20 bg-accent-info/5 p-4">
            <h3 className="mb-2 font-semibold text-text-primary">How to get your OpenRouter API key:</h3>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-text-secondary">
              <li>Visit <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-accent-info hover:underline">openrouter.ai/keys</a></li>
              <li>Sign up or log in to your account</li>
              <li>Create a new API key</li>
              <li>Copy and paste it below</li>
            </ol>
            <p className="mt-3 text-xs text-text-tertiary">
              💡 Your API key is encrypted and stored securely. You pay OpenRouter directly for AI usage.
            </p>
          </div>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey" className="text-text-primary">
                OpenRouter API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-2 bg-background-tertiary border-background-tertiary text-text-primary"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Your API key is encrypted before storage and never exposed to the client.
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <Label htmlFor="model" className="text-text-primary">
                Preferred AI Model
              </Label>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
                <SelectTrigger className="mt-2 bg-background-tertiary border-background-tertiary text-text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai/gpt-4-turbo">GPT-4 Turbo (Best quality)</SelectItem>
                  <SelectItem value="openai/gpt-4">GPT-4 (Reliable)</SelectItem>
                  <SelectItem value="anthropic/claude-3-opus">Claude 3 Opus (Advanced reasoning)</SelectItem>
                  <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet (Balanced)</SelectItem>
                  <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Faster, cheaper)</SelectItem>
                  <SelectItem value="meta-llama/llama-3-70b-instruct">Llama 3 70B (Open source)</SelectItem>
                  <SelectItem value="google/gemini-pro">Gemini Pro (Google)</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-text-tertiary">
                Different models have different costs and capabilities. GPT-4 Turbo recommended for best insights.
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveAPIKey}
              disabled={!apiKey || loading}
              className="w-full bg-accent-info hover:bg-accent-info/80"
            >
              {loading ? 'Saving...' : aiEnabled ? 'Update API Configuration' : 'Save API Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section (Placeholder) */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">👤</span>
            <div>
              <CardTitle className="text-text-primary">
                Profile
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Manage your account settings and preferences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-text-tertiary">
              Profile configuration coming soon...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management Section (Placeholder) */}
      <Card className="border-background-tertiary/20 bg-background-secondary">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <CardTitle className="text-text-primary">
                Risk Management
              </CardTitle>
              <CardDescription className="text-text-secondary">
                Configure your risk parameters and position sizing rules
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-text-tertiary">
              Risk management configuration coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
