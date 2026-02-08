import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  console.log('[SETUP-PROFILE] Starting profile setup')
  const response = NextResponse.json({ success: true })
  
  try {
    const supabase = createRouteHandlerClient(request, response)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[SETUP-PROFILE] No authenticated user:', userError)
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('[SETUP-PROFILE] Setting up profile for user:', user.id)

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      console.log('[SETUP-PROFILE] Profile already exists')
      return response
    }

    // Get display name from user metadata
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'

    // Create user profile
    console.log('[SETUP-PROFILE] Creating user profile')
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email!,
        display_name: displayName,
      })

    if (profileError) {
      console.error('[SETUP-PROFILE] Failed to create user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Create gamification record
    console.log('[SETUP-PROFILE] Creating gamification record')
    const { error: gamificationError } = await supabase
      .from('gamification')
      .insert({
        user_id: user.id,
        current_journaling_streak: 0,
        longest_journaling_streak: 0,
        total_trades_logged: 0,
        total_days_journaled: 0,
      })

    if (gamificationError) {
      console.error('[SETUP-PROFILE] Failed to create gamification record:', gamificationError)
      // Don't fail the request if gamification creation fails
      // It can be created later if needed
    }

    console.log('[SETUP-PROFILE] Profile setup completed successfully')
    return response
  } catch (error) {
    console.error('[SETUP-PROFILE] ERROR - Caught exception:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
