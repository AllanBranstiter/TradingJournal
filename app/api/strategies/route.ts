import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { strategySchema } from '@/lib/validation/trade'

/**
 * GET /api/strategies
 * Fetch all strategies for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching strategies:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in GET /api/strategies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/strategies
 * Create a new strategy
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate strategy data
    const validation = strategySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid strategy data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedStrategy = validation.data

    // Insert strategy
    const { data, error } = await supabase
      .from('strategies')
      .insert({
        user_id: user.id,
        name: validatedStrategy.name,
        description: validatedStrategy.description || null,
        setup_criteria: null,
        entry_rules: validatedStrategy.rules || null,
        exit_rules: null,
        risk_reward_target: null,
        win_rate_target: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating strategy:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/strategies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
