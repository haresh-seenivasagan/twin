'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Brain, Sparkles, Loader2, Info, ChevronRight, X, Plus } from 'lucide-react'

interface GenerationOptions {
  includeCustomInstructions: boolean
  customInstructions: string
  focusAreas: string[]
}

export default function GeneratePersonaPage() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [customInstructions, setCustomInstructions] = useState('')
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([])
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [customGoalInput, setCustomGoalInput] = useState('')

  const focusAreas = [
    { id: 'relationships', label: 'Dating & Relationships', icon: '❤️', description: 'Personal connections and dating' },
    { id: 'mindfulness', label: 'Mental Health', icon: '🧘', description: 'Mindfulness, therapy, self-care' },
    { id: 'health', label: 'Health & Fitness', icon: '💪', description: 'Exercise, nutrition, wellness' },
    { id: 'technical', label: 'Technical & Programming', icon: '💻', description: 'Coding, frameworks, software engineering' },
  ]

  const handleGenerate = async () => {
    // Validation: Must select at least one focus area OR have custom goals
    const allFocusAreas = [...selectedFocusAreas, ...customGoals]

    if (allFocusAreas.length === 0) {
      alert('Please select at least one focus area or add a custom goal')
      return
    }

    // Validate custom goals are not empty strings
    const validCustomGoals = customGoals.filter(g => g.trim().length > 0)
    if (validCustomGoals.length < customGoals.length) {
      alert('Please remove empty custom goals or fill them in')
      return
    }

    setGenerating(true)

    try {
      // Combine pre-defined focus areas with valid custom goals
      const finalFocusAreas = [...selectedFocusAreas, ...validCustomGoals]

      // Call the API to generate persona using MCP server
      const response = await fetch('/api/persona/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Required to send Supabase auth cookies
        body: JSON.stringify({
          focusAreas: finalFocusAreas,
          customInstructions: customInstructions || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json() as { error?: string }
        throw new Error(error.error || 'Failed to generate persona')
      }

      const result = await response.json() as any

      // Persona is now saved in Supabase, redirect to review page
      router.push('/onboarding/review')
    } catch (error) {
      console.error('Error generating persona:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate persona. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const toggleFocusArea = (areaId: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }

  const addCustomGoal = () => {
    if (customGoalInput.trim() && !customGoals.includes(customGoalInput.trim())) {
      setCustomGoals(prev => [...prev, customGoalInput.trim()])
      setCustomGoalInput('')
    }
  }

  const removeCustomGoal = (goal: string) => {
    setCustomGoals(prev => prev.filter(g => g !== goal))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomGoal()
    }
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
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Step 2 of 3</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Customize Your Persona Generation</h1>
          <p className="text-lg text-muted-foreground">
            Tell us what's important to you. We'll use this to create a more accurate persona.
          </p>
        </div>

        {/* Focus Areas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Focus Areas</CardTitle>
            <CardDescription>
              Select the areas you want your AI persona to prioritize
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {focusAreas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => toggleFocusArea(area.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedFocusAreas.includes(area.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{area.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{area.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {area.description}
                        </p>
                      </div>
                    </div>
                    <div className={`ml-2 mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedFocusAreas.includes(area.id)
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedFocusAreas.includes(area.id) && (
                        <div className="h-2 w-2 bg-primary-foreground rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Custom Goals</CardTitle>
            <CardDescription>
              Add any specific goals not covered above (e.g., "Travel planning", "Cooking", "Meditation")
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a custom goal..."
                  value={customGoalInput}
                  onChange={(e) => setCustomGoalInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={addCustomGoal}
                  variant="outline"
                  size="icon"
                  disabled={!customGoalInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {customGoals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customGoals.map((goal) => (
                    <div
                      key={goal}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm"
                    >
                      <span>{goal}</span>
                      <button
                        onClick={() => removeCustomGoal(goal)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Examples: Dating & Relationships, Music Production, Gardening, Investment Strategy, Public Speaking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Custom Instructions (Optional)</CardTitle>
            <CardDescription>
              Add any specific instructions or context you want the AI to consider when generating your persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="instructions">Your Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Example: Focus on my interest in sustainable technology and remote work. I prefer detailed technical discussions and enjoy mentoring junior developers. Include my passion for open-source contributions..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">Pro Tip:</p>
                  <p>
                    The more specific you are, the better your persona will reflect your unique needs.
                    Include details about your work style, communication preferences, current projects,
                    or any specific goals you're working toward.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Prompts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Example Instructions</CardTitle>
            <CardDescription>
              Click any example to add it to your custom instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                'I work in startup environments and value speed over perfection',
                'I have ADHD and work best with clear, structured task breakdowns',
                'I\'m transitioning from backend to full-stack development',
                'I prefer learning through practical examples rather than theory',
                'I\'m building in public and sharing my journey on social media',
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setCustomInstructions(prev =>
                    prev ? `${prev}\n${example}` : example
                  )}
                  className="w-full text-left p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="min-w-[200px]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Persona...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate My Persona
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}