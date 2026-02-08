import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/encryption'

interface AIPromptData {
  trade: any
  preJournal: any
  postJournal: any
  recentTrades: any[]
}

function buildAIPrompt(data: AIPromptData): string {
  const { trade, preJournal, postJournal, recentTrades } = data

  return `You are a trading psychology coach inspired by Mark Douglas and Dr. Alexander Elder.

**Current Trade:**
- Ticker: ${trade.ticker}
- Direction: ${trade.direction}
- Result: ${trade.net_pnl > 0 ? 'Win' : 'Loss'} ($${trade.net_pnl?.toFixed(2) || 'N/A'})
- Return: ${trade.return_percent?.toFixed(2) || 'N/A'}%
- R:R: ${trade.actual_rr?.toFixed(2) || 'N/A'}

**Pre-Trade State:**
- Emotional State: ${preJournal?.emotional_state?.join(', ') || 'Not recorded'}
- Emotional Score: ${preJournal?.emotional_score || 'N/A'}/10
- Setup Quality: ${preJournal?.setup_quality || 'N/A'}/5
- Thesis: "${preJournal?.thesis || 'Not provided'}"
- Concerns: "${preJournal?.concerns || 'None noted'}"

**Post-Trade Reflection:**
- Followed Plan: ${postJournal?.followed_plan ? 'Yes' : 'No'}
- Rule Violations: ${postJournal?.rule_violations?.join(', ') || 'None'}
- What Went Well: "${postJournal?.what_went_well || 'Not recorded'}"
- What Went Wrong: "${postJournal?.what_went_wrong || 'Not recorded'}"
- Lessons Learned: "${postJournal?.lessons_learned || 'Not recorded'}"
- Reflection: "${postJournal?.reflection_notes || 'Not provided'}"

**Recent Pattern (Last ${recentTrades.length} Trades):**
${recentTrades.map((t, i) => {
  const emotions = t.pre_trade_journals?.[0]?.emotional_state?.join(', ') || 'N/A'
  const result = t.net_pnl > 0 ? 'Win' : t.net_pnl < 0 ? 'Loss' : 'Breakeven'
  return `${i + 1}. ${t.ticker}: ${result} ($${t.net_pnl?.toFixed(2) || 'N/A'}) - Emotions: ${emotions}`
}).join('\n')}

**Task:**
1. Identify emotional patterns (is FOMO, revenge trading, or overconfidence recurring?)
2. Detect rule-breaking trends (stop loss violations, position sizing issues?)
3. Analyze the relationship between emotional state and trade outcomes
4. Provide 2-3 actionable insights to improve discipline and consistency
5. Be supportive but honest (not just cheerleading, but constructive feedback)

**Response Format (JSON):**
{
  "detected_patterns": ["pattern 1", "pattern 2"],
  "emotional_insights": "specific observation about emotions and performance",
  "rule_adherence_feedback": "feedback on following trading plan and rules",
  "actionable_recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "encouragement": "supportive message that acknowledges progress and areas for growth"
}`
}

export async function POST(request: NextRequest) {
  try {
    const { tradeId } = await request.json()

    if (!tradeId) {
      return NextResponse.json(
        { error: 'Trade ID is required' },
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

    const userId = user.id

    // Fetch user's API key and preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('openrouter_api_key, preferred_ai_model, ai_features_enabled')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!profile?.ai_features_enabled || !profile?.openrouter_api_key) {
      return NextResponse.json({
        error: 'AI features not configured',
        message: 'Please add your OpenRouter API key in Settings to use AI analysis'
      }, { status: 403 })
    }

    // Decrypt the user's API key
    let apiKey: string
    try {
      apiKey = decrypt(profile.openrouter_api_key)
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to decrypt API key',
        message: 'Your API key may be corrupted. Please re-enter it in Settings.'
      }, { status: 500 })
    }

    // Fetch trade with journals
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select(`
        *,
        pre_trade_journals(*),
        post_trade_journals(*),
        strategies(name)
      `)
      .eq('id', tradeId)
      .eq('user_id', userId)
      .single()

    if (tradeError || !trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      )
    }

    // Check if post-trade journal exists
    if (!trade.post_trade_journals || trade.post_trade_journals.length === 0) {
      return NextResponse.json({
        error: 'No post-trade journal found',
        message: 'Please complete a post-trade journal before requesting AI analysis'
      }, { status: 400 })
    }

    // Fetch recent trades for pattern detection
    const { data: recentTrades } = await supabase
      .from('trades')
      .select('*, pre_trade_journals(*)')
      .eq('user_id', userId)
      .not('net_pnl', 'is', null)
      .order('entry_date', { ascending: false })
      .limit(10)

    // Build prompt
    const prompt = buildAIPrompt({
      trade,
      preJournal: trade.pre_trade_journals[0],
      postJournal: trade.post_trade_journals[0],
      recentTrades: recentTrades || []
    })

    // Call OpenRouter API with user's key
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Trading Journal AI Coach',
      },
      body: JSON.stringify({
        model: profile.preferred_ai_model || 'openai/gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a trading psychology expert inspired by Mark Douglas ("Trading in the Zone") and Dr. Alexander Elder ("Trading for a Living"). You provide insightful, actionable feedback on trading behavior and emotional patterns.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json()
      console.error('OpenRouter API error:', errorData)
      return NextResponse.json({
        error: 'AI analysis failed',
        message: errorData.error?.message || 'Failed to connect to OpenRouter API. Please check your API key.'
      }, { status: 500 })
    }

    const aiData = await openRouterResponse.json()
    const insights = JSON.parse(aiData.choices[0].message.content)

    // Store insights in post-trade journal
    const { error: updateError } = await supabase
      .from('post_trade_journals')
      .update({
        ai_insights: insights,
        ai_analysis_completed: true
      })
      .eq('trade_id', tradeId)

    if (updateError) {
      console.error('Failed to store AI insights:', updateError)
    }

    return NextResponse.json({
      success: true,
      insights,
      model_used: profile.preferred_ai_model || 'openai/gpt-4-turbo',
      usage: aiData.usage
    })

  } catch (error) {
    console.error('AI Analysis Error:', error)
    return NextResponse.json({
      error: 'AI analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
