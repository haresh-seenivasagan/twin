import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  MEM0_API_KEY: string
  OPENAI_API_KEY: string
  ANTHROPIC_API_KEY: string
  GOOGLE_AI_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

// Enable CORS
app.use('*', cors())

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production'
  })
})

// ============================================
// PERSONA ENDPOINTS
// ============================================

app.get('/api/personas/:userId', async (c) => {
  const userId = c.req.param('userId')
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return c.json({ error: error.message }, 404)
  }

  return c.json({
    persona: data?.persona || null,
    llmPreferences: data?.llm_preferences || {
      default: "claude",
      coding: "claude",
      creative: "gemini",
      analysis: "openai"
    }
  })
})

app.post('/api/personas', async (c) => {
  const body = await c.req.json()
  const { userId, persona, llmPreferences } = body

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: body.email || '',
      persona,
      llm_preferences: llmPreferences,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ success: true, data })
})

app.put('/api/personas/:userId', async (c) => {
  const userId = c.req.param('userId')
  const updates = await c.req.json()

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)

  const { data, error } = await supabase
    .from('profiles')
    .update({
      persona: updates.persona,
      llm_preferences: updates.llmPreferences,
      custom_data: updates.customData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return c.json({ error: error.message }, 400)
  }

  return c.json({ success: true, data })
})

// ============================================
// CHROME EXTENSION ENDPOINTS
// ============================================

app.post('/api/extension/personalize', async (c) => {
  try {
    const body = await c.req.json()
    const { token, pageInfo } = body

    // Validate token
    if (!token) {
      return c.json({ error: 'Token required' }, 400)
    }

    // Decode token (userId:timestamp)
    let userId: string
    try {
      const decoded = atob(token)
      const [extractedUserId, timestamp] = decoded.split(':')
      userId = extractedUserId

      // Check if token is less than 24 hours old
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return c.json({ error: 'Token expired - please visit Twin dashboard' }, 401)
      }
    } catch (e) {
      return c.json({ error: 'Invalid token' }, 400)
    }

    // Fetch persona from Supabase
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
    const { data: personaRecord, error: fetchError } = await supabase
      .from('user_personas')
      .select('persona')
      .eq('user_id', userId)
      .single()

    if (fetchError || !personaRecord) {
      return c.json({ error: 'No persona found - please create one first' }, 404)
    }

    const persona = personaRecord.persona

    // Validate persona has meaningful data
    const hasInterests = persona.interests && persona.interests.length > 0
    const hasGoals = persona.currentGoals && persona.currentGoals.length > 0

    if (!hasInterests && !hasGoals) {
      return c.json({
        error: 'Persona incomplete - please add interests and goals in your dashboard',
        incomplete: true
      }, 400)
    }

    // Build user context from persona
    const userContext = buildPersonaContext(persona)

    // Build AI prompt
    const prompt = `You are an AI-powered content personalization engine that curates and ranks content based on a user's unique persona.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 USER PERSONA (Use this to make ALL ranking decisions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${userContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 PAGE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website: ${pageInfo.hostname}
URL: ${pageInfo.url}

PAGE CONTENT (simplified DOM):
${pageInfo.simplifiedDOM}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 PERSONALIZATION TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CONTENT EXTRACTION
- Parse the PAGE CONTENT above - each item is formatted as:
  ITEM N:
  Text: ...
  URL: ...
  Image: ... (this is the imageUrl you MUST use)
  ---
- For EACH item, extract:
  * title: from the Text field
  * url: from the URL field
  * imageUrl: from the Image field (USE THIS EXACTLY AS PROVIDED)
  * metadata: any additional info from Text (upvotes, comments, views, author, date, etc.)
- **CRITICAL**: Use the EXACT Image URL from each ITEM block
- **DO NOT** generate, modify, or create image URLs
- If an ITEM has no "Image:" line, set imageUrl to null
- EXCLUDE: Ads, sponsored content, promoted posts

STEP 2: INTELLIGENT RANKING (0-100 score)
Rank each item based on relevance to the user's persona:

HIGH PRIORITY (80-100): Content that directly matches:
- User's stated interests
- User's current goals
- User's profession/expertise area
- Topics they're actively trying to learn

MEDIUM PRIORITY (50-79): Content that is:
- Related to their interests but not core
- At their preferred technical level
- In a format they prefer (based on style preferences)

LOW PRIORITY (0-49): Content that is:
- Off-topic from their interests
- Too basic/advanced for their technical level
- Not aligned with their goals

STEP 3: GENERATE PERSONALIZED FEED
Create a beautiful, personalized feed showing the top 10-15 ranked items:

DESIGN REQUIREMENTS:
- Match the website's aesthetic
- Clean, modern card design with clear hierarchy
- Display ALL metadata prominently (votes, views, comments, etc.)
- Include a personalized reason explaining WHY each item was selected

PERSONALIZATION NOTES:
- For EACH item, write a brief (1-2 sentence) explanation of why it matches their interests/goals
- Use their persona to make these explanations personal and specific
- Reference their goals, profession, or interests in your reasoning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 OUTPUT FORMAT (STRICT JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON in this exact format:
{
  "items": [
    {
      "id": "unique-id",
      "title": "...",
      "url": "...",
      "imageUrl": "... (MUST be from page content, or null if not found)",
      "score": 95,
      "reason": "Personalized explanation referencing their interests/goals",
      "metadata": {
        "views": "1.2M",
        "upvotes": "542",
        "comments": "87",
        "author": "...",
        "channel": "...",
        "date": "..."
      }
    }
  ]
}`

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${c.env.GOOGLE_AI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8000,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return c.json({ error: 'AI service unavailable' }, 500)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      return c.json({ error: 'No content generated' }, 500)
    }

    // Parse the JSON response
    const parsed = JSON.parse(generatedText)

    return c.json(parsed)

  } catch (error) {
    console.error('Extension personalize error:', error)
    return c.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, 500)
  }
})

// Helper function to build persona context
function buildPersonaContext(persona: any): string {
  let context = ''
  let warnings: string[] = []

  // Identity section
  if (persona.name || persona.profession) {
    context += '👤 IDENTITY:\n'
    if (persona.name) context += `   Name: ${persona.name}\n`
    if (persona.profession) context += `   Profession: ${persona.profession}\n`
    context += '\n'
  }

  // Interests section - CRITICAL for ranking
  if (persona.interests && persona.interests.length > 0) {
    context += '❤️  CORE INTERESTS (Rank content matching these HIGHEST):\n'
    persona.interests.forEach((interest: string, i: number) => {
      context += `   ${i + 1}. ${interest}\n`
    })
    context += '\n'
  } else {
    warnings.push('No interests defined')
  }

  // Goals section - CRITICAL for personalization
  if (persona.currentGoals && persona.currentGoals.length > 0) {
    context += '🎯 CURRENT GOALS (Prioritize content helping achieve these):\n'
    persona.currentGoals.forEach((goal: string, i: number) => {
      context += `   ${i + 1}. ${goal}\n`
    })
    context += '\n'
  } else {
    warnings.push('No goals defined')
  }

  // Communication style preferences
  if (persona.style || persona.communicationStyle) {
    const style = persona.style || persona.communicationStyle
    context += '📚 CONTENT PREFERENCES:\n'
    context += `   Formality: ${style.formality || 'casual'}\n`
    context += `   Detail Level: ${style.verbosity || 'balanced'}\n`
    context += `   Technical Level: ${style.technical_level || style.technicalLevel || 'intermediate'}\n`
    context += '\n'
  }

  // Language preferences
  if (persona.preferredLanguage || (persona.languages && persona.languages.length > 0)) {
    context += '🌍 LANGUAGES:\n'
    if (persona.preferredLanguage) {
      context += `   Primary: ${persona.preferredLanguage}\n`
    }
    if (persona.languages && persona.languages.length > 1) {
      context += `   Also speaks: ${persona.languages.filter((l: string) => l !== persona.preferredLanguage).join(', ')}\n`
    }
    context += '\n'
  }

  // Add warnings if persona is incomplete
  if (warnings.length > 0) {
    context += '⚠️  PERSONA INCOMPLETE:\n'
    warnings.forEach(warning => {
      context += `   - ${warning}\n`
    })
    context += '   → Use generic content recommendations\n\n'
  }

  return context || '⚠️  EMPTY PERSONA: No user preferences available.\n'
}

// ============================================
// MEMORY ENDPOINTS
// ============================================

app.post('/api/memories', async (c) => {
  const body = await c.req.json()
  const { userId, content, metadata } = body

  // Store in mem0
  const response = await fetch('https://api.mem0.ai/v1/memories/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${c.env.MEM0_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content }],
      user_id: userId,
      metadata
    })
  })

  if (!response.ok) {
    return c.json({ error: 'Failed to store memory' }, 500)
  }

  const result = await response.json()
  return c.json(result)
})

app.post('/api/memories/search', async (c) => {
  const body = await c.req.json()
  const { userId, query, limit = 5 } = body

  const response = await fetch('https://api.mem0.ai/v1/memories/search/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${c.env.MEM0_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      filters: { AND: [{ user_id: userId }] },
      version: 'v2',
      limit
    })
  })

  if (!response.ok) {
    return c.json({ error: 'Failed to search memories' }, 500)
  }

  const results = await response.json()
  return c.json(results)
})

app.get('/api/memories/:userId', async (c) => {
  const userId = c.req.param('userId')
  const page = c.req.query('page') || '1'
  const pageSize = c.req.query('pageSize') || '20'

  const response = await fetch(
    `https://api.mem0.ai/v1/memories/?version=v2&page=${page}&page_size=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Token ${c.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: { AND: [{ user_id: userId }] }
      })
    }
  )

  if (!response.ok) {
    return c.json({ error: 'Failed to fetch memories' }, 500)
  }

  const memories = await response.json()
  return c.json(memories)
})

// ============================================
// CONTEXT GENERATION - CRITICAL ENDPOINT
// ============================================

app.post('/api/context/generate', async (c) => {
  const body = await c.req.json()
  const {
    userId,
    purpose = 'general',
    task,
    includeMemories = true,
    memoryLimit = 5,
    llm = 'auto'
  } = body

  // 1. Get persona from Supabase
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const persona = profile?.persona || {}
  const llmPreferences = profile?.llm_preferences || {
    default: 'claude',
    coding: 'claude',
    creative: 'gemini',
    analysis: 'openai'
  }

  // 2. Determine which LLM to use
  let selectedLLM = llm
  if (llm === 'auto') {
    selectedLLM = llmPreferences[purpose] || llmPreferences.default || 'claude'
  }

  // 3. Get relevant memories if requested
  let memories = []
  if (includeMemories) {
    const searchQuery = task || getDefaultQueryForPurpose(purpose, persona)

    const memResponse = await fetch('https://api.mem0.ai/v1/memories/search/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${c.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: searchQuery,
        filters: { AND: [{ user_id: userId }] },
        version: 'v2',
        limit: memoryLimit
      })
    })

    if (memResponse.ok) {
      const memData = await memResponse.json()
      memories = Array.isArray(memData) ? memData : []
    }
  }

  // 4. Build context
  const contextParts: string[] = []

  // Add persona identity
  if (persona.name) {
    contextParts.push(`You are assisting ${persona.name}`)

    if (persona.profession) {
      contextParts.push(`, a ${persona.profession}`)
    }
  }

  // Add communication style
  if (persona.style) {
    contextParts.push(
      `who prefers ${persona.style.formality || 'casual'}, ${
        persona.style.verbosity || 'balanced'
      } communication at ${persona.style.technical_level || 'intermediate'} technical level`
    )
  }

  // Add languages
  if (persona.languages?.length > 0) {
    contextParts.push(
      `Languages: ${persona.languages.join(', ')} (preferred: ${
        persona.preferredLanguage || persona.languages[0]
      })`
    )
  }

  // Add current goals - CRITICAL
  if (persona.currentGoals?.length > 0) {
    contextParts.push(`Current goals: ${persona.currentGoals.join(', ')}`)
  }

  // Add interests
  if (persona.interests?.length > 0) {
    contextParts.push(`Interests: ${persona.interests.join(', ')}`)
  }

  // Add memories
  if (memories.length > 0) {
    const memoryTexts = memories
      .map(m => m.memory || m.content || m.text)
      .filter(Boolean)

    if (memoryTexts.length > 0) {
      contextParts.push(`Relevant context: ${memoryTexts.join('. ')}`)
    }
  }

  // Add custom data if present
  if (profile?.custom_data && Object.keys(profile.custom_data).length > 0) {
    contextParts.push(`Additional preferences: ${JSON.stringify(profile.custom_data)}`)
  }

  const systemPrompt = contextParts.join('. ') + '.'

  return c.json({
    systemPrompt,
    llmSelected: selectedLLM,
    tokenCount: Math.ceil(systemPrompt.length / 4),
    memoriesIncluded: memories.length,
    persona: {
      name: persona.name,
      goals: persona.currentGoals || []
    }
  })
})

// ============================================
// LLM CHAT ENDPOINTS
// ============================================

app.post('/api/chat', async (c) => {
  const body = await c.req.json()
  const { userId, message, llm = 'auto', includeContext = true } = body

  // Generate context first if needed
  let systemPrompt = ''
  let selectedLLM = llm

  if (includeContext) {
    const contextResponse = await fetch(`${c.req.url.replace('/chat', '/context/generate')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        purpose: 'chat',
        llm
      })
    })

    const contextData = await contextResponse.json()
    systemPrompt = contextData.systemPrompt
    selectedLLM = contextData.llmSelected
  }

  // Call the appropriate LLM
  let llmResponse

  try {
    if (selectedLLM === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        })
      })
      llmResponse = await response.json()
    } else if (selectedLLM === 'anthropic' || selectedLLM === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': c.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          system: systemPrompt,
          messages: [{ role: 'user', content: message }]
        })
      })
      llmResponse = await response.json()
    } else if (selectedLLM === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${c.env.GOOGLE_AI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\nUser: ${message}`
              }]
            }]
          })
        }
      )
      llmResponse = await response.json()
    }
  } catch (error) {
    return c.json({ error: 'LLM request failed', details: error }, 500)
  }

  return c.json({
    response: llmResponse,
    llmUsed: selectedLLM
  })
})

// ============================================
// EXPORT/IMPORT ENDPOINTS
// ============================================

app.get('/api/export/:userId', async (c) => {
  const userId = c.req.param('userId')
  const format = c.req.query('format') || 'json'

  // Get persona
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (!profile) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Get memories
  const memResponse = await fetch(
    `https://api.mem0.ai/v1/memories/?version=v2&page=1&page_size=100`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Token ${c.env.MEM0_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: { AND: [{ user_id: userId }] }
      })
    }
  )

  const memories = memResponse.ok ? await memResponse.json() : []

  const exportData = {
    version: '1.0.0',
    exported: new Date().toISOString(),
    persona: profile.persona,
    llmPreferences: profile.llm_preferences,
    customData: profile.custom_data,
    memories: memories
  }

  if (format === 'yaml') {
    // Simple YAML conversion
    const yaml = JSON.stringify(exportData, null, 2)
      .replace(/"/g, '')
      .replace(/{/g, '')
      .replace(/}/g, '')
      .replace(/,/g, '')
    return c.text(yaml, 200, { 'Content-Type': 'text/yaml' })
  }

  return c.json(exportData)
})

// ============================================
// HEALTH & STATUS ENDPOINTS
// ============================================

app.get('/api/status', async (c) => {
  const checks = {
    supabase: false,
    mem0: false,
    openai: false,
    anthropic: false,
    gemini: false
  }

  // Check Supabase
  try {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY)
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.supabase = !error
  } catch {}

  // Check mem0
  try {
    const response = await fetch('https://api.mem0.ai/v1/memories/', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${c.env.MEM0_API_KEY}`
      }
    })
    checks.mem0 = response.ok
  } catch {}

  return c.json({
    status: Object.values(checks).some(v => v) ? 'partial' : 'down',
    services: checks,
    timestamp: new Date().toISOString()
  })
})

// Helper function
function getDefaultQueryForPurpose(purpose: string, persona: any): string {
  switch (purpose) {
    case 'coding':
      return 'programming languages frameworks tools preferences'
    case 'creative':
      return 'creative writing style preferences inspiration'
    case 'analysis':
      return 'data analysis methods tools insights'
    default:
      return persona.interests?.join(' ') || 'general context'
  }
}

export default app