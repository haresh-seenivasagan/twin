'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Youtube, Mail, Linkedin, Check, ChevronRight, Sparkles } from 'lucide-react'

interface AccountConnection {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
  description: string
  dataPoints: string[]
}

export default function ConnectAccountsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
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
      name: 'Gmail',
      icon: <Mail className="h-6 w-6" />,
      connected: false,
      description: 'Connect Gmail to understand your communication style and professional context',
      dataPoints: ['Email patterns', 'Professional contacts', 'Communication style', 'Topics of interest']
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="h-6 w-6" />,
      connected: false,
      description: 'Connect LinkedIn to extract your professional background and skills',
      dataPoints: ['Work experience', 'Skills', 'Professional network', 'Career goals']
    }
  ])

  const handleConnect = async (accountId: string) => {
    setLoading(accountId)

    // Mock connection - in production, this would trigger OAuth flow
    setTimeout(() => {
      setConnections(prev =>
        prev.map(conn =>
          conn.id === accountId ? { ...conn, connected: true } : conn
        )
      )
      setLoading(null)
    }, 1500)
  }

  const handleContinue = () => {
    router.push('/onboarding/generate')
  }

  const hasConnections = connections.some(c => c.connected)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
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

        {/* Connection Cards */}
        <div className="space-y-4 mb-8">
          {connections.map((account) => (
            <Card key={account.id} className={account.connected ? 'border-green-500' : ''}>
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
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleConnect(account.id)}
                      disabled={loading === account.id}
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
          ))}
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
                Generate My Persona
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              'Connect at least one account'
            )}
          </Button>
        </div>

        {/* Mock Data Notice */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Development Mode:</strong> OAuth connections are mocked for now. In production,
            these will connect to real YouTube, Gmail, and LinkedIn APIs.
          </p>
        </div>
      </main>
    </div>
  )
}