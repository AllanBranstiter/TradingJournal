import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  console.log('[SUPABASE/SERVER] Creating server client...')
  const cookieStore = await cookies()
  
  const allCookies = cookieStore.getAll()
  console.log('[SUPABASE/SERVER] Available cookies:', allCookies.map(c => c.name))
  console.log('[SUPABASE/SERVER] Cookie count:', allCookies.length)
  
  // Check for Supabase auth cookies specifically
  const authCookies = allCookies.filter(c => c.name.includes('sb-') || c.name.includes('supabase'))
  console.log('[SUPABASE/SERVER] Auth cookies found:', authCookies.map(c => c.name))
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value
          console.log('[SUPABASE/SERVER] Cookie get:', name, value ? 'HAS_VALUE' : 'EMPTY')
          return value
        },
      },
    }
  )
}
