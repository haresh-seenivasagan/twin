import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/server'
import { YouTubeClient } from '@/lib/youtube/client'

// Required for Cloudflare Workers deployment

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const code = req.query.code as string | undefined

  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' })
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'OAuth credentials not configured' })
  }

  try {
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Exchange code for tokens
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
      const error = await tokenResponse.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in, scope, token_type } = tokenData

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Save tokens to Supabase
    const { error: tokenSaveError } = await supabase
      .from('user_youtube_tokens')
      .upsert({
        user_id: user.id,
        access_token,
        refresh_token,
        token_type: token_type || 'Bearer',
        expires_at: expiresAt,
        scope,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })

    if (tokenSaveError) {
      console.error('Failed to save YouTube tokens:', tokenSaveError)
      throw new Error('Failed to save YouTube tokens')
    }

    // Fetch YouTube data using the YouTubeClient
    const youtubeClient = new YouTubeClient(access_token)

    const [subscriptions, likedVideos, playlists] = await Promise.all([
      youtubeClient.getSubscriptions(),
      youtubeClient.getLikedVideos(),
      youtubeClient.getPlaylists(),
    ])

    // Save YouTube data to user_personas table
    const youtubeData = {
      subscriptions,
      likedVideos,
      playlists,
      fetchedAt: new Date().toISOString(),
    }

    const { error: dataSaveError } = await supabase
      .from('user_personas')
      .upsert({
        user_id: user.id,
        youtube_data: youtubeData,
        persona: {}, // Empty for now, will be generated in the next step
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      })

    if (dataSaveError) {
      console.error('Failed to save YouTube data:', dataSaveError)
      throw new Error('Failed to save YouTube data')
    }

    // Redirect to onboarding/generate page with success
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host || 'localhost:3000'
    const origin = `${protocol}://${host}`
    const redirectUrl = new URL('/onboarding/generate', origin)
    redirectUrl.searchParams.set('youtube', 'connected')

    return res.redirect(307, redirectUrl.toString())
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)

    // Redirect to onboarding/connect with error
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host || 'localhost:3000'
    const origin = `${protocol}://${host}`
    const redirectUrl = new URL('/onboarding/connect', origin)
    redirectUrl.searchParams.set('error', 'youtube_auth_failed')

    return res.redirect(307, redirectUrl.toString())
  }
}
