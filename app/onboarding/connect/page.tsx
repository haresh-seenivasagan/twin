'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Youtube, Mail, Linkedin, Check, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import { InfinityIcon } from '@/components/ui/infinity-icon'

interface AccountConnection {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
  description: string
  dataPoints: string[]
}

function ConnectAccountsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [youtubeStats, setYoutubeStats] = useState<{subs: number, playlists: number, liked: number} | null>(null)
  const [hasExistingPersona, setHasExistingPersona] = useState(false)
  const [connections, setConnections] = useState<AccountConnection[]>([
    {
      id: 'youtube',
      name: 'YouTube',
      icon: <Youtube className="h-6 w-6" />,
      connected: false,
      description: 'Connect your YouTube account to analyze your viewing history and preferences',
      dataPoints: ['Watch history', 'Subscriptions', 'Content preferences', 'Interests']
    },
    {
      id: 'gmail',
      name: 'Gmail (Coming Soon)',
      icon: <Mail className="h-6 w-6 opacity-50" />,
      connected: false,
      description: 'Connect Gmail to understand your communication style and professional context',
      dataPoints: ['Email patterns', 'Professional contacts', 'Communication style', 'Topics of interest']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn (Coming Soon)',
      icon: <Linkedin className="h-6 w-6 opacity-50" />,
      connected: false,
      description: 'Connect LinkedIn to extract your professional background and skills',
      dataPoints: ['Work experience', 'Skills', 'Professional network', 'Career goals']
    }
  ])

  // Check Supabase for existing connections on mount
  useEffect(() => {
    const checkExistingConnections = async () => {
      console.log('[Connect] Checking for existing connections')
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.log('[Connect] No user logged in')
        return
      }

      console.log('[Connect] User logged in:', user.id)

      // Check for YouTube connection
      const { data: youtubeData, error: ytError } = await supabase
        .from('user_youtube_data')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('[Connect] YouTube data query result:', {
        found: !!youtubeData,
        error: ytError?.message,
        email: youtubeData?.email
      })

      if (youtubeData && !ytError) {
        console.log('[Connect] Found existing YouTube connection')
        setConnectedEmail(youtubeData.email)
        setConnections(prev =>
          prev.map(conn =>
            conn.id === 'youtube' ? { ...conn, connected: true } : conn
          )
        )

        // Set YouTube stats
        setYoutubeStats({
          subs: youtubeData.subscriptions?.length || 0,
          playlists: youtubeData.playlists?.length || 0,
          liked: youtubeData.liked_videos?.length || 0,
        })
      }

      // Check if user has an existing persona
      const { data: personaData, error: personaError } = await supabase
        .from('user_personas')
        .select('persona')
        .eq('user_id', user.id)
        .single()

      console.log('[Connect] Persona check:', {
        found: !!personaData,
        error: personaError?.message,
        hasPersona: personaData?.persona && Object.keys(personaData.persona).length > 0
      })

      if (personaData?.persona && Object.keys(personaData.persona).length > 0) {
        console.log('[Connect] User has existing persona - button will say Regenerate')
        setHasExistingPersona(true)
      }
    }

    checkExistingConnections()
  }, [])

  // Check for OAuth callback success/error
  useEffect(() => {
    if (!searchParams) return

    const youtubeConnected = searchParams.get('youtube')
    const email = searchParams.get('email')
    const errorParam = searchParams.get('error')
    const errorMessage = searchParams.get('message')
    const subs = searchParams.get('subs')
    const playlists = searchParams.get('playlists')
    const liked = searchParams.get('liked')

    console.log('[Connect] OAuth callback params:', { youtubeConnected, email, errorParam, errorMessage, subs, playlists, liked })

    if (youtubeConnected === 'connected' && email) {
      console.log('[Connect] Setting YouTube as connected for:', email)
      setConnectedEmail(email)
      setConnections(prev =>
        prev.map(conn =>
          conn.id === 'youtube' ? { ...conn, connected: true } : conn
        )
      )

      // Store YouTube stats
      if (subs || playlists || liked) {
        setYoutubeStats({
          subs: parseInt(subs || '0'),
          playlists: parseInt(playlists || '0'),
          liked: parseInt(liked || '0'),
        })
      }
    }

    if (errorParam === 'youtube_auth_failed') {
      const fullError = errorMessage
        ? `Failed to connect YouTube: ${errorMessage}`
        : 'Failed to connect YouTube. Please try again.'
      console.error('[Connect] YouTube OAuth error:', fullError)
      setError(fullError)
    }
  }, [searchParams])

  const handleConnect = async (accountId: string) => {
    // Only allow YouTube connections for now
    if (accountId !== 'youtube') {
      return
    }

    setLoading(accountId)
    setError(null)

    // Real YouTube OAuth flow
    window.location.href = '/api/youtube/login'
  }

  const handleContinue = () => {
    // Pass connected email to next step for persona generation
    if (connectedEmail) {
      router.push(`/onboarding/generate?email=${encodeURIComponent(connectedEmail)}`)
    } else {
      router.push('/onboarding/generate')
    }
  }

  const hasConnections = connections.some(c => c.connected)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <InfinityIcon className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Twin</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Step 1 of 3</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Accounts</h1>
          <p className="text-lg text-muted-foreground">
            Link your accounts to automatically generate your AI persona. Your data stays private and secure.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {connectedEmail && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
              <strong>YouTube Connected!</strong> {connectedEmail}
            </p>
            {youtubeStats && (
              <div className="flex flex-wrap gap-4 text-xs text-green-700 dark:text-green-300">
                <span>📺 {youtubeStats.subs} subscriptions</span>
                <span>📋 {youtubeStats.playlists} playlists</span>
                <span>❤️ {youtubeStats.liked} liked videos</span>
              </div>
            )}
          </div>
        )}

        {/* Connection Cards */}
        <div className="space-y-4 mb-8">
          {connections.map((account) => {
            const isInactive = account.id !== 'youtube'
            return (
              <Card
                key={account.id}
                className={`${account.connected ? 'border-green-500' : ''} ${isInactive ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${account.connected ? 'bg-green-100 dark:bg-green-900' : 'bg-secondary'}`}>
                        {account.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {account.description}
                        </CardDescription>
                      </div>
                    </div>
                    {account.connected ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <Check className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Already Connected</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(account.id)}
                        disabled={loading === account.id || isInactive}
                        variant="outline"
                      >
                        {loading === account.id ? 'Connecting...' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {account.dataPoints.map((point, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-secondary rounded-full"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Card */}
        <Card className="mb-8 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>We'll analyze your connected accounts to understand your interests and background</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Generate a personalized AI persona based on your data</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>You can review and edit everything before saving</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Your data is encrypted and never shared with third parties</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Skip for now</Link>
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!hasConnections}
            className="min-w-[200px]"
          >
            {hasConnections ? (
              <>
                {hasExistingPersona ? 'Regenerate My Persona' : 'Generate My Persona'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Connect at least one account'
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

export default function ConnectAccountsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <InfinityIcon className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ConnectAccountsContent />
    </Suspense>
  )
}