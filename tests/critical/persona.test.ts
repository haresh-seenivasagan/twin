import { describe, it, expect, beforeEach } from 'vitest'
import { MOCK_PERSONAS, testDataGenerator } from '../mocks'
import { testUtils } from '../setup'

// Critical persona tests - MUST PASS for MVP
describe('CRITICAL: Persona Management', () => {
  let testUserId: string

  beforeEach(() => {
    testUserId = `test_${Date.now()}`
  })

  describe('Persona Creation', () => {
    it('creates persona with minimum required fields', async () => {
      const minimalPersona = {
        name: "Test User",
        languages: ["en"],
        preferredLanguage: "en",
        currentGoals: ["Build something"],
      }

      const result = await createPersona(testUserId, minimalPersona)

      expect(result).toBeDefined()
      expect(result.name).toBe("Test User")
      expect(result.currentGoals).toContain("Build something")
    })

    it('creates persona from social login data', async () => {
      const socialData = {
        email: "user@gmail.com",
        name: "Google User",
        locale: "en-US",
      }

      const persona = await createPersonaFromSocial(socialData)

      expect(persona.name).toBe("Google User")
      expect(persona.languages).toContain("en")
      expect(persona.preferredLanguage).toBe("en")
    })

    it('sets default values for missing fields', async () => {
      const incompleteData = {
        name: "Incomplete User",
      }

      const persona = await createPersona(testUserId, incompleteData)

      expect(persona.languages).toEqual(["en"])
      expect(persona.style.formality).toBe("casual")
      expect(persona.style.verbosity).toBe("balanced")
      expect(persona.style.technical_level).toBe("intermediate")
      expect(persona.llmPreferences.default).toBe("claude")
    })
  })

  describe('Persona Updates', () => {
    it('updates currentGoals - CRITICAL for context', async () => {
      const persona = await createPersona(testUserId, MOCK_PERSONAS.developer)

      const newGoals = [
        "Launch product next week",
        "Fix critical bugs",
        "Prepare investor deck",
      ]

      const updated = await updatePersonaField(testUserId, 'currentGoals', newGoals)

      expect(updated.currentGoals).toEqual(newGoals)
      expect(updated.currentGoals).not.toContain("Ship MVP in 2 weeks")
    })

    it('updates LLM preferences by task type', async () => {
      const persona = await createPersona(testUserId, MOCK_PERSONAS.developer)

      const newPreferences = {
        ...persona.llmPreferences,
        coding: "openai", // Switch from claude to openai for coding
      }

      const updated = await updatePersonaField(testUserId, 'llmPreferences', newPreferences)

      expect(updated.llmPreferences.coding).toBe("openai")
      expect(updated.llmPreferences.creative).toBe("gemini") // Others unchanged
    })

    it('preserves existing data when updating single field', async () => {
      const original = await createPersona(testUserId, MOCK_PERSONAS.developer)

      await updatePersonaField(testUserId, 'profession', 'CTO')

      const updated = await getPersona(testUserId)

      expect(updated.profession).toBe('CTO')
      expect(updated.name).toBe(original.name) // Unchanged
      expect(updated.currentGoals).toEqual(original.currentGoals) // Unchanged
    })
  })

  describe('Persona Retrieval', () => {
    it('retrieves persona by user ID', async () => {
      await createPersona(testUserId, MOCK_PERSONAS.designer)

      const retrieved = await getPersona(testUserId)

      expect(retrieved).toBeDefined()
      expect(retrieved.name).toBe("Sam Creative")
      expect(retrieved.profession).toBe("Senior Product Designer")
    })

    it('returns null for non-existent user', async () => {
      const retrieved = await getPersona('non-existent-user')

      expect(retrieved).toBeNull()
    })

    it('exports persona in LLM-ready format', async () => {
      await createPersona(testUserId, MOCK_PERSONAS.developer)

      const exported = await exportPersonaForLLM(testUserId)

      expect(exported).toContain("Alex Dev")
      expect(exported).toContain("casual, concise communication")
      expect(exported).toContain("advanced technical level")
      expect(exported).toContain("Ship MVP in 2 weeks")
    })
  })
})

// Mock implementation for testing
// In production, these would call the actual Convex functions

async function createPersona(userId: string, data: any) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 10))

  return {
    id: `persona_${userId}`,
    ...MOCK_PERSONAS.developer,
    ...data,
    createdAt: Date.now(),
  }
}

async function createPersonaFromSocial(socialData: any) {
  const languages = socialData.locale
    ? [socialData.locale.split('-')[0]]
    : ['en']

  return {
    name: socialData.name || socialData.email.split('@')[0],
    languages,
    preferredLanguage: languages[0],
    style: {
      formality: "casual",
      verbosity: "balanced",
      technical_level: "intermediate",
    },
    currentGoals: [],
    interests: [],
    llmPreferences: {
      default: "claude",
      coding: "claude",
      creative: "gemini",
      analysis: "openai",
      chat: "claude",
    },
  }
}

async function updatePersonaField(userId: string, field: string, value: any) {
  const current = await getPersona(userId)
  return {
    ...current,
    [field]: value,
    updatedAt: Date.now(),
  }
}

async function getPersona(userId: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 10))

  if (userId.includes('non-existent')) {
    return null
  }

  return {
    id: `persona_${userId}`,
    ...MOCK_PERSONAS.developer,
  }
}

async function exportPersonaForLLM(userId: string) {
  const persona = await getPersona(userId)

  if (!persona) return null

  const parts = []

  parts.push(`You are assisting ${persona.name}, a ${persona.profession}.`)
  parts.push(
    `Communication style: ${persona.style.formality}, ${persona.style.verbosity} responses at ${persona.style.technical_level} technical level.`
  )

  if (persona.languages?.length > 0) {
    parts.push(
      `Languages: ${persona.languages.join(', ')} (preferred: ${persona.preferredLanguage}).`
    )
  }

  if (persona.currentGoals?.length > 0) {
    parts.push(`Current goals: ${persona.currentGoals.join(', ')}.`)
  }

  return parts.join(' ')
}