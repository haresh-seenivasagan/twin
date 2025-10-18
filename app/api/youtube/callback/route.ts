import { createClient } from '@/lib/supabase/server'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return new Response(
      JSON.stringify({ error: `OAuth error: ${error}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Validate authorization code
  if (!code) {
    return new Response(
      JSON.stringify({ error: 'No authorization code provided' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Check environment variables
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Google OAuth credentials not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
    }

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userInfoResponse.json() as {
      email: string
      name?: string
      picture?: string
    }
    const email = userInfo.email

    // Fetch YouTube data immediately using the access token
    const youtubeDataPromises = [
      // Fetch subscriptions
      fetch('https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      // Fetch playlists
      fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      // Fetch liked videos (use special playlist ID)
      fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=LL&maxResults=10', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
    ]

    const [subsResponse, playlistsResponse, likedResponse] = await Promise.all(youtubeDataPromises)

    // Log response status for debugging
    console.log('YouTube API responses:', {
      subscriptions: subsResponse.status,
      playlists: playlistsResponse.status,
      liked: likedResponse.status,
    })

    type YouTubeAPIResponse = {
      items?: any[]
      error?: string
      status?: number
    }

    const youtubeData: {
      subscriptions: YouTubeAPIResponse
      playlists: YouTubeAPIResponse
      liked_videos: YouTubeAPIResponse
    } = {
      subscriptions: subsResponse.ok ? await subsResponse.json() : { error: await subsResponse.text(), status: subsResponse.status },
      playlists: playlistsResponse.ok ? await playlistsResponse.json() : { error: await playlistsResponse.text(), status: playlistsResponse.status },
      liked_videos: likedResponse.ok ? await likedResponse.json() : { error: await likedResponse.text(), status: likedResponse.status },
    }

    console.log('YouTube data fetched:', {
      subs: youtubeData.subscriptions?.items?.length || 0,
      playlists: youtubeData.playlists?.items?.length || 0,
      liked: youtubeData.liked_videos?.items?.length || 0,
      errors: {
        subs: youtubeData.subscriptions?.error || null,
        playlists: youtubeData.playlists?.error || null,
        liked: youtubeData.liked_videos?.error || null,
      }
    })

    // Store YouTube data (not tokens) in Supabase for persona generation
    const supabase = await createClient()

    // Store the full response data (including any errors) for debugging
    const dataToStore = {
      email,
      subscriptions: youtubeData.subscriptions?.items || youtubeData.subscriptions || [],
      playlists: youtubeData.playlists?.items || youtubeData.playlists || [],
      liked_videos: youtubeData.liked_videos?.items || youtubeData.liked_videos || [],
      last_refreshed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('Storing to Supabase:', {
      email,
      subs_count: Array.isArray(dataToStore.subscriptions) ? dataToStore.subscriptions.length : 'not array',
      playlists_count: Array.isArray(dataToStore.playlists) ? dataToStore.playlists.length : 'not array',
      liked_count: Array.isArray(dataToStore.liked_videos) ? dataToStore.liked_videos.length : 'not array',
    })

    // Use email as the key - no auth required for onboarding
    const { error: dataError } = await supabase
      .from('user_youtube_data')
      .upsert(dataToStore, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })

    if (dataError) {
      console.error('Failed to store YouTube data:', dataError)
      // Include the error in redirect for debugging
      return Response.redirect(
        `${url.origin}/onboarding/connect?error=storage_failed&message=${encodeURIComponent(dataError.message)}`,
        307
      )
    }

    // Redirect back to onboarding/connect with success parameters
    const stats = {
      subscriptions: youtubeData.subscriptions?.items?.length || 0,
      playlists: youtubeData.playlists?.items?.length || 0,
      liked: youtubeData.liked_videos?.items?.length || 0,
    }

    return Response.redirect(
      `${url.origin}/onboarding/connect?youtube=connected&email=${encodeURIComponent(email)}&subs=${stats.subscriptions}&playlists=${stats.playlists}&liked=${stats.liked}`,
      307
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('YouTube OAuth callback error:', errorMessage)

    // Redirect back to connect page with error
    const url = new URL(request.url)
    return Response.redirect(
      `${url.origin}/onboarding/connect?error=youtube_auth_failed&message=${encodeURIComponent(errorMessage)}`,
      307
    )
  }
}
