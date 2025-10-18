export const runtime = 'edge'

import { createClient } from '@/lib/supabase/server'
import { getToken } from '@/lib/youtube/token-store'
import { YouTubeClient } from '@/lib/youtube/client'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const maxResults = parseInt(url.searchParams.get('max_results') || '50', 10)

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

    // Fetch subscriptions using YouTube client
    const youtubeClient = new YouTubeClient(token.access_token)
    const subscriptions = await youtubeClient.getSubscriptions(maxResults)

    return new Response(
      JSON.stringify({
        subscriptions,
        total_fetched: subscriptions.length,
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
        error: 'Failed to fetch subscriptions',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
