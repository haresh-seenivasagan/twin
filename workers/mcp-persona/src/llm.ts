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
  config: GeminiConfig
): Promise<Persona | null> {
  const { apiKey, model = "gemini-2.0-flash-exp", temperature = 0.7, maxRetries = 3 } = config;

  // Build rich context from connected accounts
  const context = buildAccountContext(accounts);

  // Create prompt for persona generation
  const prompt = `You are an expert at creating detailed user personas from connected account data.

Analyze this user's connected accounts and create a comprehensive persona that captures:
1. Their professional identity and technical expertise
2. Core interests and focus areas (synthesize from their activity, not just list channel names)
3. Communication preferences and learning style
4. Specific, actionable current goals based on their recent activity

Connected Account Data:
${context}

Generate a persona that is:
- Insightful: Go beyond surface-level data extraction
- Personalized: Reflect their unique combination of interests and expertise
- Actionable: Include specific goals that match their current trajectory
- Coherent: Create a unified profile, not just aggregated data

Return a JSON object matching this schema:
{
  "name": "string (their name from accounts)",
  "languages": ["array of language codes like 'en', 'zh'"],
  "preferredLanguage": "string (primary language code)",
  "style": {
    "formality": "casual | formal | adaptive",
    "verbosity": "concise | detailed | balanced",
    "technical_level": "beginner | intermediate | advanced"
  },
  "interests": ["array of 5-8 synthesized interests, NOT raw channel names"],
  "profession": "string (their role/title, can be undefined if unknown)",
  "currentGoals": ["array of 3-5 specific, personalized goals based on their activity"]
}

IMPORTANT:
- For interests: Synthesize themes (e.g., "Building production AI applications" NOT "AI/ML Channel")
- For goals: Be specific to their context (e.g., "Master TypeScript generics for React components" NOT "Learn new technologies")
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
function buildAccountContext(accounts: ConnectedAccounts): string {
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
