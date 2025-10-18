import { getAllEmails, getToken } from '@/lib/youtube/token-store'

export async function GET() {
  const emails = getAllEmails()

  if (emails.length === 0) {
    return new Response(
      JSON.stringify({
        message: 'No YouTube accounts connected',
        connected_accounts: 0,
        accounts: [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Get token data for each email (without exposing full tokens)
  const accountsData = emails.map(email => {
    const token = getToken(email)
    return {
      email,
      has_access_token: !!token?.access_token,
      has_refresh_token: !!token?.refresh_token,
      expires_at: token?.expires_at ? new Date(token.expires_at).toISOString() : null,
      is_expired: token?.expires_at ? Date.now() > token.expires_at : null,
    }
  })

  return new Response(
    JSON.stringify({
      message: 'YouTube accounts connected',
      connected_accounts: emails.length,
      accounts: accountsData,
      timestamp: new Date().toISOString(),
    }, null, 2),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
