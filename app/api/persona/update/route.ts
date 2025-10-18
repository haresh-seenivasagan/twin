import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Parse request body
    const { persona } = await request.json()

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona data is required' },
        { status: 400 }
      )
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

    return NextResponse.json({
      success: true,
      persona,
    })
  } catch (error) {
    console.error('Persona update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update persona' },
      { status: 500 }
    )
  }
}
