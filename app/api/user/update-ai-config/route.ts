import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
  try {
    const { apiKey, preferredModel } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Encrypt the API key before storing
    const encryptedKey = encrypt(apiKey)

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        openrouter_api_key: encryptedKey,
        preferred_ai_model: preferredModel || 'openai/gpt-4-turbo',
        ai_features_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update AI config:', updateError)
      return NextResponse.json(
        { error: 'Failed to save API configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'AI configuration saved successfully'
    })

  } catch (error) {
    console.error('Update AI config error:', error)
    return NextResponse.json({
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove API key and disable AI features
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        openrouter_api_key: null,
        ai_features_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to delete AI config:', updateError)
      return NextResponse.json(
        { error: 'Failed to remove API configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key removed successfully'
    })

  } catch (error) {
    console.error('Delete AI config error:', error)
    return NextResponse.json({
      error: 'Failed to remove configuration',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
