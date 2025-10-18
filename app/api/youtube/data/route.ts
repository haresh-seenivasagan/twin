import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')

  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email parameter required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const supabase = await createClient()

    // Fetch YouTube data for this email
    const { data, error } = await supabase
      .from('user_youtube_data')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      return new Response(
        JSON.stringify({
          error: 'No data found for this email',
          details: error.message,
          email,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Return the full data with stats
    const stats = {
      subscriptions_count: Array.isArray(data.subscriptions) ? data.subscriptions.length : 0,
      playlists_count: Array.isArray(data.playlists) ? data.playlists.length : 0,
      liked_videos_count: Array.isArray(data.liked_videos) ? data.liked_videos.length : 0,
    }

    return new Response(
      JSON.stringify({
        email: data.email,
        stats,
        subscriptions: data.subscriptions,
        playlists: data.playlists,
        liked_videos: data.liked_videos,
        last_refreshed: data.last_refreshed,
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch YouTube data',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
