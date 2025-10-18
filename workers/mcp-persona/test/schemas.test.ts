import { describe, it, expect } from 'vitest'
import { PersonaSchema, ConnectedAccountsSchema } from '../src/schemas'

describe('schemas', () => {
  it('validates persona defaults', () => {
    const parsed = PersonaSchema.parse({
      name: 'Test',
      languages: ['en'],
      preferredLanguage: 'en',
      currentGoals: [],
      interests: [],
      style: { formality: 'casual', verbosity: 'balanced', technical_level: 'intermediate' }
    })
    expect(parsed.name).toBe('Test')
    expect(parsed.style.verbosity).toBe('balanced')
  })

  it('accepts connected accounts shape', () => {
    const acc = ConnectedAccountsSchema.parse({
      google: { email: 'a@b.com', name: 'A', locale: 'en-US' },
      github: { login: 'u', name: 'U', repos: [], starred: [] },
    })
    expect(acc.google?.locale).toBe('en-US')
  })
})
