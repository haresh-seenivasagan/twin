// Mock persona generator - in production, this would use AI to analyze connected accounts
export interface ConnectedAccountData {
  youtube?: {
    subscriptions: string[]
    watchHistory: string[]
    likes: string[]
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
  // In production, this would:
  // 1. Send account data to an AI service
  // 2. Use custom instructions to guide generation
  // 3. Focus on selected areas
  // 4. Return a rich, personalized persona

  // Mock implementation for development
  const mockPersona: GeneratedPersona = {
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
    workingHours: 'Flexible, mostly 9-5 PST',
    preferences: {
      codeStyle: 'Functional programming with clean architecture',
      documentation: 'Comprehensive with examples',
      testing: 'TDD approach with high coverage'
    }
  }

  if (customInstructions) {
    mockPersona.preferences.customContext = customInstructions
  }

  return mockPersona
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
  if (data.youtube?.watchHistory?.some(h => h.includes('tutorial'))) {
    goals.push('Complete online courses and certifications')
  }

  if (data.linkedin?.skills?.includes('leadership')) {
    goals.push('Mentor team members and share knowledge')
  }

  return goals.slice(0, 5) // Limit to 5 goals
}