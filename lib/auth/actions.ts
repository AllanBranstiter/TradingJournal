'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionResult = {
  success: boolean
  error?: string
  message?: string
}

export async function signIn(email: string, password: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      error: error.message === 'Invalid login credentials' 
        ? 'Invalid email or password' 
        : error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  })

  if (authError) {
    return {
      success: false,
      error: authError.message,
    }
  }

  if (!authData.user) {
    return {
      success: false,
      error: 'Failed to create user',
    }
  }

  // 2. Create user_profiles record using service role to bypass RLS
  // Note: We need to use a separate Supabase client with service role for initial setup
  // For now, sign in immediately after signup to establish session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return {
      success: false,
      error: 'Account created but sign-in failed. Please try logging in.',
    }
  }

  // Now with active session, create profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      display_name: displayName,
    })

  if (profileError) {
    console.error('Failed to create user profile:', profileError)
    // Profile creation will be retried or created via database trigger
  }

  // 3. Create gamification record with correct column names
  const { error: gamificationError } = await supabase
    .from('gamification')
    .insert({
      user_id: authData.user.id,
      current_journaling_streak: 0,
      longest_journaling_streak: 0,
      total_trades_logged: 0,
      total_days_journaled: 0,
    })

  if (gamificationError) {
    console.error('Failed to create gamification record:', gamificationError)
    // Gamification can be created later
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Sign out error:', error)
    throw new Error(error.message)
  }
  
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(email: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Password reset email sent. Please check your inbox.',
  }
}

export async function updatePassword(newPassword: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    message: 'Password updated successfully',
  }
}
