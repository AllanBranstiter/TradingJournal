'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpSchema, type SignUpInput } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SignupPage() {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpInput) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'An unexpected error occurred')
      } else {
        // Show success message - user must confirm email before signing in
        setSuccess(result.message || 'Account created! Please check your email to confirm your account.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Start your trading journey with a psychology-first approach
        </CardDescription>
      </CardHeader>
      {success ? (
        <CardContent className="space-y-4">
          <Alert className="border-green-600 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <p className="text-sm text-text-secondary">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="John Doe"
                {...register('displayName')}
                disabled={isLoading}
              />
              {errors.displayName && (
                <p className="text-sm text-accent-loss">{errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-accent-loss">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-accent-loss">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                {...register('confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-accent-loss">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-sm text-text-secondary text-center">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-accent-info hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
