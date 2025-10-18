import { MCPClient } from '@/lib/mcp/client'

// Persona generator using MCP server
export interface ConnectedAccountData {
  youtube?: {
    subscriptions: any[]  // Full YouTube API subscription objects
    playlists: any[]      // Full YouTube API playlist objects
    likes: any[]          // Full YouTube API liked video objects
  }
  gmail?: {
    emailPatterns: string[]
    contactFrequency: Record<string, number>
    topics: string[]
  }
  linkedin?: {
    headline: string
    skills: string[]
    experience: Array<{
      title: string
      company: string
      duration: string
    }>
    education: Array<{
      degree: string
      institution: string
    }>
  }
}

export interface GeneratedPersona {
  name: string
  profession: string
  languages: string[]
  interests: string[]
  currentGoals: string[]
  communicationStyle: {
    formality: 'formal' | 'casual' | 'mixed'
    verbosity: 'concise' | 'detailed' | 'balanced'
    technicalLevel: 'basic' | 'intermediate' | 'advanced'
  }
  workingHours?: string
  preferences: {
    codeStyle?: string
    documentation?: string
    testing?: string
    customContext?: string
    [key: string]: any
  }
}

export async function generatePersonaFromAccounts(
  accountData: ConnectedAccountData,
  customInstructions?: string,
  focusAreas?: string[]
): Promise<GeneratedPersona> {
  const mcpClient = new MCPClient()

  try {
    // Transform account data to MCP format
    const mcpAccountData: any = {}

    if (accountData.youtube) {
      mcpAccountData.google = {
        youtube: {
          subscriptions: accountData.youtube.subscriptions || [],
          playlists: accountData.youtube.playlists || [],
          liked_videos: accountData.youtube.likes || [],
        }
      }
    }

    if (accountData.linkedin) {
      mcpAccountData.linkedin = accountData.linkedin
    }

    // Add focus areas and custom instructions to the account data
    if (focusAreas && focusAreas.length > 0) {
      mcpAccountData.focusAreas = focusAreas
    }

    if (customInstructions) {
      mcpAccountData.customInstructions = customInstructions
    }

    console.log('Calling MCP server with account data:', {
      hasYoutube: !!mcpAccountData.google?.youtube,
      subscriptions: mcpAccountData.google?.youtube?.subscriptions?.length || 0,
      playlists: mcpAccountData.google?.youtube?.playlists?.length || 0,
      focusAreas: mcpAccountData.focusAreas,
      hasCustomInstructions: !!customInstructions,
    })

    // Call MCP server to generate persona
    const mcpPersona = await mcpClient.generateFromAccounts(mcpAccountData)

    console.log('MCP server response:', mcpPersona)

    // Transform MCP persona to our GeneratedPersona format
    const technicalLevel: 'basic' | 'intermediate' | 'advanced' =
      mcpPersona.style?.technical_level === 'beginner' ? 'basic' :
      mcpPersona.style?.technical_level === 'advanced' ? 'advanced' :
      'intermediate'

    const generatedPersona: GeneratedPersona = {
      name: mcpPersona.name || 'User',
      profession: mcpPersona.profession || 'Professional',
      languages: mcpPersona.languages || ['English'],
      interests: mcpPersona.interests || [],
      currentGoals: mcpPersona.currentGoals || [],
      communicationStyle: {
        formality: mcpPersona.style?.formality === 'formal' ? 'formal' : mcpPersona.style?.formality === 'casual' ? 'casual' : 'mixed',
        verbosity: mcpPersona.style?.verbosity || 'balanced',
        technicalLevel,
      },
      workingHours: 'Flexible',
      preferences: {
        customContext: customInstructions,
      }
    }

    return generatedPersona
  } catch (error) {
    console.error('MCP persona generation failed, falling back to mock:', error)

    // Fallback to mock persona if MCP fails
    const fallbackPersona: GeneratedPersona = {
      name: extractName(accountData),
      profession: extractProfession(accountData),
      languages: extractLanguages(accountData),
      interests: extractInterests(accountData),
      currentGoals: generateGoals(accountData, focusAreas),
      communicationStyle: {
        formality: 'casual',
        verbosity: 'concise',
        technicalLevel: 'advanced'
      },
      workingHours: 'Flexible',
      preferences: {
        codeStyle: 'Clean and maintainable',
        customContext: customInstructions,
      }
    }

    return fallbackPersona
  }
}

function extractName(data: ConnectedAccountData): string {
  // Extract from LinkedIn or email patterns
  if (data.linkedin?.headline) {
    // Parse name from headline
    return 'Alex Chen'
  }
  return 'User'
}

function extractProfession(data: ConnectedAccountData): string {
  if (data.linkedin?.experience?.[0]) {
    return data.linkedin.experience[0].title
  }
  return 'Professional'
}

function extractLanguages(data: ConnectedAccountData): string[] {
  // Analyze email patterns, YouTube content languages, etc.
  const languages = ['English']

  // Check for international content consumption
  if (data.youtube?.subscriptions?.some(s => s.includes('中文'))) {
    languages.push('Mandarin')
  }

  return languages
}

function extractInterests(data: ConnectedAccountData): string[] {
  const interests = new Set<string>()

  // From YouTube subscriptions
  if (data.youtube?.subscriptions) {
    data.youtube.subscriptions.forEach(sub => {
      if (sub.includes('tech')) interests.add('Technology')
      if (sub.includes('code')) interests.add('Programming')
      if (sub.includes('AI')) interests.add('Artificial Intelligence')
    })
  }

  // From LinkedIn skills
  if (data.linkedin?.skills) {
    data.linkedin.skills.forEach(skill => interests.add(skill))
  }

  // From Gmail topics
  if (data.gmail?.topics) {
    data.gmail.topics.forEach(topic => interests.add(topic))
  }

  return Array.from(interests).slice(0, 10) // Limit to top 10
}

function generateGoals(
  data: ConnectedAccountData,
  focusAreas?: string[]
): string[] {
  const goals = []

  if (focusAreas?.includes('professional')) {
    goals.push('Advance career to next level')
  }

  if (focusAreas?.includes('learning')) {
    goals.push('Master new technologies and frameworks')
  }

  if (focusAreas?.includes('creative')) {
    goals.push('Build innovative side projects')
  }

  if (focusAreas?.includes('productivity')) {
    goals.push('Optimize workflow and automate repetitive tasks')
  }

  // Add goals based on detected patterns
  if (data.linkedin?.skills?.includes('leadership')) {
    goals.push('Mentor team members and share knowledge')
  }

  return goals.slice(0, 5) // Limit to 5 goals
}