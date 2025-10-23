import { createClient } from '@/lib/supabase/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
} as const

type PageInfo = {
  hostname?: string
  url?: string
  simplifiedDOM?: string
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return jsonError('Invalid request body', 400)
    }

    const { token, pageInfo } = body as { token?: string; pageInfo?: PageInfo }

    if (!token) {
      return jsonError('Token required', 400)
    }

    if (!pageInfo || typeof pageInfo !== 'object') {
      return jsonError('Page information required', 400)
    }

    let userId: string
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8')
      const [extractedUserId, timestamp] = decoded.split(':')

      if (!extractedUserId || !timestamp) {
        return jsonError('Invalid token', 400)
      }

      const issuedAt = parseInt(timestamp, 10)
      if (Number.isNaN(issuedAt)) {
        return jsonError('Invalid token', 400)
      }

      const tokenAge = Date.now() - issuedAt
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return jsonError('Token expired - please visit Twin dashboard', 401)
      }

      userId = extractedUserId
    } catch (error) {
      console.error('[API] Failed to decode token:', error)
      return jsonError('Invalid token', 400)
    }

    const supabase = await createClient()
    const { data: personaRecord, error: fetchError } = await supabase
      .from('user_personas')
      .select('persona')
      .eq('user_id', userId)
      .single()

    if (fetchError || !personaRecord?.persona) {
      return jsonError('No persona found - please create one first', 404)
    }

    const persona = personaRecord.persona

    const hasInterests = Array.isArray(persona.interests) && persona.interests.length > 0
    const hasGoals = Array.isArray(persona.currentGoals) && persona.currentGoals.length > 0

    if (!hasInterests && !hasGoals) {
      return jsonError(
        'Persona incomplete - please add interests and goals in your dashboard',
        400
      )
    }

    const personaContext = buildPersonaContext(persona)
    const prompt = buildPrompt(personaContext, pageInfo)

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY
    if (!apiKey) {
      console.error('[API] Missing GEMINI_API_KEY (or GOOGLE_AI_KEY) environment variable')
      return jsonError('AI service unavailable', 500)
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json'
        }
      })
    })

    if (!response.ok) {
      const errorPreview = await response.text().catch(() => '[unreadable error body]')
      console.error('[API] Gemini error:', response.status, response.statusText, errorPreview)
      return jsonError('AI service unavailable', 502)
    }

    const generated = await response.json()
    const generatedText = generated?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText || typeof generatedText !== 'string') {
      console.error('[API] Gemini response missing text payload')
      return jsonError('Invalid AI response', 502)
    }

    let parsed
    try {
      parsed = JSON.parse(generatedText)
    } catch (error) {
      console.error('[API] Failed to parse AI JSON:', error, generatedText.slice(0, 240))
      return jsonError('AI response malformed', 502)
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    })
  } catch (error) {
    console.error('[API] Extension personalize error:', error)
    return jsonError('Internal server error', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  })
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  })
}

function buildPrompt(personaContext: string, pageInfo: PageInfo) {
  const hostname = pageInfo.hostname || 'Unknown site'
  const url = pageInfo.url || 'Unknown URL'
  const simplifiedDOM = pageInfo.simplifiedDOM || '[No DOM captured]'

  return `You are an AI-powered content personalization engine that curates and ranks content based on a user's unique persona.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 USER PERSONA (Use this to make ALL ranking decisions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${personaContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 PAGE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website: ${hostname}
URL: ${url}

PAGE CONTENT (simplified DOM):
${simplifiedDOM}

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
Create a clean, personalized feed showing the top 10-15 ranked items:
- Match the website's aesthetic
- Use modern cards with clear hierarchy
- Display ALL metadata prominently (votes, views, comments, etc.)
- Include a personalized reason explaining WHY each item was selected

OUTPUT STRICT JSON:
{
  "items": [
    {
      "id": "unique-id",
      "title": "...",
      "url": "...",
      "imageUrl": "... or null",
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
}

Return ONLY valid JSON.
`
}

function buildPersonaContext(persona: any): string {
  let context = ''
  const warnings: string[] = []

  if (persona?.name || persona?.profession) {
    context += '👤 IDENTITY:\n'
    if (persona.name) context += `   Name: ${persona.name}\n`
    if (persona.profession) context += `   Profession: ${persona.profession}\n`
    context += '\n'
  }

  if (Array.isArray(persona?.interests) && persona.interests.length > 0) {
    context += '❤️  CORE INTERESTS (Prioritize content matching these):\n'
    persona.interests.forEach((interest: string, idx: number) => {
      context += `   ${idx + 1}. ${interest}\n`
    })
    context += '\n'
  } else {
    warnings.push('No interests defined')
  }

  if (Array.isArray(persona?.currentGoals) && persona.currentGoals.length > 0) {
    context += '🎯 CURRENT GOALS (Favor content helping achieve these):\n'
    persona.currentGoals.forEach((goal: string, idx: number) => {
      context += `   ${idx + 1}. ${goal}\n`
    })
    context += '\n'
  } else {
    warnings.push('No goals defined')
  }

  const style = persona?.style || persona?.communicationStyle
  if (style) {
    context += '📚 CONTENT PREFERENCES:\n'
    context += `   Formality: ${style.formality || 'casual'}\n`
    context += `   Detail Level: ${style.verbosity || 'balanced'}\n`
    context += `   Technical Level: ${
      style.technical_level || style.technicalLevel || 'intermediate'
    }\n`
    context += '\n'
  }

  if (persona?.preferredLanguage || (Array.isArray(persona?.languages) && persona.languages.length > 0)) {
    context += '🌍 LANGUAGES:\n'
    if (persona.preferredLanguage) {
      context += `   Primary: ${persona.preferredLanguage}\n`
    }
    if (Array.isArray(persona.languages) && persona.languages.length > 1) {
      context += `   Also speaks: ${persona.languages
        .filter((lang: string) => lang !== persona.preferredLanguage)
        .join(', ')}\n`
    }
    context += '\n'
  }

  if (warnings.length > 0) {
    context += '⚠️  PERSONA INCOMPLETE:\n'
    warnings.forEach((warning) => {
      context += `   - ${warning}\n`
    })
    context += '   → Use broader, generalized recommendations if needed\n\n'
  }

  return context || '⚠️  EMPTY PERSONA: No user preferences available.\n'
}
