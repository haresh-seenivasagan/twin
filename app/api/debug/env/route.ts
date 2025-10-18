export const runtime = 'edge'

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
    YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI || 'Not set',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set',
  }

  // Show partial values for verification (first 4 chars only)
  const partialValues: Record<string, string> = {}

  if (process.env.GOOGLE_CLIENT_ID) {
    partialValues.GOOGLE_CLIENT_ID_PREFIX = process.env.GOOGLE_CLIENT_ID.substring(0, 4) + '...'
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    partialValues.SUPABASE_URL_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 8) + '...'
  }

  return new Response(
    JSON.stringify({
      status: envVars,
      partial: partialValues,
      timestamp: new Date().toISOString()
    }, null, 2),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
