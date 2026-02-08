import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('[MIDDLEWARE] Processing request:', request.nextUrl.pathname)
  
  const response = NextResponse.next()
  
  // Log all cookies
  const allCookies = request.cookies.getAll()
  console.log('[MIDDLEWARE] Request cookies:', allCookies.map(c => c.name))
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value
          console.log('[MIDDLEWARE] Cookie get:', name, value ? 'EXISTS' : 'MISSING')
          return value
        },
        set(name: string, value: string, options: any) {
          console.log('[MIDDLEWARE] Cookie set:', name)
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          console.log('[MIDDLEWARE] Cookie remove:', name)
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('[MIDDLEWARE] Session check:', {
    path: request.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
  })

  // Redirect to login if accessing dashboard without auth
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    console.log('[MIDDLEWARE] No session found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing auth pages while logged in
  if (request.nextUrl.pathname.startsWith('/login') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  if (request.nextUrl.pathname.startsWith('/signup') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
