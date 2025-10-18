import { createClient } from '@/lib/supabase/server'
import { getToken } from '@/lib/youtube/token-store'
import { YouTubeClient } from '@/lib/youtube/client'

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

    // Get YouTube token for this user
    const token = getToken(user.email!)

    if (!token || !token.access_token) {
      return new Response(
        JSON.stringify({
          error: 'YouTube account not connected',
          message: 'Please connect your YouTube account first',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if token is expired
    if (token.expires_at && Date.now() > token.expires_at) {
      return new Response(
        JSON.stringify({
          error: 'YouTube token expired',
          message: 'Please reconnect your YouTube account',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch all YouTube data
    const youtubeClient = new YouTubeClient(token.access_token)

    const [subscriptions, playlists, likedVideos] = await Promise.all([
      youtubeClient.getSubscriptions(50),
      youtubeClient.getPlaylists(50),
      youtubeClient.getLikedVideos(10),
    ])

    // Store in Supabase (update user_youtube_data table)
    const youtubeData = {
      user_id: user.id,
      email: user.email,
      subscriptions,
      playlists,
      liked_videos: likedVideos,
      last_refreshed: new Date().toISOString(),
    }

    // Upsert to Supabase
    const { error: upsertError } = await supabase
      .from('user_youtube_data')
      .upsert(youtubeData, {
        onConflict: 'user_id',
      })

    if (upsertError) {
      console.error('Failed to store YouTube data:', upsertError)
      // Continue even if storage fails - at least return the data
    }

    return new Response(
      JSON.stringify({
        message: 'YouTube data refreshed successfully',
        data: {
          subscriptions_count: subscriptions.length,
          playlists_count: playlists.length,
          liked_videos_count: likedVideos.length,
        },
        stored_in_supabase: !upsertError,
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
        error: 'Failed to refresh YouTube data',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
