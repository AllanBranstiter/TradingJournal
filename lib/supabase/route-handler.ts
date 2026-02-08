import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  console.log('[ROUTE-HANDLER] Creating Supabase client')
  console.log('[ROUTE-HANDLER] Environment check:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          console.log('[ROUTE-HANDLER] Cookie get:', name)
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          console.log('[ROUTE-HANDLER] Cookie set:', name)
          try {
            response.cookies.set({ name, value, ...options })
            console.log('[ROUTE-HANDLER] Cookie set successful:', name)
          } catch (error) {
            console.error('[ROUTE-HANDLER] ERROR setting cookie:', error)
            throw error
          }
        },
        remove(name: string, options: any) {
          console.log('[ROUTE-HANDLER] Cookie remove:', name)
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
}
