'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Plus, Settings, FileText, Sparkles, LogOut, Save, Check } from 'lucide-react'
import Link from 'next/link'
import type { GeneratedPersona } from '@/lib/persona/generator'
import { PersonaEditor } from '@/components/persona/PersonaEditor'
import { DebugPanel } from '@/components/debug/DebugPanel'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [persona, setPersona] = useState<GeneratedPersona | null>(null)
  const [editedPersona, setEditedPersona] = useState<GeneratedPersona | null>(null)
  const [youtubeData, setYoutubeData] = useState<any>(null)
  const [personaRecord, setPersonaRecord] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      console.log('[Dashboard] Starting data fetch')
      const supabase = createClient()

      // Get user
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      console.log('[Dashboard] User fetched:', currentUser?.id)

      if (!currentUser) {
        console.log('[Dashboard] No user found, redirecting to login')
        router.push('/login')
        return
      }

      setUser(currentUser)

      // Store userId and simple token in localStorage for extension access
      if (typeof window !== 'undefined') {
        localStorage.setItem('twin_user_id', currentUser.id)
        // Generate a simple session token (just base64 encoded userId + timestamp)
        // This is not super secure but sufficient for extension communication
        const sessionToken = btoa(`${currentUser.id}:${Date.now()}`)
        localStorage.setItem('twin_session_token', sessionToken)
        console.log('[Dashboard] Stored userId and token in localStorage for extension')
      }

      // Get user persona from user_personas table
      const { data: personaData, error: personaError } = await supabase
        .from('user_personas')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      console.log('[Dashboard] Persona record fetched:', {
        found: !!personaData,
        error: personaError?.message,
        hasPersonaData: personaData?.persona && Object.keys(personaData.persona).length > 0
      })

      if (personaError) {
        console.error('[Dashboard] Error fetching persona:', personaError)
      }

      setPersonaRecord(personaData)

      // Check if user has completed onboarding
      const hasPersona = personaData?.persona && Object.keys(personaData.persona).length > 0

      if (!hasPersona) {
        console.log('[Dashboard] No persona found, redirecting to onboarding')
        router.push('/onboarding/connect')
        return
      }

      setPersona(personaData.persona)
      setEditedPersona(personaData.persona)

      // Check for connected accounts (YouTube data)
      const { data: ytData, error: ytError } = await supabase
        .from('user_youtube_data')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      console.log('[Dashboard] YouTube data fetched:', {
        found: !!ytData,
        error: ytError?.message,
        subscriptionCount: ytData?.subscriptions?.length || 0
      })

      setYoutubeData(ytData)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSave = async () => {
    if (!editedPersona) return

    console.log('[Dashboard] Saving persona updates')
    setSaving(true)

    try {
      const supabase = createClient()

      // Save the edited persona
      const { error } = await supabase
        .from('user_personas')
        .update({
          persona: editedPersona,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('[Dashboard] Error saving persona:', error)
        throw error
      }

      // Also update auth.user_metadata with preferred name
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          preferred_name: editedPersona.name,
        }
      })

      if (authError) {
        console.error('[Dashboard] Error updating user metadata:', authError)
      }

      console.log('[Dashboard] Persona saved successfully')
      setPersona(editedPersona)
      alert('Persona updated successfully!')
    } catch (error) {
      console.error('[Dashboard] Save failed:', error)
      alert('Failed to save persona. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const hasChanges = persona && editedPersona && JSON.stringify(persona) !== JSON.stringify(editedPersona)
  const connectedAccountsCount = youtubeData ? 1 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!persona || !editedPersona) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Twin</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {editedPersona.name || user.email}</h1>
          <p className="text-muted-foreground mt-2">
            Manage your AI persona and memories from your dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Persona
              </CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">
                {editedPersona.name || 'Default'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Memories
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total stored memories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Connected Accounts
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedAccountsCount}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Goals
              </CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {editedPersona.currentGoals?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active goals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Memories</CardTitle>
              <CardDescription>
                Add, edit, or delete your stored memories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/memories">
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Memories
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect Accounts</CardTitle>
              <CardDescription>
                Link more accounts to enrich your persona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding/connect">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Connect More
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regenerate Persona</CardTitle>
              <CardDescription>
                Create a new persona from your connected data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/onboarding/generate">
                <Button className="w-full" variant="outline">
                  <Brain className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Persona Editor */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Edit Your Persona</h2>
          <p className="text-muted-foreground mb-6">
            Update your persona details below. Changes are saved when you click the Save button.
          </p>
          <PersonaEditor
            persona={editedPersona}
            onUpdate={setEditedPersona}
          />

        </div>

        {/* Sticky Save/Discard Buttons */}
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t shadow-lg mt-6 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
              <div>
                {hasChanges ? (
                  <>
                    <p className="font-semibold text-orange-600">You have unsaved changes</p>
                    <p className="text-sm text-muted-foreground">
                      Click save to update your persona
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">All changes saved</p>
                    <p className="text-sm text-muted-foreground">
                      Edit any field above to make changes
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {hasChanges && (
                  <Button
                    variant="outline"
                    onClick={() => setEditedPersona(persona)}
                    disabled={saving}
                  >
                    Discard Changes
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-pulse" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <div className="mt-6">
          <DebugPanel
            data={{
              user: {
                id: user.id,
                email: user.email,
                metadata: user.user_metadata
              },
              personaRecord: {
                id: personaRecord?.id,
                created_at: personaRecord?.created_at,
                updated_at: personaRecord?.updated_at
              },
              youtubeData: youtubeData ? {
                hasData: true,
                subscriptionCount: youtubeData.subscriptions?.length || 0,
                playlistCount: youtubeData.playlists?.length || 0,
                likesCount: youtubeData.liked_videos?.length || 0
              } : null,
              persona: {
                original: persona,
                edited: editedPersona,
                hasChanges
              }
            }}
            title="Dashboard Debug Data"
            description="User data, persona record, and YouTube connection status"
          />
        </div>
      </main>
    </div>
  )
}
