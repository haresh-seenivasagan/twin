import { NextRequest, NextResponse } from 'next/server'
import { getToken } from '@/lib/youtube/token-store'
import { YouTubeClient } from '@/lib/youtube/client'
// Required for Cloudflare Workers deployment
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email')
  const maxResults = parseInt(searchParams.get('maxResults') || '50')

  if (!email) {
    return NextResponse.json(
      { error: 'Email parameter required' },
      { status: 400 }
    )
  }

  const tokenData = getToken(email)

  if (!tokenData) {
    return NextResponse.json(
      { error: 'User not authenticated. Please login first.' },
      { status: 401 }
    )
  }

  try {
    const client = new YouTubeClient(tokenData.access_token)
    const playlists = await client.getPlaylists(maxResults)

    return NextResponse.json({
      email,
      count: playlists.length,
      playlists,
    })
  } catch (error) {
    console.error('Failed to fetch playlists:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch playlists' },
      { status: 500 }
    )
  }
}
