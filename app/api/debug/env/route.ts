import { NextResponse } from 'next/server'

/**
 * Debug endpoint to verify environment variables are set correctly
 * GET /api/debug/env
 *
 * This helps other developers troubleshoot setup issues
 */
export async function GET() {
  const env = {
    // Public env vars (safe to expose)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK,

    // Secret env vars (only check if they exist, don't expose values)
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 15)}...`
      : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
    MCP_ADMIN_API_KEY: process.env.MCP_ADMIN_API_KEY ? 'SET' : 'NOT SET',
    MCP_SERVER_URL: process.env.MCP_SERVER_URL,
    YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI,
  }

  // Check for common issues - BE VERY SPECIFIC
  const issues = []
  const missing = []

  // Critical variables (app won't work without these)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
    issues.push({
      severity: 'CRITICAL',
      variable: 'NEXT_PUBLIC_SUPABASE_URL',
      message: 'Supabase URL is not set',
      fix: 'Add to .env.local:\nNEXT_PUBLIC_SUPABASE_URL=https://lbyicktafbnqwbieffbj.supabase.co',
      current_value: 'undefined',
    })
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    issues.push({
      severity: 'CRITICAL',
      variable: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      message: 'Supabase anon key is not set',
      fix: 'Add to .env.local:\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      current_value: 'undefined',
    })
  }

  // Optional variables (features won't work but app will run)
  if (!process.env.GOOGLE_CLIENT_ID) {
    missing.push('GOOGLE_CLIENT_ID')
    issues.push({
      severity: 'WARNING',
      variable: 'GOOGLE_CLIENT_ID',
      message: 'YouTube OAuth will not work',
      fix: 'Add to .env.local:\nGOOGLE_CLIENT_ID=your-client-id',
      current_value: 'undefined',
    })
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    missing.push('GOOGLE_CLIENT_SECRET')
    issues.push({
      severity: 'WARNING',
      variable: 'GOOGLE_CLIENT_SECRET',
      message: 'YouTube OAuth will not work',
      fix: 'Add to .env.local:\nGOOGLE_CLIENT_SECRET=your-secret',
      current_value: 'undefined',
    })
  }

  if (!process.env.MCP_SERVER_URL) {
    missing.push('MCP_SERVER_URL')
    issues.push({
      severity: 'INFO',
      variable: 'MCP_SERVER_URL',
      message: 'AI persona generation will use fallback',
      fix: 'Add to .env.local:\nMCP_SERVER_URL=https://twin-mcp-persona.erniesg.workers.dev/mcp',
      current_value: 'undefined',
    })
  }

  const status = issues.some(i => i.severity === 'CRITICAL') ? 'ERROR' :
                 issues.length > 0 ? 'WARNING' : 'OK'

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      platform: process.platform,
    },
    summary: {
      total_issues: issues.length,
      critical_issues: issues.filter(i => i.severity === 'CRITICAL').length,
      missing_variables: missing,
    },
    variables: env,
    issues,
    quick_fix: issues.length > 0
      ? `Copy these to your .env.local:\n\n${issues.map(i => i.fix).join('\n\n')}`
      : 'All environment variables are set correctly!',
    instructions: {
      message: 'If you see issues, check your .env.local file',
      steps: [
        '1. Copy .env.local.example to .env.local',
        '2. Fill in the missing variables shown above',
        '3. Restart your dev server: pnpm dev',
        '4. Refresh this page to verify',
      ],
      links: {
        supabase: 'https://supabase.com/dashboard/project/lbyicktafbnqwbieffbj/settings/api',
        google_console: 'https://console.cloud.google.com/apis/credentials',
      }
    }
  })
}
