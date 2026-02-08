import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function calculatePnL(
  direction: string,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  commissions: number
): number {
  const priceDiff = direction === 'long'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice
  
  const grossPnL = priceDiff * quantity
  return grossPnL
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const { trades } = await request.json()
    
    // Validate trades array
    if (!Array.isArray(trades) || trades.length === 0) {
      return NextResponse.json({ error: 'No trades to import' }, { status: 400 })
    }
    
    // Process each trade
    const results = {
      successful: [] as any[],
      failed: [] as any[],
    }
    
    for (const trade of trades) {
      try {
        // Calculate P&L if exit data exists
        let net_pnl = null
        let gross_pnl = null
        let return_percent = null
        
        if (trade.exit_price) {
          gross_pnl = calculatePnL(
            trade.direction,
            trade.entry_price,
            trade.exit_price,
            trade.quantity,
            0
          )
          net_pnl = gross_pnl - (trade.commissions || 0)
          return_percent = (net_pnl / (trade.entry_price * trade.quantity)) * 100
        }
        
        // Insert trade
        const { data, error } = await supabase
          .from('trades')
          .insert({
            user_id: user.id,
            ticker: trade.ticker.toUpperCase(),
            direction: trade.direction,
            entry_date: trade.entry_date,
            exit_date: trade.exit_date || null,
            entry_price: trade.entry_price,
            exit_price: trade.exit_price || null,
            quantity: trade.quantity,
            commissions: trade.commissions || 0,
            gross_pnl,
            net_pnl,
            return_percent,
            imported_from_csv: true,
          })
          .select()
          .single()
        
        if (error) throw error
        
        results.successful.push({
          ticker: trade.ticker,
          id: data.id,
        })
      } catch (err: any) {
        results.failed.push({
          ticker: trade.ticker,
          error: err.message,
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: results.successful.length,
      failed: results.failed.length,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
