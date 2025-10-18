import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Plus, Settings, FileText, Sparkles, LogOut } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user persona from user_personas table
  const { data: personaRecord } = await supabase
    .from('user_personas')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Check if user has completed onboarding
  const hasPersona = personaRecord?.persona && Object.keys(personaRecord.persona).length > 0

  if (!hasPersona) {
    redirect('/onboarding/connect')
  }

  // Use persona from user_personas table
  const persona = personaRecord?.persona

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
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {persona?.name || user.email}</h1>
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
                {persona?.name || 'Default'}
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
              <div className="text-2xl font-bold">0</div>
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
                {persona?.currentGoals?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active goals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Edit Persona</CardTitle>
              <CardDescription>
                Update your interests, goals, and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/persona/edit">
                <Button className="w-full">
                  <Brain className="mr-2 h-4 w-4" />
                  Edit Persona
                </Button>
              </Link>
            </CardContent>
          </Card>

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
        </div>

        {/* Current Persona Display */}
        {persona && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Current Persona</CardTitle>
              <CardDescription>
                This is how AI systems will understand and remember you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">Name:</span> {persona.name || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Profession:</span> {persona.profession || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Languages:</span> {persona.languages?.join(', ') || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Interests:</span> {persona.interests?.join(', ') || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Current Goals:</span>
                  <ul className="list-disc list-inside mt-1">
                    {persona.currentGoals?.map((goal: string, index: number) => (
                      <li key={index}>{goal}</li>
                    )) || <li>No goals set</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}