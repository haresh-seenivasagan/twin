// Test setup and utilities
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { ConvexHttpClient } from 'convex/browser'
import { MOCK_PERSONAS, MOCK_MEMORIES } from './mocks'

// Test environment setup
export const TEST_ENV = {
  SUPABASE_URL: process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY || 'test-key',
  CONVEX_URL: process.env.TEST_CONVEX_URL || 'http://localhost:3210',
  MEM0_API_KEY: process.env.TEST_MEM0_API_KEY || 'test-mem0-key',
}

// Test clients
export const supabaseTest = createClient(
  TEST_ENV.SUPABASE_URL,
  TEST_ENV.SUPABASE_ANON_KEY
)

export const convexTest = new ConvexHttpClient(TEST_ENV.CONVEX_URL)

// Test utilities
export const testUtils = {
  // Create test user
  async createTestUser(email = 'test@example.com') {
    const { data, error } = await supabaseTest.auth.signUp({
      email,
      password: 'test-password-123',
    })

    if (error) throw error
    return data.user
  },

  // Clean up test data
  async cleanup(userId: string) {
    // Delete from Supabase
    await supabaseTest
      .from('profiles')
      .delete()
      .eq('id', userId)

    // Delete from Supabase auth
    await supabaseTest.auth.admin.deleteUser(userId)

    // Note: Convex and mem0 cleanup would be added here
  },

  // Load mock persona
  getMockPersona(type: 'developer' | 'designer' | 'researcher' = 'developer') {
    return MOCK_PERSONAS[type]
  },

  // Load mock memories for user
  getMockMemories(userId: string, limit = 10) {
    return MOCK_MEMORIES
      .filter(m => m.userId === userId || m.userId === 'developer-123')
      .slice(0, limit)
  },

  // Generate context from mocks
  generateMockContext(personaType: string, taskType: string) {
    const persona = (MOCK_PERSONAS as any)[personaType]
    const relevantMemories = MOCK_MEMORIES.filter(m =>
      m.taskRelevance.includes(taskType)
    )

    const contextParts = []

    if (persona.name) {
      contextParts.push(`You are assisting ${persona.name}`)
    }

    if (persona.style) {
      contextParts.push(
        `who prefers ${persona.style.formality}, ${persona.style.verbosity} communication at ${persona.style.technical_level} level`
      )
    }

    if (persona.currentGoals?.length > 0) {
      contextParts.push(`Current goals: ${persona.currentGoals.join(', ')}`)
    }

    if (relevantMemories.length > 0) {
      const memoryContext = relevantMemories
        .slice(0, 5)
        .map(m => m.content)
        .join('. ')
      contextParts.push(`Relevant context: ${memoryContext}`)
    }

    return contextParts.join('. ') + '.'
  },

  // Wait for async operations
  async waitFor(condition: () => boolean, timeout = 5000) {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!condition()) {
      throw new Error('Timeout waiting for condition')
    }
  },
}

// Test groups
export const testGroups = {
  critical: ['persona.test.ts', 'memory.test.ts', 'context.test.ts'],
  phase1: ['persona.test.ts'],
  phase2: ['memory.test.ts'],
  phase3: ['context.test.ts'],
  integration: ['integration/*.test.ts'],
  e2e: ['e2e/*.test.ts'],
}

// Global test setup
export function setupTests() {
  beforeAll(async () => {
    console.log('🧪 Setting up test environment...')
    // Any global setup needed
  })

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...')
    // Any global cleanup needed
  })
}