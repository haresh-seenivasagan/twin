import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  const debug: Record<string, any> = {
    timestamp: new Date().toISOString(),
    received_code: code ? 'YES (first 20 chars): ' + code.substring(0, 20) + '...' : 'NO',
    received_error: error || 'NO',
    client_id: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    client_secret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI,
    all_params: Object.fromEntries(url.searchParams.entries()),
  }

  // Also check if we can access Supabase
  try {
    const supabase = await createClient()
    const { data, error: dbError } = await supabase.from('user_youtube_data').select('count').limit(1)
    debug.supabase_connection = dbError ? `ERROR: ${dbError.message}` : 'OK'
  } catch (e) {
    debug.supabase_connection = `EXCEPTION: ${e instanceof Error ? e.message : 'Unknown'}`
  }

  return new Response(JSON.stringify(debug, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
