import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  try {
    const { email, password, displayName } = await request.json()

    // Validate required fields
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient(request, response)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

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

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
