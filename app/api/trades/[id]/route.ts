import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { tradeSchema, preTradeJournalSchema, postTradeJournalSchema } from '@/lib/validation/trade'
import { calculatePnL, calculateReturnPercent } from '@/lib/utils/calculations'

/**
 * GET /api/trades/[id]
 * Fetch a single trade with journals
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*),
        strategies(id, name, description)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
      }
      console.error('Error fetching trade:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in GET /api/trades/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/trades/[id]
 * Update a trade and its journals
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trade belongs to user
    const { data: existingTrade, error: fetchError } = await supabase
      .from('trades')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    const body = await request.json()
    const { trade, preTradeJournal, postTradeJournal } = body

    // Validate and update trade
    if (trade) {
      const tradeValidation = tradeSchema.safeParse(trade)
      if (!tradeValidation.success) {
        return NextResponse.json(
          { error: 'Invalid trade data', details: tradeValidation.error.errors },
          { status: 400 }
        )
      }

      const validatedTrade = tradeValidation.data

      // Recalculate P&L if exit price is provided
      let grossPnL = null
      let netPnL = null
      let returnPercent = null

      if (validatedTrade.exit_price) {
        grossPnL = calculatePnL(
          validatedTrade.direction,
          validatedTrade.entry_price,
          validatedTrade.exit_price,
          validatedTrade.quantity,
          0
        )
        netPnL = grossPnL - validatedTrade.commissions
        returnPercent = calculateReturnPercent(
          netPnL,
          validatedTrade.entry_price,
          validatedTrade.quantity
        )
      }

      // Calculate hold duration if both dates provided
      let holdDurationMinutes = null
      if (validatedTrade.exit_date) {
        const entryTime = new Date(validatedTrade.entry_date).getTime()
        const exitTime = new Date(validatedTrade.exit_date).getTime()
        holdDurationMinutes = Math.floor((exitTime - entryTime) / (1000 * 60))
      }

      const { error: updateError } = await supabase
        .from('trades')
        .update({
          ticker: validatedTrade.ticker,
          direction: validatedTrade.direction,
          entry_date: validatedTrade.entry_date,
          exit_date: validatedTrade.exit_date || null,
          entry_price: validatedTrade.entry_price,
          exit_price: validatedTrade.exit_price || null,
          quantity: validatedTrade.quantity,
          commissions: validatedTrade.commissions,
          gross_pnl: grossPnL,
          net_pnl: netPnL,
          return_percent: returnPercent,
          hold_duration_minutes: holdDurationMinutes,
          screenshot_url: validatedTrade.screenshot_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error updating trade:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Update pre-trade journal if provided
    if (preTradeJournal) {
      const preJournalValidation = preTradeJournalSchema.safeParse(preTradeJournal)
      if (preJournalValidation.success) {
        // Check if journal exists
        const { data: existingJournal } = await supabase
          .from('pre_trade_journals')
          .select('id')
          .eq('trade_id', id)
          .single()

        if (existingJournal) {
          // Update existing
          await supabase
            .from('pre_trade_journals')
            .update(preJournalValidation.data)
            .eq('id', existingJournal.id)
        } else {
          // Create new
          await supabase
            .from('pre_trade_journals')
            .insert({
              user_id: user.id,
              trade_id: id,
              ...preJournalValidation.data,
            })
        }
      }
    }

    // Update post-trade journal if provided
    if (postTradeJournal) {
      const postJournalValidation = postTradeJournalSchema.safeParse(postTradeJournal)
      if (postJournalValidation.success) {
        // Check if journal exists
        const { data: existingJournal } = await supabase
          .from('post_trade_journals')
          .select('id')
          .eq('trade_id', id)
          .single()

        if (existingJournal) {
          // Update existing
          await supabase
            .from('post_trade_journals')
            .update(postJournalValidation.data)
            .eq('id', existingJournal.id)
        } else {
          // Create new
          const { data: preJournal } = await supabase
            .from('pre_trade_journals')
            .select('id')
            .eq('trade_id', id)
            .single()

          await supabase
            .from('post_trade_journals')
            .insert({
              user_id: user.id,
              trade_id: id,
              pre_trade_journal_id: preJournal?.id || null,
              ai_analysis_completed: false,
              ai_insights: null,
              ...postJournalValidation.data,
            })
        }
      }
    }

    // Fetch updated trade with journals
    const { data: updatedTrade } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*),
        strategies(id, name)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({ data: updatedTrade })

  } catch (error) {
    console.error('Unexpected error in PUT /api/trades/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/trades/[id]
 * Delete a trade and its associated journals
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trade belongs to user
    const { data: existingTrade, error: fetchError } = await supabase
      .from('trades')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingTrade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Delete trade (journals will be cascade deleted due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting trade:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Trade deleted successfully' })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/trades/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
