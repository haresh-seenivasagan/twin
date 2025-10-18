import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Shield, Zap, Mail, Linkedin, Youtube } from 'lucide-react'
import { InfinityIcon } from '@/components/ui/infinity-icon'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/10 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <InfinityIcon className="h-8 w-8 text-primary" />
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
      <section className="relative flex-1 flex items-center justify-center py-20 px-4 hero-gradient">
        {/* floating gradient orbs */}
        <div aria-hidden className="gradient-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 animate-fade-up">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span className="text-primary font-medium">AI-Powered Persona Tool</span>
            </div>

            <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Your personal memory MCP
            </h1>

            <p className="heading-display text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Maximum personalization anywhere
            </p>

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 soft-btn">
                  Create Your Twin
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="text-lg px-8 soft-btn">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators removed per design update */}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See Twin in Action</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 md:px-0">
              Watch a short demo of persona generation and memory. With Twin, you can provide a dynamic user persona to any LLM or agent — including powering a more personalized YouTube feed.
            </p>
          </div>

          {/* YouTube Embed */}
          <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${process.env.NEXT_PUBLIC_DEMO_VIDEO_ID || 'P_h9Mt0ZzWg'}?rel=0`}
              title="Twin Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* data source badges removed per request */}
        </div>
      </section>

      {/* Use Case: Persona‑Powered YouTube Feed */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Scenario: Persona‑Powered YouTube Feed</h2>
            <p className="text-lg text-muted-foreground tracking-normal max-w-4xl mx-auto">
              Twin builds a dynamic persona from your viewing signals so YouTube’s feed surfaces videos that match your interests, expertise, and current intent — more relevance, less noise.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1: Authorize data sources */}
            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Youtube className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Authorize Sources</h3>
              <p className="text-sm text-muted-foreground tracking-normal max-w-[46ch] min-h-[3.5rem]">
                Enable YouTube with one click; LinkedIn and Gmail authorizations are coming soon.
              </p>
              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">YouTube • Live</span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">LinkedIn • soon</span>
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Gmail • soon</span>
              </div>
            </div>

            {/* Step 2: Dynamic persona */}
            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <InfinityIcon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Dynamic Persona</h3>
              <p className="text-sm text-muted-foreground tracking-normal max-w-[46ch] min-h-[3.5rem]">Your viewing signals maintain a living persona — interests, expertise, and intent.</p>
            </div>

            {/* Step 3: Persona‑powered ranking */}
            <div className="flex flex-col gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Recommendations About You</h3>
              <p className="text-sm text-muted-foreground tracking-normal max-w-[46ch] min-h-[3.5rem]">The persona powers ranking so every recommended video is truly relevant to you.</p>
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