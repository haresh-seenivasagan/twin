import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized - please log in' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      )
    }

    // Fetch existing persona from Supabase
    const { data: personaRecord, error: fetchError } = await supabase
      .from('user_personas')
      .select('persona, custom_instructions, focus_areas, created_at, updated_at')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !personaRecord) {
      return Response.json(
        {
          error: 'No persona found',
          has_persona: false
        },
        {
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      )
    }

    return Response.json(
      {
        success: true,
        persona: personaRecord.persona,
        custom_instructions: personaRecord.custom_instructions,
        focus_areas: personaRecord.focus_areas,
        created_at: personaRecord.created_at,
        updated_at: personaRecord.updated_at
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    )
  } catch (error) {
    console.error('[API] Get persona error:', error)
    return Response.json(
      { error: 'Failed to retrieve persona' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    )
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  })
}
