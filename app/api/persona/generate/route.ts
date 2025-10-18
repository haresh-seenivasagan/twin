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
    const body = await request.json() as {
      custom_instructions?: string
      customInstructions?: string
      focus_areas?: string[]
      focusAreas?: string[]
    }
    const custom_instructions = body.custom_instructions || body.customInstructions
    const focus_areas = body.focus_areas || body.focusAreas

    // Fetch user's connected account data from Supabase
    // Try user_id first (preferred), fallback to email (for data collected during onboarding)
    let youtubeData = null

    console.log('Fetching YouTube data for user:', {
      user_id: user.id,
      email: user.email
    })

    // First attempt: Query by user_id (if YouTube data is already linked)
    const { data: dataByUserId, error: userIdError } = await supabase
      .from('user_youtube_data')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('Query by user_id result:', {
      found: !!dataByUserId,
      error: userIdError?.message,
      subscriptionCount: dataByUserId?.subscriptions?.length || 0
    })

    if (dataByUserId) {
      youtubeData = dataByUserId
    } else {
      // Fallback: Query by email (for pre-signup YouTube data)
      const { data: dataByEmail, error: emailError } = await supabase
        .from('user_youtube_data')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()

      console.log('Query by email result:', {
        found: !!dataByEmail,
        error: emailError?.message,
        subscriptionCount: dataByEmail?.subscriptions?.length || 0
      })

      if (dataByEmail) {
        youtubeData = dataByEmail

        // Link this data to user_id for future queries
        await supabase
          .from('user_youtube_data')
          .update({ user_id: user.id, updated_at: new Date().toISOString() })
          .eq('email', user.email)
          .is('user_id', null)
      }
    }

    // Build connected account data structure
    const accountData: ConnectedAccountData = {}

    if (youtubeData) {
      accountData.youtube = {
        subscriptions: youtubeData.subscriptions || [],
        playlists: youtubeData.playlists || [],
        likes: youtubeData.liked_videos || [],
      }
    }

    console.log('=== YouTube Data from Supabase ===')
    console.log('Raw youtubeData:', {
      exists: !!youtubeData,
      email: youtubeData?.email,
      user_id: youtubeData?.user_id,
      hasSubscriptions: !!youtubeData?.subscriptions,
      hasPlaylists: !!youtubeData?.playlists,
      hasLikes: !!youtubeData?.liked_videos,
      subscriptionCount: youtubeData?.subscriptions?.length || 0,
      playlistCount: youtubeData?.playlists?.length || 0,
      likesCount: youtubeData?.liked_videos?.length || 0,
    })

    if (youtubeData?.subscriptions && youtubeData.subscriptions.length > 0) {
      console.log('Sample subscriptions (first 3):', youtubeData.subscriptions.slice(0, 3))
    }

    console.log('=== Account Data Being Passed to MCP ===')
    console.log({
      hasYoutube: !!accountData.youtube,
      subscriptionCount: accountData.youtube?.subscriptions?.length || 0,
      playlistCount: accountData.youtube?.playlists?.length || 0,
      likesCount: accountData.youtube?.likes?.length || 0,
      focusAreas: focus_areas,
      hasCustomInstructions: !!custom_instructions
    })

    // Log first few items for debugging
    if (accountData.youtube?.subscriptions && accountData.youtube.subscriptions.length > 0) {
      console.log('Sample subscription data being sent:',
        accountData.youtube.subscriptions.slice(0, 2).map(s => ({
          title: s?.snippet?.title || s,
          channelId: s?.snippet?.resourceId?.channelId
        }))
      )
    }

    // Get user's preferred name from auth metadata
    const userName = user.user_metadata?.preferred_name || user.user_metadata?.full_name || user.email?.split('@')[0]

    // Generate persona using AI (or mock for now)
    const persona = await generatePersonaFromAccounts(
      accountData,
      custom_instructions,
      focus_areas,
      userName
    )

    console.log('Generated persona:', {
      hasPersona: !!persona,
      interests: persona?.interests?.length || 0,
      goals: persona?.currentGoals?.length || 0
    })

    // Store generated persona in Supabase
    const { data: savedPersona, error: saveError } = await supabase
      .from('user_personas')
      .upsert({
        user_id: user.id,
        persona: persona,  // Column is 'persona', not 'persona_data'
        custom_instructions,
        focus_areas,
        // created_at and updated_at are auto-set by database
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
    const errorStack = error instanceof Error ? error.stack : undefined

    console.error('Persona generation error:', {
      message: errorMessage,
      stack: errorStack?.substring(0, 500),
    })

    return new Response(
      JSON.stringify({
        error: 'Failed to generate persona',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack?.substring(0, 500) : undefined,
        timestamp: new Date().toISOString(),
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
        persona: personaRecord.persona,  // Column is 'persona', not 'persona_data'
        custom_instructions: personaRecord.custom_instructions,
        focus_areas: personaRecord.focus_areas,
        created_at: personaRecord.created_at,
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
