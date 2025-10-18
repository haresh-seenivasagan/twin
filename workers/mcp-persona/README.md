# Twin MCP Persona Server

**🚀 LIVE:** https://twin-mcp-persona.erniesg.workers.dev/mcp

Generate AI personas for your app - **no setup required!**

---

## ⚡ Quick Start (< 30 seconds)

### Try it right now:

```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.generate_mock",
      "arguments":{"template":"developer"}
    },
    "id":1
  }' | jq -r '.result.content[0].text' | jq .
```

**Output:**
```json
{
  "name": "Alex Chen",
  "profession": "Senior Full-Stack Developer",
  "languages": ["en", "zh"],
  "currentGoals": ["Build scalable microservices", "Learn Rust"]
}
```

### From your code:

```typescript
import { mcpClient } from '@/lib/mcp/client';

// ✅ Works immediately - no configuration needed!
const persona = await mcpClient.generateMockPersona({
  template: 'developer',
  customInstructions: 'senior developer from Singapore'
});
```

**Available templates:** `developer`, `designer`, `manager`, `student`, `random`

---

## 📊 Deployment Status

| What | Where | Status |
|------|-------|--------|
| **MCP Server** | https://twin-mcp-persona.erniesg.workers.dev/mcp | ✅ **LIVE** |
| **Health Check** | https://twin-mcp-persona.erniesg.workers.dev/health | ✅ **LIVE** |
| **Mock Personas** | 5 templates + custom instructions | ✅ **LIVE** |
| **Rate Limiting** | 100 req/hour per IP | ✅ **LIVE** |
| **All 8 Tools** | CRUD + Export + Generation | ✅ **LIVE** |

**No API keys, no auth, no setup - just call the endpoint!** 🎉

---

## Overview

This MCP server provides tools for:
- Generating personalized AI personas from connected social accounts (Google, GitHub, LinkedIn, Twitter)
- Exporting personas in multiple formats (JSON, YAML, LLM prompts)
- Managing persona versioning and history
- Storing personas with pluggable adapters (memory, Convex, Supabase)

## Architecture

```
src/
├── index.ts        # Main MCP server setup and tool registration
├── schemas.ts      # Zod schemas for validation
├── generation.ts   # Persona generation logic from accounts
└── adapter.ts      # Storage adapter interface + in-memory implementation
```

## Tools

### 1. `persona.generate_mock` - For Testing & Development 🆕

Generates test personas without OAuth or real account data. Perfect for development!

**Input:**
```typescript
{
  template?: "developer" | "designer" | "manager" | "student" | "random";
  customInstructions?: string;  // Freeform text!
}
```

**Output:** Same as `generate_from_accounts` (Persona object)

**Examples:**
```typescript
// Random persona
{ template: "random" }

// Specific role
{ template: "developer" }

// With custom instructions (freeform!)
{
  template: "developer",
  customInstructions: "Make them a senior developer from Singapore who likes Rust"
}
```

**Custom Instructions Support:**
- Geographic hints: "singapore", "sg" → adds regional languages
- Seniority: "senior", "lead" → advanced technical level
- Experience: "junior", "beginner" → beginner level
- Style: "formal", "verbose", "concise" → adjusts communication style

**Templates Available:**
- `developer` - Alex Chen, Senior Full-Stack Developer (TypeScript, React)
- `designer` - Maya Patel, Product Designer (UI/UX, Figma)
- `manager` - Jordan Lee, Engineering Manager (Leadership, Agile)
- `student` - Sam Wilson, CS Student (Python, Web Dev)
- `random` - Randomly picks one of the above

### 2. `persona.generate_from_accounts`

Generates a normalized persona profile from connected social/account data.

**Input:**
```typescript
{
  accounts: {
    google?: { email, name, locale, picture },
    github?: { login, name, bio, repos[], starred[] },
    linkedin?: { name, headline, industry, skills[] },
    twitter?: { username, name, bio, following[] }
  }
}
```

**Output:**
```typescript
{
  name: string;
  languages: string[];
  preferredLanguage: string;
  style: {
    formality: "formal" | "casual" | "adaptive";
    verbosity: "concise" | "detailed" | "balanced";
    technical_level: "beginner" | "intermediate" | "advanced";
  };
  interests: string[];
  profession?: string;
  currentGoals: string[];
}
```

**Generation Logic:**
- **Name:** LinkedIn > Google > GitHub > Twitter
- **Profession:** LinkedIn headline or extracted from GitHub bio
- **Languages:** From Google locale
- **Technical Level:** Based on GitHub repo count (>20 = advanced)
- **Interests:** Top programming languages, GitHub starred topics, Twitter categories
- **Goals:** Generated from GitHub repos, LinkedIn skills

### 3. `persona.export`

Exports a persona in different formats for various use cases.

**Input:**
```typescript
{
  supabaseId?: string;    // Lookup by Supabase user ID
  personaId?: string;     // Or by persona ID
  format?: "json" | "yaml" | "llm_prompt"
}
```

**Output:**
- **json:** Full persona record with metadata
- **yaml:** Serialized YAML (placeholder - uses JSON for now)
- **llm_prompt:** Formatted prompt for LLM context injection

**LLM Prompt Example:**
```
You are assisting John Doe who prefers casual, balanced communication
at advanced level. Languages: en (preferred: en).
Current goals: Maintain and improve twin, Master full-stack development.
```

## Storage Adapters

### InMemoryAdapter (Default)

Simple in-memory storage for development and testing.

**Features:**
- User management with Supabase ID or email
- Persona versioning with history
- Field-level updates
- Rollback to previous versions
- No persistence (data lost on restart)

### Future Adapters

**ConvexAdapter** (Planned)
- Real-time sync with Convex backend
- Persistent storage with indexing
- Query optimization for large datasets

**SupabaseAdapter** (Planned)
- Direct integration with Supabase database
- RLS (Row Level Security) for multi-tenant isolation
- PostgreSQL JSONB for flexible schema

## Configuration

```typescript
{
  "db.adapter": "memory" | "convex" | "supabase",  // Default: "memory"
  "convex.url": string,                            // Optional: Convex deployment URL
  "supabase.url": string,                          // Optional: Supabase project URL
  "supabase.serviceKey": string                    // Optional: Supabase service role key
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (with Smithery)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

## Integration with Twin

The MCP server integrates with the Twin frontend flow:

1. **User connects accounts** (OAuth in `/onboarding/connect`)
2. **Frontend calls MCP tool** `persona.generate_from_accounts`
3. **Server generates persona** from account data
4. **User reviews/edits** in `/onboarding/review`
5. **Persona stored** via adapter (memory → Supabase)
6. **Exported as LLM prompt** for personalized AI interactions

## Production Deployment

### Smithery Platform

```bash
# Build the MCP server
pnpm build

# Deploy to Smithery
npx @smithery/cli deploy
```

The `.smithery/` directory contains the built server bundle.

### Environment Variables

Set these in your Smithery deployment:

```bash
# For Supabase adapter
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# For Convex adapter
CONVEX_URL=https://your-deployment.convex.cloud
```

## API Example

Using the MCP server from Claude Desktop or other MCP clients:

```json
{
  "tool": "persona.generate_from_accounts",
  "arguments": {
    "accounts": {
      "github": {
        "login": "erniesg",
        "name": "Ernie",
        "bio": "Full-stack developer building AI tools",
        "repos": [
          { "name": "twin", "language": "TypeScript", "stars": 42 },
          { "name": "derivativ", "language": "JavaScript", "stars": 28 }
        ],
        "starred": [
          { "name": "next.js", "topics": ["react", "framework", "ssr"] }
        ]
      }
    }
  }
}
```

**Response:**
```json
{
  "name": "Ernie",
  "languages": ["en"],
  "preferredLanguage": "en",
  "style": {
    "formality": "casual",
    "verbosity": "balanced",
    "technical_level": "intermediate"
  },
  "interests": ["TypeScript", "JavaScript", "react", "framework", "ssr"],
  "profession": "Full-stack developer",
  "currentGoals": [
    "Maintain and improve twin",
    "Build and ship products faster"
  ]
}
```

## Testing

```bash
# Run unit tests
pnpm test

# Run specific test file
pnpm test schemas.test.ts
```

Test coverage includes:
- Schema validation
- Persona generation logic
- Adapter operations (CRUD, versioning, rollback)
- Export formatting

## Security Considerations

1. **Service Role Keys:** Never expose Supabase service keys in client-side code
2. **User Isolation:** Use Supabase ID for multi-tenant persona storage
3. **Data Validation:** All inputs validated with Zod schemas
4. **RLS Policies:** Enable Row Level Security in Supabase adapter

## Quick Test

```bash
# Run the test script
./test-persona.sh

# Or manually:
pnpm dev
# In another terminal:
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"tool":"persona.generate_mock","arguments":{"template":"developer"}}'
```

## For Consumers: Using Personas in Your App

### Quick Integration

```typescript
// 1. Generate test persona (no OAuth needed!)
const persona = await mcp.callTool("persona.generate_mock", {
  template: "developer",
  customInstructions: "senior developer from Singapore"
});

// 2. Export as LLM prompt
const prompt = await mcp.callTool("persona.export", {
  personaId: persona.id,
  format: "llm_prompt"
});

// 3. Use in your LLM call
const response = await openai.chat.completions.create({
  messages: [
    { role: "system", content: prompt.content },
    { role: "user", content: "Help me design an API" }
  ]
});
```

### Common Patterns

**Pattern 1: Persona-Based Routing**
```typescript
const persona = await getPersona(userId);

// Route based on technical level
const llm = persona.style.technical_level === "advanced"
  ? "claude-3-opus"   // Complex reasoning
  : "claude-3-haiku"; // Simpler, faster

// Adjust response length
const maxTokens = persona.style.verbosity === "concise" ? 500 : 2000;
```

**Pattern 2: Multi-Persona Testing**
```typescript
const personas = await Promise.all([
  mcp.callTool("persona.generate_mock", { template: "developer" }),
  mcp.callTool("persona.generate_mock", { template: "designer" }),
  mcp.callTool("persona.generate_mock", { template: "manager" })
]);

for (const persona of personas) {
  await testYourApp(persona);
}
```

## Roadmap

- [ ] Implement ConvexAdapter for real-time sync
- [ ] Implement SupabaseAdapter with RLS
- [ ] Add memory integration (mem0) for context retrieval
- [ ] Add persona diff/merge tools
- [ ] Support incremental updates from account refreshes
- [ ] Add analytics for persona usage patterns
- [ ] Export to additional formats (PDF, Markdown)

## License

MIT
