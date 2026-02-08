import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  console.log('[SIGNUP] Starting signup process')
  const response = NextResponse.json({
    success: true,
    message: 'Account created! Please check your email to confirm your account before signing in.'
  })
  console.log('[SIGNUP] Created response object')
  
  try {
    console.log('[SIGNUP] Parsing request body...')
    const { email, password, displayName } = await request.json()
    console.log('[SIGNUP] Request body parsed:', { email, displayName })

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[SIGNUP] Creating Supabase client...')
    const supabase = createRouteHandlerClient(request, response)
    console.log('[SIGNUP] Supabase client created successfully')

    // Create auth user - Supabase will send email confirmation
    console.log('[SIGNUP] Calling supabase.auth.signUp...')
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
    console.log('[SIGNUP] signUp completed, extracting data...')
    const { data: authData, error: authError } = signUpResult
    console.log('[SIGNUP] signUp result:', {
      hasData: !!authData,
      hasUser: !!authData?.user,
      hasError: !!authError,
      errorMessage: authError?.message
    })

    console.log('[SIGNUP] About to check authError...')
    if (authError) {
      console.log('[SIGNUP] authError detected, returning 400')
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    console.log('[SIGNUP] No authError, checking authData.user...')
    if (!authData.user) {
      console.log('[SIGNUP] No user in authData, returning 500')
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('[SIGNUP] Signup completed successfully, user must confirm email before signing in')
    return response
  } catch (error) {
    console.error('[SIGNUP] ERROR - Caught exception:', error)
    console.error('[SIGNUP] ERROR - Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
