import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Sparkles, Shield, Zap, Globe, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Twin</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span className="text-primary font-medium">AI-Powered Persona System</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Your AI Twin
              <span className="block text-primary">Remembers Everything</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect your accounts, generate your unique persona, and let AI maintain context
              across all your interactions. Your goals, preferences, and memories - always remembered.
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Create Your Twin
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Instant setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Works everywhere</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Twin Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to your personalized AI experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative">
              <div className="absolute -top-6 left-6 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <CardContent className="pt-10 pb-8 px-6">
                <h3 className="text-xl font-semibold mb-3">Connect Your Accounts</h3>
                <p className="text-muted-foreground">
                  Link your YouTube, Gmail, LinkedIn, and other accounts. Your data stays private and secure.
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-6 left-6 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <CardContent className="pt-10 pb-8 px-6">
                <h3 className="text-xl font-semibold mb-3">Auto-Generate Persona</h3>
                <p className="text-muted-foreground">
                  We analyze your connected data to create a rich persona with your interests, goals, and preferences.
                </p>
              </CardContent>
            </Card>

            <Card className="relative">
              <div className="absolute -top-6 left-6 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <CardContent className="pt-10 pb-8 px-6">
                <h3 className="text-xl font-semibold mb-3">AI Remembers You</h3>
                <p className="text-muted-foreground">
                  Every AI interaction uses your persona and memories for truly personalized assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need for persistent AI context
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Smart Persona Generation</h3>
              <p className="text-sm text-muted-foreground">
                Automatically extracts your professional background, interests, and communication style from connected accounts.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Custom Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Add specific instructions per prompt to fine-tune how AI interacts with you for different tasks.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Memory Management</h3>
              <p className="text-sm text-muted-foreground">
                Full CRUD control over your memories. Associate memories with specific tasks and goals.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Task Context</h3>
              <p className="text-sm text-muted-foreground">
                Memories are intelligently filtered based on current task relevance for optimal context.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Multi-LLM Support</h3>
              <p className="text-sm text-muted-foreground">
                Works with OpenAI, Claude, Google Gemini, and more. Switch models based on task type.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Export & Import</h3>
              <p className="text-sm text-muted-foreground">
                Export your persona and memories to JSON/YAML. Import and sync across platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Your AI Twin?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands who've enhanced their AI interactions with persistent memory and context.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Twin. Your AI memory system.</p>
        </div>
      </footer>
    </div>
  )
}