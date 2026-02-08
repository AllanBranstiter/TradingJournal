import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { tradeSchema, preTradeJournalSchema, postTradeJournalSchema } from '@/lib/validation/trade'
import { calculatePnL, calculateReturnPercent } from '@/lib/utils/calculations'

/**
 * GET /api/trades
 * Fetch all trades for authenticated user with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')
    const direction = searchParams.get('direction')
    const strategyId = searchParams.get('strategy_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    // Build query
    let query = supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*),
        strategies(id, name)
      `)
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (ticker) {
      query = query.ilike('ticker', `%${ticker}%`)
    }
    if (direction) {
      query = query.eq('direction', direction)
    }
    if (strategyId) {
      query = query.eq('strategy_id', strategyId)
    }
    if (startDate) {
      query = query.gte('entry_date', startDate)
    }
    if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching trades:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error('Unexpected error in GET /api/trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/trades
 * Create a new trade with optional journals
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { trade, preTradeJournal, postTradeJournal } = body

    // Validate trade data
    const tradeValidation = tradeSchema.safeParse(trade)
    if (!tradeValidation.success) {
      return NextResponse.json(
        { error: 'Invalid trade data', details: tradeValidation.error.errors },
        { status: 400 }
      )
    }

    const validatedTrade = tradeValidation.data

    // Calculate P&L if exit price is provided
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

    // Insert trade
    const { data: createdTrade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        ticker: validatedTrade.ticker,
        direction: validatedTrade.direction,
        entry_date: validatedTrade.entry_date,
        exit_date: validatedTrade.exit_date || null,
        entry_price: validatedTrade.entry_price,
        exit_price: validatedTrade.exit_price || null,
        quantity: validatedTrade.quantity,
        commissions: validatedTrade.commissions,
        slippage: 0, // Default for manual entry
        gross_pnl: grossPnL,
        net_pnl: netPnL,
        return_percent: returnPercent,
        hold_duration_minutes: holdDurationMinutes,
        screenshot_url: validatedTrade.screenshot_url || null,
        imported_from_csv: false,
      })
      .select()
      .single()

    if (tradeError) {
      console.error('Error creating trade:', tradeError)
      return NextResponse.json({ error: tradeError.message }, { status: 500 })
    }

    // Insert pre-trade journal if provided
    let createdPreJournal = null
    if (preTradeJournal) {
      const preJournalValidation = preTradeJournalSchema.safeParse(preTradeJournal)
      if (preJournalValidation.success) {
        const { data: preJournal, error: preJournalError } = await supabase
          .from('pre_trade_journals')
          .insert({
            user_id: user.id,
            trade_id: createdTrade.id,
            ...preJournalValidation.data,
          })
          .select()
          .single()

        if (!preJournalError) {
          createdPreJournal = preJournal
        }
      }
    }

    // Insert post-trade journal if provided
    let createdPostJournal = null
    if (postTradeJournal) {
      const postJournalValidation = postTradeJournalSchema.safeParse(postTradeJournal)
      if (postJournalValidation.success) {
        const { data: postJournal, error: postJournalError } = await supabase
          .from('post_trade_journals')
          .insert({
            user_id: user.id,
            trade_id: createdTrade.id,
            pre_trade_journal_id: createdPreJournal?.id || null,
            ai_analysis_completed: false,
            ai_insights: null,
            ...postJournalValidation.data,
          })
          .select()
          .single()

        if (!postJournalError) {
          createdPostJournal = postJournal
        }
      }
    }

    return NextResponse.json({
      data: {
        trade: createdTrade,
        preTradeJournal: createdPreJournal,
        postTradeJournal: createdPostJournal,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/trades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
