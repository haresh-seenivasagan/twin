import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return Response.json(
        { error: 'Token required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      )
    }

    // Decode token (userId:timestamp)
    let userId: string
    try {
      const decoded = atob(token)
      const [extractedUserId, timestamp] = decoded.split(':')
      userId = extractedUserId

      // Check if token is less than 24 hours old
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return Response.json(
          { error: 'Token expired' },
          {
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true'
            }
          }
        )
      }
    } catch (e) {
      return Response.json(
        { error: 'Invalid token' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      )
    }

    const supabase = await createClient()

    // Fetch persona from Supabase
    const { data: personaRecord, error: fetchError } = await supabase
      .from('user_personas')
      .select('persona, custom_instructions, focus_areas, created_at, updated_at')
      .eq('user_id', userId)
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
    console.error('[API] Get persona with token error:', error)
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
