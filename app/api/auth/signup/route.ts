import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  console.log('[SIGNUP] Starting signup process')
  const response = NextResponse.json({ success: true })
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

    // 1. Create auth user
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
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // 2. Sign in immediately after signup to establish session
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Account created but sign-in failed. Please try logging in.' 
        },
        { status: 500 }
      )
    }

    // 3. Create user profile with active session
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        display_name: displayName,
      })

    if (profileError) {
      console.error('Failed to create user profile:', profileError)
      // Profile creation will be retried or created via database trigger
    }

    // 4. Create gamification record
    const { error: gamificationError } = await supabase
      .from('gamification')
      .insert({
        user_id: authData.user.id,
        current_journaling_streak: 0,
        longest_journaling_streak: 0,
        total_trades_logged: 0,
        total_days_journaled: 0,
      })

    if (gamificationError) {
      console.error('Failed to create gamification record:', gamificationError)
      // Gamification can be created later
    }

    console.log('[SIGNUP] Signup completed successfully, returning response')
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
