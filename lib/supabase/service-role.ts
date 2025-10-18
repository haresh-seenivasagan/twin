import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role key
 * This bypasses Row Level Security (RLS) and should only be used in server-side code
 * for admin operations like inserting YouTube data during onboarding
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}


