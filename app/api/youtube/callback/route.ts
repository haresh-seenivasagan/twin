import { NextRequest, NextResponse } from 'next/server'
import { storeToken } from '@/lib/youtube/token-store'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code provided' },
      { status: 400 }
    )
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'OAuth credentials not configured' },
      { status: 500 }
    )
  }

  try {
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
    const { access_token, refresh_token } = tokenData

    // Get user info
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userInfoResponse.json()
    const email = userInfo.email

    // Store tokens
    storeToken(email, {
      access_token,
      refresh_token,
    })

    // Redirect to onboarding/connect page with success
    const redirectUrl = new URL('/onboarding/connect', request.nextUrl.origin)
    redirectUrl.searchParams.set('youtube', 'connected')
    redirectUrl.searchParams.set('email', email)

    return NextResponse.redirect(redirectUrl.toString())
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)

    // Redirect to onboarding/connect with error
    const redirectUrl = new URL('/onboarding/connect', request.nextUrl.origin)
    redirectUrl.searchParams.set('error', 'youtube_auth_failed')

    return NextResponse.redirect(redirectUrl.toString())
  }
}
