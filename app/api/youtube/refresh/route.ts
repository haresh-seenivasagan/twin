import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { YouTubeClient } from '@/lib/youtube/client'

// Required for Cloudflare Workers deployment
export const runtime = 'edge'

/**
 * Refresh YouTube data using stored access token
 * GET /api/youtube/refresh
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

    // Get stored YouTube token
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_youtube_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'No YouTube token found. Please connect your YouTube account first.' },
        { status: 400 }
      )
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at)
    const now = new Date()

    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'YouTube token expired. Please reconnect your YouTube account.' },
        { status: 401 }
      )
    }

    // Fetch fresh YouTube data
    const youtubeClient = new YouTubeClient(tokenData.access_token)

    console.log('🔄 Refreshing YouTube data...')

    const [subscriptions, likedVideos, playlists] = await Promise.all([
      youtubeClient.getSubscriptions(),
      youtubeClient.getLikedVideos(),
      youtubeClient.getPlaylists(),
    ])

    console.log(`✅ Fetched ${subscriptions.length} subscriptions, ${likedVideos.length} liked videos, ${playlists.length} playlists`)

    // Update YouTube data in Supabase
    const youtubeData = {
      subscriptions,
      likedVideos,
      playlists,
      fetchedAt: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('user_personas')
      .update({
        youtube_data: youtubeData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update YouTube data:', updateError)
      throw new Error('Failed to save updated YouTube data')
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube data refreshed successfully',
      data: {
        subscriptions_count: subscriptions.length,
        liked_videos_count: likedVideos.length,
        playlists_count: playlists.length,
        fetched_at: youtubeData.fetchedAt,
      },
      debug_url: '/api/youtube/debug',
    })
  } catch (error) {
    console.error('YouTube refresh error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh YouTube data' },
      { status: 500 }
    )
  }
}
