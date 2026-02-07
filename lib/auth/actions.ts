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

  // 2. Create user_profiles record
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: authData.user.email!,
      display_name: displayName,
    })

  if (profileError) {
    // If profile creation fails, we should handle this gracefully
    console.error('Failed to create user profile:', profileError)
    // Don't fail the signup, as the user is already created
    // The profile can be created later via a trigger or manually
  }

  // 3. Create gamification record
  const { error: gamificationError } = await supabase
    .from('gamification')
    .insert({
      user_id: authData.user.id,
      current_streak: 0,
      longest_streak: 0,
      total_trades_logged: 0,
      total_journals_written: 0,
      level: 1,
      experience_points: 0,
    })

  if (gamificationError) {
    console.error('Failed to create gamification record:', gamificationError)
    // Don't fail the signup
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
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
