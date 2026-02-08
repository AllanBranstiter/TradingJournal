import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  try {
    const { email, password } = await request.json()

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient(request, response)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : error.message
        },
        { status: 401 }
      )
    }

    // Check if user has a profile - if not, create it (first-time login)
    if (authData.user) {
      console.log('[SIGNIN] Checking for user profile:', authData.user.id)
      
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        console.log('[SIGNIN] No profile found, creating profile for first-time login')
        
        // Get display name from user metadata
        const displayName = authData.user.user_metadata?.display_name ||
                           authData.user.email?.split('@')[0] ||
                           'User'

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            display_name: displayName,
          })

        if (profileError) {
          console.error('[SIGNIN] Failed to create user profile:', profileError)
          // Don't fail the sign-in, profile can be created later
        }

        // Create gamification record
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
          console.error('[SIGNIN] Failed to create gamification record:', gamificationError)
          // Don't fail the sign-in, gamification can be created later
        }
        
        console.log('[SIGNIN] First-time login profile setup completed')
      }
    }

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
