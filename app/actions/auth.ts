'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Validate inputs
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!name || name.trim().length < 2) {
    return { error: 'Name must be at least 2 characters' }
  }

  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' }
  }

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const data = {
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
        preferred_name: name.trim(),
      }
    }
  }

  console.log('[AUTH] Attempting signup for:', data.email)
  console.log('[AUTH] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('[AUTH] Supabase ANON key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    console.error('[AUTH] Signup failed:', {
      message: error.message,
      status: error.status,
      code: (error as any).code,
      details: error,
    })
    return {
      error: error.message,
      debug: {
        status: error.status,
        code: (error as any).code,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      }
    }
  }

  console.log('[AUTH] Signup successful for user:', authData.user?.id)

  // Create profile for the new user
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        persona: {},
        llm_preferences: {},
        custom_data: {},
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding/connect')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function loginWithProvider(provider: 'google' | 'github') {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}