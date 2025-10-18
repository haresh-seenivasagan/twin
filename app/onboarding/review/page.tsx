'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Save, ChevronLeft, Check } from 'lucide-react'
import { InfinityIcon } from '@/components/ui/infinity-icon'
import type { GeneratedPersona } from '@/lib/persona/generator'
import { PersonaEditor } from '@/components/persona/PersonaEditor'
import { DebugPanel } from '@/components/debug/DebugPanel'

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

        const result = await response.json() as { persona?: any; error?: string }

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
            <InfinityIcon className="h-8 w-8 text-primary" />
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

        {/* Persona Editor */}
        <PersonaEditor
          persona={editedPersona}
          onUpdate={setEditedPersona}
        />

        {/* Debug Panel */}
        <div className="mt-6">
          <DebugPanel
            data={{
              original: persona,
              edited: editedPersona,
              hasChanges: JSON.stringify(persona) !== JSON.stringify(editedPersona)
            }}
            title="Review Debug Data"
            description="Compare original and edited persona data"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
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