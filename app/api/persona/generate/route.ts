import { createClient } from '@/lib/supabase/server'
import { generatePersonaFromAccounts, type ConnectedAccountData } from '@/lib/persona/generator'

export async function POST(request: Request) {
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
    const body = await request.json()
    const { custom_instructions, focus_areas } = body

    // Fetch user's connected account data from Supabase
    const { data: youtubeData } = await supabase
      .from('user_youtube_data')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Build connected account data structure
    const accountData: ConnectedAccountData = {}

    if (youtubeData) {
      accountData.youtube = {
        subscriptions: youtubeData.subscriptions?.map((s: any) => s.snippet?.title || '') || [],
        watchHistory: [],
        likes: youtubeData.liked_videos?.map((v: any) => v.snippet?.title || '') || [],
      }
    }

    // Generate persona using AI (or mock for now)
    const persona = await generatePersonaFromAccounts(
      accountData,
      custom_instructions,
      focus_areas
    )

    // Store generated persona in Supabase
    const { data: savedPersona, error: saveError } = await supabase
      .from('user_personas')
      .upsert({
        user_id: user.id,
        persona_data: persona,
        custom_instructions,
        focus_areas,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save persona:', saveError)
      // Continue even if save fails - return the generated persona
    }

    return new Response(
      JSON.stringify({
        message: 'Persona generated successfully',
        persona,
        saved_to_database: !saveError,
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
        error: 'Failed to generate persona',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export async function GET() {
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

    // Fetch existing persona from Supabase
    const { data: personaRecord, error: fetchError } = await supabase
      .from('user_personas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !personaRecord) {
      return new Response(
        JSON.stringify({
          message: 'No persona found',
          has_persona: false,
          user_email: user.email,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Persona retrieved successfully',
        persona: personaRecord.persona_data,
        custom_instructions: personaRecord.custom_instructions,
        focus_areas: personaRecord.focus_areas,
        generated_at: personaRecord.generated_at,
        updated_at: personaRecord.updated_at,
        has_persona: true,
        user_email: user.email,
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
        error: 'Failed to retrieve persona',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
