'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'
import type { GeneratedPersona } from '@/lib/persona/generator'

interface PersonaEditorProps {
  persona: GeneratedPersona
  onUpdate: (persona: GeneratedPersona) => void
  compact?: boolean
}

export function PersonaEditor({ persona, onUpdate, compact = false }: PersonaEditorProps) {
  const updateField = (field: string, value: any) => {
    onUpdate({
      ...persona,
      [field]: value
    })
  }

  const updateNestedField = (parent: string, field: string, value: any) => {
    onUpdate({
      ...persona,
      [parent]: {
        ...(persona[parent as keyof GeneratedPersona] as any),
        [field]: value
      }
    })
  }

  const addToArray = (field: string, value: string) => {
    if (!value.trim()) return

    const currentArray = persona[field as keyof GeneratedPersona] as string[]
    updateField(field, [...currentArray, value.trim()])
  }

  const removeFromArray = (field: string, index: number) => {
    const currentArray = persona[field as keyof GeneratedPersona] as string[]
    updateField(field, currentArray.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Your core identity information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={compact ? "space-y-4" : "grid md:grid-cols-2 gap-4"}>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={persona.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={persona.profession}
                onChange={(e) => updateField('profession', e.target.value)}
                placeholder="Your profession"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="workingHours">Working Hours</Label>
            <Input
              id="workingHours"
              value={persona.workingHours || ''}
              onChange={(e) => updateField('workingHours', e.target.value)}
              placeholder="e.g., 9-5 PST, Flexible"
            />
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>
            Languages you speak or work with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {persona.languages.map((lang, index) => (
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
      <Card>
        <CardHeader>
          <CardTitle>Interests</CardTitle>
          <CardDescription>
            Your areas of interest and expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {persona.interests.map((interest, index) => (
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
      <Card>
        <CardHeader>
          <CardTitle>Current Goals</CardTitle>
          <CardDescription>
            What you're currently working towards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {persona.currentGoals.map((goal, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={goal}
                  onChange={(e) => {
                    const newGoals = [...persona.currentGoals]
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
      <Card>
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
                value={persona.communicationStyle.formality}
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
                value={persona.communicationStyle.verbosity}
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
                value={persona.communicationStyle.technicalLevel}
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
    </div>
  )
}
