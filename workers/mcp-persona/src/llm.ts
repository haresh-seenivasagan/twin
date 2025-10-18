/**
 * LLM Service for Persona Generation
 * Uses Google Gemini with structured outputs for intelligent persona creation
 */

import { PersonaSchema, type Persona, type ConnectedAccounts } from "./schemas";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxRetries?: number;
}

/**
 * Generate a persona using Gemini with structured JSON output
 */
export async function generatePersonaWithLLM(
  accounts: ConnectedAccounts,
  config: GeminiConfig,
  options?: {
    focusAreas?: string[];
    customInstructions?: string;
    userName?: string;
    generationContext?: any;
  }
): Promise<Persona | null> {
  const { apiKey, model = "gemini-2.5-flash", temperature = 0.7, maxRetries = 3 } = config;

  // Build rich context from connected accounts
  const context = buildAccountContext(accounts, options);

  // Build focus areas instruction if provided (FRONT-LOAD THIS)
  const hasFocusAreas = options?.focusAreas && options.focusAreas.length > 0;
  const focusAreasText = hasFocusAreas ? options.focusAreas.join(', ') : '';

  // Build rich context from generation context (user's answers to focus area questions)
  let contextDetails = '';
  if (options?.generationContext?.context) {
    const ctx = options.generationContext.context;
    contextDetails = '\n\n📝 USER CONTEXT (Critical Information):\n';

    for (const [focusArea, answers] of Object.entries(ctx)) {
      if (answers && typeof answers === 'object') {
        contextDetails += `\n${focusArea.toUpperCase()}:\n`;
        for (const [key, value] of Object.entries(answers as Record<string, any>)) {
          if (value && key !== 'notes') {
            contextDetails += `- ${key}: ${value}\n`;
          }
        }
        if ((answers as any).notes) {
          contextDetails += `- Additional context: ${(answers as any).notes}\n`;
        }
      }
    }

    contextDetails += '\n⚠️ USE THIS CONTEXT to make goals HIGHLY SPECIFIC to their situation.';
  }

  const customInstruction = options?.customInstructions
    ? `\n\nUSER'S CUSTOM INSTRUCTIONS:\n${options.customInstructions}`
    : '';

  // Create prompt for persona generation
  // CRITICAL: Focus areas DOMINATE goal generation
  const prompt = hasFocusAreas
    ? `You are an expert at creating detailed user personas from connected account data.

🎯 PRIMARY DIRECTIVE - USER'S FOCUS AREAS:
The user has explicitly selected these life areas as their current priorities:
${focusAreasText}
${contextDetails}

YOUR TASK:
1. Generate 3-5 MEASURABLE, ACTIONABLE goals that DIRECTLY advance these focus areas
2. Use connected account data ONLY to enrich interests and communication style
3. If account data (YouTube, GitHub, etc.) doesn't align with focus areas, IGNORE it for goal generation

Connected Account Data (FOR INTERESTS & STYLE ONLY):
${context}${customInstruction}

GOAL GENERATION RULES (CRITICAL):
- ✅ Goals MUST be specific, measurable, and time-bound (SMART framework)
- ✅ Goals MUST directly relate to the focus areas: ${focusAreasText}
- ✅ Each goal should have a clear outcome (e.g., "Complete 3 dates per month" NOT "Improve dating life")
- ❌ DO NOT generate goals about YouTube content topics unless they match focus areas
- ❌ DO NOT default to technical/programming goals unless "technical" is a focus area

FOCUS AREA EXAMPLES:
- "relationships" → "Initiate 2 meaningful conversations per week with new people", "Complete communication skills course by end of month"
- "health" → "Exercise 4x per week for 30 minutes", "Meal prep every Sunday for the week ahead"
- "career" → "Apply to 5 senior roles by month-end", "Complete leadership certification within 3 months"

Generate a persona that is:
- Insightful: Synthesize interests from account data, don't just list channel names
- Goal-focused: Prioritize focus areas above all else
- Measurable: Every goal should have a clear success metric
- Actionable: Goals should be specific steps, not vague aspirations

Return a JSON object matching this schema:
{
  "name": "string (ONLY use if explicitly provided, NEVER infer from YouTube channel names)",
  "languages": ["array of language codes like 'en', 'zh'"],
  "preferredLanguage": "string (primary language code)",
  "style": {
    "formality": "casual | formal | adaptive",
    "verbosity": "concise | detailed | balanced",
    "technical_level": "beginner | intermediate | advanced"
  },
  "interests": ["array of 5-8 synthesized interests from account data, NOT raw channel names"],
  "profession": "string (ONLY if clear from LinkedIn/GitHub bio, otherwise empty string)",
  "currentGoals": ["array of 3-5 MEASURABLE goals based on focus areas: ${focusAreasText}"]
}

FINAL REMINDER:
- Interests: Use YouTube/GitHub data to synthesize themes
- Goals: MUST align with focus areas (${focusAreasText}), ignore account data if misaligned
- Make goals specific, measurable, and actionable (SMART framework)`
    : `You are an expert at creating detailed user personas from connected account data.

Analyze this user's connected accounts and create a comprehensive persona that captures:
1. Their professional identity and technical expertise
2. Core interests and focus areas (synthesize from their activity, not just list channel names)
3. Communication preferences and learning style
4. Specific, actionable current goals based on their recent activity

Connected Account Data:
${context}${customInstruction}

Generate a persona that is:
- Insightful: Go beyond surface-level data extraction
- Personalized: Reflect their unique combination of interests and expertise
- Actionable: Include specific, measurable goals that match their current trajectory
- Coherent: Create a unified profile, not just aggregated data

Return a JSON object matching this schema:
{
  "name": "string (ONLY use if explicitly provided, NEVER infer from YouTube channel names)",
  "languages": ["array of language codes like 'en', 'zh'"],
  "preferredLanguage": "string (primary language code)",
  "style": {
    "formality": "casual | formal | adaptive",
    "verbosity": "concise | detailed | balanced",
    "technical_level": "beginner | intermediate | advanced"
  },
  "interests": ["array of 5-8 synthesized interests, NOT raw channel names"],
  "profession": "string (their role/title, can be undefined if unknown)",
  "currentGoals": ["array of 3-5 specific, measurable goals based on their activity"]
}

IMPORTANT:
- For interests: Synthesize themes (e.g., "Building production AI applications" NOT "AI/ML Channel")
- For goals: Be specific and measurable (e.g., "Master TypeScript generics for React components" NOT "Learn new technologies")
- Infer technical level from GitHub activity, LinkedIn skills, and content complexity
- Choose communication style based on their professional profile and content consumption`;

  // Try with retries and exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature,
              responseMimeType: "application/json",
              // Use Gemini's schema validation for structured output
              responseSchema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  languages: { type: "array", items: { type: "string" } },
                  preferredLanguage: { type: "string" },
                  style: {
                    type: "object",
                    properties: {
                      formality: { type: "string", enum: ["casual", "formal", "adaptive"] },
                      verbosity: { type: "string", enum: ["concise", "detailed", "balanced"] },
                      technical_level: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                    },
                    required: ["formality", "verbosity", "technical_level"]
                  },
                  interests: { type: "array", items: { type: "string" } },
                  profession: { type: "string" },
                  currentGoals: { type: "array", items: { type: "string" } }
                },
                required: ["name", "languages", "preferredLanguage", "style", "interests", "currentGoals"]
              }
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${error}`);
      }

      const data = await response.json();

      // Extract the generated content
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error("No content in Gemini response");
      }

      // Parse and validate against our Zod schema
      const personaData = JSON.parse(generatedText);

      // Override name with user's preferred name if provided
      if (options?.userName) {
        personaData.name = options.userName;
      }

      const persona = PersonaSchema.parse(personaData);

      return persona;

    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        console.error("LLM persona generation failed after all retries:", error);
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}

/**
 * Build rich context string from connected accounts
 */
function buildAccountContext(
  accounts: ConnectedAccounts,
  options?: { focusAreas?: string[]; customInstructions?: string }
): string {
  const sections: string[] = [];

  // YouTube Data (if available)
  if (accounts.google?.youtube) {
    const yt = accounts.google.youtube;

    if (yt.subscriptions?.length) {
      const channels = yt.subscriptions
        .slice(0, 20)
        .map(sub => `- ${sub.snippet?.title}${sub.snippet?.description ? `: ${sub.snippet.description.slice(0, 100)}` : ''}`)
        .join('\n');
      sections.push(`YouTube Subscriptions (${yt.subscriptions.length} total):\n${channels}`);
    }

    if (yt.playlists?.length) {
      const playlists = yt.playlists
        .slice(0, 10)
        .map(pl => `- ${pl.snippet?.title}`)
        .join('\n');
      sections.push(`YouTube Playlists:\n${playlists}`);
    }
  }

  // GitHub Data (if available)
  if (accounts.github) {
    const gh = accounts.github;

    sections.push(`GitHub Profile: ${gh.name} (@${gh.login})`);
    if (gh.bio) sections.push(`Bio: ${gh.bio}`);
    if (gh.company) sections.push(`Company: ${gh.company}`);
    if (gh.location) sections.push(`Location: ${gh.location}`);

    if (gh.repos?.length) {
      const topRepos = gh.repos
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 10)
        .map(r => `- ${r.name} (${r.language || 'N/A'}, ${r.stars} stars)`)
        .join('\n');
      sections.push(`Top GitHub Repositories (${gh.repos.length} total):\n${topRepos}`);

      // Language summary
      const languages = gh.repos.reduce<Record<string, number>>((acc, r) => {
        if (r.language) acc[r.language] = (acc[r.language] || 0) + 1;
        return acc;
      }, {});
      const langSummary = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ');
      sections.push(`Programming Languages: ${langSummary}`);
    }

    if (gh.starred?.length) {
      const topics = gh.starred
        .flatMap(s => s.topics || [])
        .reduce<Record<string, number>>((acc, t) => {
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
      const topTopics = Object.entries(topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([topic]) => topic)
        .join(', ');
      sections.push(`GitHub Starred Topics: ${topTopics}`);
    }
  }

  // LinkedIn Data (if available)
  if (accounts.linkedin) {
    const li = accounts.linkedin;
    sections.push(`LinkedIn: ${li.name}`);
    sections.push(`Headline: ${li.headline}`);
    if (li.industry) sections.push(`Industry: ${li.industry}`);
    if (li.skills?.length) {
      sections.push(`Skills: ${li.skills.slice(0, 20).join(', ')}`);
    }
  }

  // Twitter Data (if available)
  if (accounts.twitter) {
    const tw = accounts.twitter;
    sections.push(`Twitter: ${tw.name} (@${tw.username})`);
    if (tw.bio) sections.push(`Bio: ${tw.bio}`);

    if (tw.following?.length) {
      const categories = tw.following
        .map(f => f.category)
        .filter(Boolean)
        .slice(0, 10)
        .join(', ');
      if (categories) sections.push(`Following Categories: ${categories}`);
    }
  }

  // Google Profile (if available)
  if (accounts.google) {
    const g = accounts.google;
    if (g.name) sections.push(`Google Profile: ${g.name}`);
    if (g.email) sections.push(`Email: ${g.email}`);
    if (g.locale) sections.push(`Locale: ${g.locale}`);
  }

  return sections.join('\n\n');
}
