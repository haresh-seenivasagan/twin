import { createClient } from '@/lib/supabase/server'

export async function PUT(request: Request) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - please log in' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const body = await request.json() as {
      persona_data?: any
      persona?: any
      custom_instructions?: string
      customInstructions?: string
      focus_areas?: string[]
      focusAreas?: string[]
    }
    const persona_data = body.persona_data || body.persona
    const custom_instructions = body.custom_instructions || body.customInstructions
    const focus_areas = body.focus_areas || body.focusAreas

    if (!persona_data) {
      return new Response(
        JSON.stringify({ error: 'persona_data is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Update persona in Supabase
    const { data: updatedPersona, error: updateError } = await supabase
      .from('user_personas')
      .upsert({
        user_id: user.id,
        persona: persona_data,  // Column is 'persona', not 'persona_data'
        custom_instructions,
        focus_areas,
        // updated_at is auto-set by database
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update persona: ${updateError.message}`)
    }

    // Sync name back to auth.user_metadata for future persona generations
    if (persona_data?.name && persona_data.name !== user.user_metadata?.preferred_name) {
      await supabase.auth.updateUser({
        data: {
          preferred_name: persona_data.name,
          full_name: persona_data.name,
        }
      })
      console.log(`Updated user metadata with name: ${persona_data.name}`)
    }

    return new Response(
      JSON.stringify({
        message: 'Persona updated successfully',
        persona: updatedPersona,
        user_email: user.email,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({
        error: 'Failed to update persona',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
