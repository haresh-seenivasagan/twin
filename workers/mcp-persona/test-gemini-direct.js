/**
 * Direct test of Gemini API for persona generation
 * This tests ONLY the LLM service without the full MCP stack
 */

// Read API key from environment ONLY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ Error: GEMINI_API_KEY not found in environment');
  console.error('Run: export GEMINI_API_KEY=your-key-here');
  process.exit(1);
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = "gemini-2.0-flash-exp";

async function testGeminiPersonaGeneration() {
  console.log('🧪 Testing Gemini API for Persona Generation\n');

  const prompt = `You are an expert at creating detailed user personas.

Analyze this mock user data:
- YouTube: Subscribed to Fireship, ThePrimeagen, Web Dev Simplified
- GitHub: 4 TypeScript repos, 2 JavaScript repos, starred React/TypeScript projects
- LinkedIn: Senior Full-Stack Developer, Skills: TypeScript, React, Node.js

Generate a persona JSON:
{
  "name": "Test Developer",
  "languages": ["en"],
  "preferredLanguage": "en",
  "style": {
    "formality": "casual",
    "verbosity": "concise",
    "technical_level": "advanced"
  },
  "interests": ["array of 5 synthesized interests - NOT raw channel names"],
  "profession": "Senior Full-Stack Developer",
  "currentGoals": ["3 specific personalized goals based on activity"]
}`;

  try {
    console.log('📤 Calling Gemini API...\n');

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
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
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content in Gemini response");
    }

    const persona = JSON.parse(generatedText);

    console.log('✅ SUCCESS! Gemini generated persona:\n');
    console.log(JSON.stringify(persona, null, 2));
    console.log('\n📊 Analysis:');
    console.log('  - Interests are synthesized:', !persona.interests.includes('Fireship'));
    console.log('  - Goals are personalized:', persona.currentGoals[0]);
    console.log('  - Technical level inferred:', persona.style.technical_level);
    console.log('\n✅ LLM persona generation is WORKING!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGeminiPersonaGeneration();
