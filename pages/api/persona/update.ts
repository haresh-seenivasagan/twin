import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'

// Required for Cloudflare Workers deployment

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Parse request body
    const { persona } = req.body

    if (!persona) {
      return res.status(400).json({ error: 'Persona data is required' })
    }

    // Update persona in Supabase
    const { error: updateError } = await supabase
      .from('user_personas')
      .update({
        persona,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update persona:', updateError)
      throw new Error('Failed to update persona')
    }

    // Also update the profiles table for backward compatibility
    await supabase
      .from('profiles')
      .update({
        persona,
      })
      .eq('id', user.id)

    return res.status(200).json({
      success: true,
      persona,
    })
  } catch (error) {
    console.error('Persona update error:', error)
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update persona' })
  }
}
