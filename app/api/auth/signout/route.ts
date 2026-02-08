import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  try {
    const supabase = createRouteHandlerClient(request, response)

    await supabase.auth.signOut()

    return response
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
