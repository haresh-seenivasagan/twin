'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Brain, Plus, X, Save, ChevronLeft, Check } from 'lucide-react'
import type { GeneratedPersona } from '@/lib/persona/generator'

export default function ReviewPersonaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [persona, setPersona] = useState<GeneratedPersona | null>(null)
  const [editedPersona, setEditedPersona] = useState<GeneratedPersona | null>(null)

  useEffect(() => {
    // Load generated persona from Supabase via API
    const fetchPersona = async () => {
      try {
        const response = await fetch('/api/persona/generate')

        if (!response.ok) {
          throw new Error('Failed to fetch persona')
        }

        const result = await response.json()

        if (result.persona && Object.keys(result.persona).length > 0) {
          setPersona(result.persona)
          setEditedPersona(result.persona)
        } else {
          // If no persona generated yet, redirect back to generation
          router.push('/onboarding/generate')
        }
      } catch (error) {
        console.error('Error fetching persona:', error)
        // On error, redirect back to generation
        router.push('/onboarding/generate')
      }
    }

    fetchPersona()
  }, [router])

  const handleSave = async () => {
    setSaving(true)

    try {
      // Save the edited persona to Supabase
      const response = await fetch('/api/persona/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          persona_data: editedPersona,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save persona')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving persona:', error)
      alert('Failed to save persona. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: string, value: any) => {
    if (!editedPersona) return

    setEditedPersona(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    if (!editedPersona) return

    setEditedPersona(prev => ({
      ...prev!,
      [parent]: {
        ...(prev![parent as keyof GeneratedPersona] as any),
        [field]: value
      }
    }))
  }

  const addToArray = (field: string, value: string) => {
    if (!editedPersona || !value.trim()) return

    const currentArray = editedPersona[field as keyof GeneratedPersona] as string[]
    updateField(field, [...currentArray, value.trim()])
  }

  const removeFromArray = (field: string, index: number) => {
    if (!editedPersona) return

    const currentArray = editedPersona[field as keyof GeneratedPersona] as string[]
    updateField(field, currentArray.filter((_, i) => i !== index))
  }

  if (!persona || !editedPersona) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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
            <span>Step 3 of 3</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">Review Your AI Persona</h1>
          <p className="text-lg text-muted-foreground">
            Review and customize your generated persona. You can always update this later.
          </p>
        </div>

        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your core identity information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedPersona.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  value={editedPersona.profession}
                  onChange={(e) => updateField('profession', e.target.value)}
                  placeholder="Your profession"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="workingHours">Working Hours</Label>
              <Input
                id="workingHours"
                value={editedPersona.workingHours || ''}
                onChange={(e) => updateField('workingHours', e.target.value)}
                placeholder="e.g., 9-5 PST, Flexible"
              />
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Languages</CardTitle>
            <CardDescription>
              Languages you speak or work with
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {editedPersona.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-1"
                  >
                    {lang}
                    <button
                      onClick={() => removeFromArray('languages', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a language"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('languages', (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add a language"]') as HTMLInputElement
                    if (input?.value) {
                      addToArray('languages', input.value)
                      input.value = ''
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interests */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Interests</CardTitle>
            <CardDescription>
              Your areas of interest and expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {editedPersona.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-1"
                  >
                    {interest}
                    <button
                      onClick={() => removeFromArray('interests', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an interest"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addToArray('interests', (e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Add an interest"]') as HTMLInputElement
                    if (input?.value) {
                      addToArray('interests', input.value)
                      input.value = ''
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Goals */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Goals</CardTitle>
            <CardDescription>
              What you're currently working towards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {editedPersona.currentGoals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={goal}
                    onChange={(e) => {
                      const newGoals = [...editedPersona.currentGoals]
                      newGoals[index] = e.target.value
                      updateField('currentGoals', newGoals)
                    }}
                    placeholder="Enter a goal"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromArray('currentGoals', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addToArray('currentGoals', 'New goal')}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Communication Style */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Communication Style</CardTitle>
            <CardDescription>
              How you prefer AI to communicate with you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="formality">Formality</Label>
                <select
                  id="formality"
                  value={editedPersona.communicationStyle.formality}
                  onChange={(e) => updateNestedField('communicationStyle', 'formality', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="verbosity">Verbosity</Label>
                <select
                  id="verbosity"
                  value={editedPersona.communicationStyle.verbosity}
                  onChange={(e) => updateNestedField('communicationStyle', 'verbosity', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
              <div>
                <Label htmlFor="technicalLevel">Technical Level</Label>
                <select
                  id="technicalLevel"
                  value={editedPersona.communicationStyle.technicalLevel}
                  onChange={(e) => updateNestedField('communicationStyle', 'technicalLevel', e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditedPersona(persona)}
              disabled={saving}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}