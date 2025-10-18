// Mock data for parallel development and testing

export const MOCK_PERSONAS = {
  developer: {
    name: "Alex Dev",
    languages: ["en", "es", "zh"],
    preferredLanguage: "en",
    style: {
      formality: "casual" as const,
      verbosity: "concise" as const,
      technical_level: "advanced" as const,
    },
    currentGoals: [
      "Ship MVP in 2 weeks",
      "Implement real-time features with Convex",
      "Optimize performance to <100ms response time",
      "Add comprehensive test coverage >90%",
    ],
    interests: ["AI/ML", "Web3", "Open Source", "System Design", "Rust"],
    profession: "Senior Full Stack Developer",
    llmPreferences: {
      default: "claude",
      coding: "claude",
      creative: "gemini",
      analysis: "openai",
      chat: "claude",
    },
    customData: {
      timezone: "PST",
      workingHours: "night owl (10pm-3am)",
      preferredIDE: "Cursor",
      gitWorkflow: "trunk-based development",
      testingApproach: "TDD always",
      codeStyle: "functional over OOP",
      deploymentPlatform: "Cloudflare Workers",
    },
  },

  designer: {
    name: "Sam Creative",
    languages: ["en", "ja"],
    preferredLanguage: "en",
    style: {
      formality: "casual" as const,
      verbosity: "detailed" as const,
      technical_level: "intermediate" as const,
    },
    currentGoals: [
      "Complete design system overhaul",
      "Improve user onboarding flow",
      "Launch personal design blog",
      "Learn Framer for prototyping",
    ],
    interests: ["UX Research", "Typography", "Minimalism", "Accessibility", "Motion Design"],
    profession: "Senior Product Designer",
    llmPreferences: {
      default: "gemini",
      coding: "claude",
      creative: "gemini",
      analysis: "openai",
      chat: "gemini",
    },
    customData: {
      designTools: ["Figma", "Framer", "Principle"],
      designPhilosophy: "Less is more",
      colorPalettePreference: "Monochromatic with accent",
      inspirationSources: ["Dieter Rams", "Japanese minimalism"],
    },
  },

  researcher: {
    name: "Dr. Pat Scholar",
    languages: ["en", "de", "fr", "zh"],
    preferredLanguage: "en",
    style: {
      formality: "formal" as const,
      verbosity: "detailed" as const,
      technical_level: "advanced" as const,
    },
    currentGoals: [
      "Publish paper on LLM efficiency in Nature",
      "Complete 100k token dataset annotation",
      "Establish industry partnership with OpenAI",
      "Supervise 3 PhD students",
    ],
    interests: [
      "Machine Learning",
      "Natural Language Processing",
      "AI Ethics",
      "Reinforcement Learning",
      "Computational Linguistics",
    ],
    profession: "AI Research Scientist",
    llmPreferences: {
      default: "openai",
      coding: "claude",
      creative: "openai",
      analysis: "openai",
      chat: "openai",
    },
    customData: {
      institution: "Stanford AI Lab",
      hIndex: 42,
      specialization: "Large Language Models",
      publishingVenues: ["NeurIPS", "ICML", "ACL"],
      collaborators: ["Anthropic", "DeepMind", "Meta AI"],
    },
  },

  student: {
    name: "Jordan Learner",
    languages: ["en"],
    preferredLanguage: "en",
    style: {
      formality: "casual" as const,
      verbosity: "balanced" as const,
      technical_level: "beginner" as const,
    },
    currentGoals: [
      "Complete CS degree",
      "Build portfolio website",
      "Get summer internship at tech company",
      "Contribute to open source",
    ],
    interests: ["Web Development", "Game Dev", "AI", "Startups"],
    profession: "Computer Science Student",
    llmPreferences: {
      default: "claude",
      coding: "claude",
      creative: "gemini",
      analysis: "claude",
      chat: "claude",
    },
    customData: {
      university: "UC Berkeley",
      year: "Junior",
      gpa: 3.7,
      coursework: ["Data Structures", "Algorithms", "Web Dev", "ML Intro"],
    },
  },
}

export const MOCK_MEMORIES = [
  // Developer memories - Coding preferences
  {
    id: "mem_001",
    userId: "developer-123",
    content: "Always uses TypeScript with strict mode enabled for new projects",
    category: "preferences",
    importance: 9,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["coding", "project-setup", "typescript"],
    createdAt: Date.now() - 86400000 * 30, // 30 days ago
  },
  {
    id: "mem_002",
    userId: "developer-123",
    content: "Prefers pnpm over npm for package management due to speed and disk efficiency",
    category: "tools",
    importance: 7,
    confidence: 0.9,
    source: "observed",
    taskRelevance: ["coding", "dependency-management", "tooling"],
    createdAt: Date.now() - 86400000 * 25,
  },
  {
    id: "mem_003",
    userId: "developer-123",
    content: "Uses Tailwind CSS for styling, dislikes CSS-in-JS due to runtime overhead",
    category: "preferences",
    importance: 8,
    confidence: 0.95,
    source: "explicit",
    taskRelevance: ["coding", "frontend", "styling", "css"],
    createdAt: Date.now() - 86400000 * 20,
  },

  // Project context
  {
    id: "mem_004",
    userId: "developer-123",
    content: "Currently working on AI-powered education platform called Derivativ with 3 other developers",
    category: "projects",
    importance: 10,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["context", "current-work", "team"],
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: "mem_005",
    userId: "developer-123",
    content: "Team uses Supabase for auth, Convex for real-time data, and Cloudflare Workers for edge computing",
    category: "technical-stack",
    importance: 8,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["coding", "architecture", "infrastructure"],
    createdAt: Date.now() - 86400000 * 15,
  },
  {
    id: "mem_006",
    userId: "developer-123",
    content: "Follows Test-Driven Development strictly - writes tests before implementation",
    category: "methodology",
    importance: 9,
    confidence: 0.95,
    source: "observed",
    taskRelevance: ["coding", "testing", "methodology"],
    createdAt: Date.now() - 86400000 * 10,
  },

  // Communication preferences
  {
    id: "mem_007",
    userId: "developer-123",
    content: "Prefers code examples over long explanations, especially for debugging",
    category: "communication",
    importance: 9,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["any", "communication", "learning"],
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "mem_008",
    userId: "developer-123",
    content: "Likes to see performance metrics and benchmarks when discussing optimizations",
    category: "communication",
    importance: 7,
    confidence: 0.85,
    source: "observed",
    taskRelevance: ["performance", "optimization", "analysis"],
    createdAt: Date.now() - 86400000 * 5,
  },

  // Recent decisions
  {
    id: "mem_009",
    userId: "developer-123",
    content: "Decided to migrate from Next.js Pages Router to App Router for better performance",
    category: "decisions",
    importance: 8,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["coding", "nextjs", "migration", "architecture"],
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "mem_010",
    userId: "developer-123",
    content: "Chose Vitest over Jest for testing due to better TypeScript support and speed",
    category: "decisions",
    importance: 7,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["coding", "testing", "tooling"],
    createdAt: Date.now() - 86400000 * 2,
  },

  // Learning goals
  {
    id: "mem_011",
    userId: "developer-123",
    content: "Currently learning Rust to build high-performance backend services",
    category: "learning",
    importance: 6,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["learning", "rust", "backend"],
    createdAt: Date.now() - 86400000,
  },
  {
    id: "mem_012",
    userId: "developer-123",
    content: "Interested in WebAssembly for compute-intensive frontend operations",
    category: "interests",
    importance: 5,
    confidence: 0.8,
    source: "inferred",
    taskRelevance: ["learning", "webassembly", "performance"],
    createdAt: Date.now() - 43200000, // 12 hours ago
  },

  // Designer memories
  {
    id: "mem_013",
    userId: "designer-456",
    content: "Uses 8px grid system for all designs to ensure consistency",
    category: "methodology",
    importance: 9,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["design", "ui", "consistency"],
    createdAt: Date.now() - 86400000 * 20,
  },
  {
    id: "mem_014",
    userId: "designer-456",
    content: "Prefers to start with mobile designs first (mobile-first approach)",
    category: "preferences",
    importance: 8,
    confidence: 0.95,
    source: "observed",
    taskRelevance: ["design", "responsive", "mobile"],
    createdAt: Date.now() - 86400000 * 15,
  },

  // Researcher memories
  {
    id: "mem_015",
    userId: "researcher-789",
    content: "Uses LaTeX for all academic writing with custom bibliography style",
    category: "tools",
    importance: 8,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["writing", "academic", "documentation"],
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "mem_016",
    userId: "researcher-789",
    content: "Prefers PyTorch over TensorFlow for research due to flexibility and debugging ease",
    category: "preferences",
    importance: 9,
    confidence: 1.0,
    source: "explicit",
    taskRelevance: ["ml", "research", "coding"],
    createdAt: Date.now() - 86400000 * 5,
  },
]

// Mock memory search function
export function searchMockMemories(
  userId: string,
  query: string,
  taskContext?: string
): typeof MOCK_MEMORIES {
  const userMemories = MOCK_MEMORIES.filter(m => m.userId === userId)

  if (!query && !taskContext) {
    return userMemories
  }

  const queryLower = query.toLowerCase()
  const relevantMemories = userMemories.filter(memory => {
    const contentMatch = memory.content.toLowerCase().includes(queryLower)
    const categoryMatch = memory.category === taskContext
    const relevanceMatch = taskContext
      ? memory.taskRelevance.includes(taskContext)
      : true

    return contentMatch || categoryMatch || relevanceMatch
  })

  // Sort by importance and recency
  return relevantMemories.sort((a, b) => {
    const importanceDiff = b.importance - a.importance
    if (importanceDiff !== 0) return importanceDiff
    return b.createdAt - a.createdAt
  })
}

// Mock context generation
export function generateMockContext(
  userId: string,
  purpose: 'coding' | 'creative' | 'analysis' | 'chat',
  taskDescription?: string
) {
  // Find persona
  const persona = Object.values(MOCK_PERSONAS).find(p =>
    p.name.includes(userId.split('-')[0])
  ) || MOCK_PERSONAS.developer

  // Get relevant memories
  const memories = searchMockMemories(
    userId,
    taskDescription || '',
    purpose
  ).slice(0, 5)

  // Build context
  const contextParts = []

  contextParts.push(`You are assisting ${persona.name}, a ${persona.profession}.`)

  contextParts.push(
    `Communication style: ${persona.style.formality}, ${persona.style.verbosity} responses, ${persona.style.technical_level} technical level.`
  )

  if (persona.currentGoals.length > 0) {
    contextParts.push(
      `Current goals: ${persona.currentGoals.slice(0, 3).join(', ')}.`
    )
  }

  if (memories.length > 0) {
    contextParts.push(
      `Relevant context: ${memories.map(m => m.content).join('. ')}.`
    )
  }

  const selectedLLM = persona.llmPreferences[purpose] || persona.llmPreferences.default

  return {
    systemPrompt: contextParts.join(' '),
    llmSelected: selectedLLM,
    tokenCount: Math.ceil(contextParts.join(' ').length / 4),
    memoriesIncluded: memories.length,
    persona,
    memories,
  }
}

// Export test data generator
export const testDataGenerator = {
  createPersona(overrides = {}) {
    return {
      ...MOCK_PERSONAS.developer,
      ...overrides,
      id: `persona_${Date.now()}`,
      createdAt: Date.now(),
    }
  },

  createMemory(overrides = {}) {
    return {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: "test-user",
      content: "Test memory content",
      category: "test",
      importance: 5,
      confidence: 0.8,
      source: "test",
      taskRelevance: ["test"],
      createdAt: Date.now(),
      ...overrides,
    }
  },

  createBulkMemories(count: number, userId: string) {
    return Array.from({ length: count }, (_, i) =>
      this.createMemory({
        id: `mem_bulk_${i}`,
        userId,
        content: `Memory ${i}: Test content about topic ${i}`,
        importance: Math.floor(Math.random() * 10) + 1,
        confidence: Math.random(),
      })
    )
  },
}