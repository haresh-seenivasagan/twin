import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Required for Cloudflare Workers deployment
export const runtime = 'edge'

/**
 * Debug endpoint to view raw YouTube data collected from OAuth
 * GET /api/youtube/debug
 */
export async function GET(request: NextRequest) {
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

    // Get YouTube data from Supabase
    const { data: personaData, error: fetchError } = await supabase
      .from('user_personas')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json({
        message: 'No YouTube data found yet',
        hint: 'Connect your YouTube account at /onboarding/connect',
        user_id: user.id,
        error: fetchError.message,
      })
    }

    const youtubeData = personaData?.youtube_data

    // Format the response for easy viewing
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      youtube_data: {
        fetched_at: youtubeData?.fetchedAt,
        subscriptions: {
          count: youtubeData?.subscriptions?.length || 0,
          sample: youtubeData?.subscriptions?.slice(0, 5) || [],
          all: youtubeData?.subscriptions || [],
        },
        liked_videos: {
          count: youtubeData?.likedVideos?.length || 0,
          sample: youtubeData?.likedVideos?.slice(0, 5) || [],
          all: youtubeData?.likedVideos || [],
        },
        playlists: {
          count: youtubeData?.playlists?.length || 0,
          sample: youtubeData?.playlists?.slice(0, 5) || [],
          all: youtubeData?.playlists || [],
        },
      },
      raw_persona_data: personaData,
      instructions: {
        message: 'This is the raw YouTube data we collected from your account',
        endpoints: {
          '/api/youtube/login': 'Initiate YouTube OAuth',
          '/api/youtube/callback': 'OAuth callback (fetches data)',
          '/api/youtube/debug': 'View collected data (current page)',
          '/api/youtube/refresh': 'Re-fetch YouTube data',
        },
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
