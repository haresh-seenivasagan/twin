# Twin MCP Persona Server - All Tools

**Server URL:** https://twin-mcp-persona.erniesg.workers.dev/mcp

## Available Tools (8 total)

### 🎨 Generation Tools

#### 1. `persona.generate_mock`
Generate test personas without OAuth - perfect for development!

**Use Case:** Testing, prototyping, demos

**Input:**
```typescript
{
  template?: "developer" | "designer" | "manager" | "student" | "random";
  customInstructions?: string; // Freeform text!
}
```

**Example:**
```json
{
  "template": "developer",
  "customInstructions": "senior developer from Singapore who loves Rust"
}
```

**Output:** Full persona object adapted to custom instructions

**Custom Instructions Support:**
- Geographic: "singapore", "sg" → adds regional languages
- Seniority: "senior", "lead" → advanced technical level
- Experience: "junior", "beginner" → beginner level
- Style: "formal", "verbose", "concise" → adjusts communication

---

#### 2. `persona.generate_from_accounts`
Generate real personas from OAuth-connected accounts.

**Use Case:** Production persona generation from user data

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

**Generation Logic:**
- **Name:** LinkedIn > Google > GitHub > Twitter
- **Profession:** LinkedIn headline or extracted from GitHub bio
- **Languages:** From Google locale
- **Technical Level:** Advanced if 20+ GitHub repos
- **Interests:** Top 5 programming languages + GitHub starred topics
- **Goals:** Generated from repo names, skills, activity

---

### 💾 Storage & Retrieval

#### 3. `persona.save`
Save or update a persona (creates new version automatically).

**Use Case:** Persist generated personas

**Input:**
```typescript
{
  supabaseId: string;         // User ID from Supabase auth
  persona: Persona;            // Persona object
  llmPreferences?: {           // Optional
    default?: string;          // Default: "claude"
    coding?: string;
    creative?: string;
    analysis?: string;
    chat?: string;
  }
}
```

**Output:**
```typescript
{
  id: string;           // Persona ID
  version: number;      // Version number (auto-incremented)
  lastModified: number; // Timestamp
}
```

---

#### 4. `persona.get`
Retrieve a persona by user ID or persona ID.

**Use Case:** Load user's persona

**Input:**
```typescript
{
  supabaseId?: string;  // Lookup by user ID
  personaId?: string;   // OR by persona ID
}
```

**Output:** Full persona record with metadata (id, version, lastModified, etc.)

---

### ✏️ Updates & Modifications

#### 5. `persona.update_field`
Update a specific field in the persona (creates new version).

**Use Case:** Partial updates without re-generating entire persona

**Input:**
```typescript
{
  supabaseId?: string;
  personaId?: string;
  fieldPath: string;    // Dot notation: "style.formality", "profession"
  value: any;           // New value
}
```

**Examples:**
- Update formality: `{ fieldPath: "style.formality", value: "formal" }`
- Change profession: `{ fieldPath: "profession", value: "CTO" }`
- Add language: `{ fieldPath: "languages", value: ["en", "zh", "ms"] }`

**Output:**
```typescript
{
  success: true;
  version: number;  // New version number
}
```

---

### 📜 Version Control

#### 6. `persona.get_history`
Get complete version history for a persona.

**Use Case:** View all changes over time

**Input:**
```typescript
{
  supabaseId: string;  // Required
}
```

**Output:** Array of PersonaRecord (newest first)
```typescript
[
  { id, version: 3, lastModified, ...persona },
  { id, version: 2, lastModified, ...persona },
  { id, version: 1, lastModified, ...persona }
]
```

---

#### 7. `persona.rollback`
Rollback persona to a previous version (creates new version).

**Use Case:** Undo unwanted changes

**Input:**
```typescript
{
  personaId: string;
  toVersion: number;  // Version number to rollback to
}
```

**Output:**
```typescript
{
  success: true;
  version: number;  // New version number (higher than current)
}
```

**Note:** Rollback creates a new version (doesn't delete history).

---

### 📤 Export

#### 8. `persona.export`
Export persona in different formats.

**Use Case:** Share personas, inject into LLM context

**Input:**
```typescript
{
  supabaseId?: string;
  personaId?: string;
  format?: "json" | "yaml" | "llm_prompt";  // Default: "json"
}
```

**Formats:**
- **json:** Full persona object
- **yaml:** YAML serialization (coming soon)
- **llm_prompt:** Ready-to-use system prompt

**LLM Prompt Example:**
```
You are assisting Alex Chen who prefers casual, concise communication
at advanced level. Languages: en, zh, ms (preferred: en).
Current goals: Build scalable microservices, Learn Rust.
```

---

## Complete Example Workflow

```typescript
// 1. Generate mock persona for testing
const mockPersona = await mcp.callTool('persona.generate_mock', {
  template: 'developer',
  customInstructions: 'senior engineer from Singapore'
});

// 2. Save it
const saved = await mcp.callTool('persona.save', {
  supabaseId: 'user-123',
  persona: mockPersona
});
// → { id: "persona_abc", version: 1, lastModified: 1234567890 }

// 3. Update a specific field
const updated = await mcp.callTool('persona.update_field', {
  supabaseId: 'user-123',
  fieldPath: 'profession',
  value: 'Principal Engineer'
});
// → { success: true, version: 2 }

// 4. View history
const history = await mcp.callTool('persona.get_history', {
  supabaseId: 'user-123'
});
// → [version 2, version 1]

// 5. Rollback if needed
const rollback = await mcp.callTool('persona.rollback', {
  personaId: saved.id,
  toVersion: 1
});
// → { success: true, version: 3 }  // Creates version 3 with version 1's data

// 6. Export as LLM prompt
const prompt = await mcp.callTool('persona.export', {
  supabaseId: 'user-123',
  format: 'llm_prompt'
});
// → "You are assisting..."
```

---

## Integration Patterns

### Pattern 1: Frontend Development (No OAuth)
```typescript
// Use mock personas for testing UI
import { mcpClient } from '@/lib/mcp/client';

const persona = await mcpClient.generateMockPersona({
  template: 'developer',
  customInstructions: userInput
});
```

### Pattern 2: Production with OAuth
```typescript
// After user connects accounts
const accounts = await getConnectedAccounts(userId);
const persona = await mcpClient.generateFromAccounts(accounts);
await mcpClient.savePersona(userId, persona);
```

### Pattern 3: LLM Context Injection
```typescript
// Get persona and export as prompt
const persona = await mcpClient.getPersona(userId);
const prompt = await mcpClient.exportPersona(persona.id, 'llm_prompt');

// Use in AI call
const response = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: prompt },
    { role: 'user', content: question }
  ]
});
```

---

## Storage Notes

**Current:** InMemoryAdapter (development)
- ✅ Fast and simple
- ❌ Data resets per request (Cloudflare Workers are stateless)
- ❌ Not suitable for production

**Production:** SupabaseAdapter (coming soon)
- ✅ Persistent storage
- ✅ Version history in database
- ✅ RLS for multi-tenant security
- ✅ Supabase real-time subscriptions

---

## Error Handling

All tools return standard JSON-RPC errors:

```typescript
{
  jsonrpc: '2.0',
  id: 1,
  error: {
    code: number,    // -32700: Parse error, -32601: Method not found, etc.
    message: string
  }
}
```

**Common Errors:**
- `-32602`: Invalid params (e.g., persona not found)
- `-32603`: Internal error (e.g., adapter failure)
- `-32601`: Method not found (tool name typo)

---

## Testing

```bash
# List all tools
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Generate mock persona
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.generate_mock",
      "arguments":{"template":"developer"}
    },
    "id":2
  }'
```

---

## Next Steps

1. ✅ 8 tools deployed and tested
2. ⏳ Implement SupabaseAdapter for persistence
3. ⏳ Integrate with Twin frontend
4. ⏳ Enable OAuth for real data
5. ⏳ Add mem0 integration for memories

---

**Live Server:** https://twin-mcp-persona.erniesg.workers.dev/mcp
**Health Check:** https://twin-mcp-persona.erniesg.workers.dev/health
**Repository:** workers/mcp-persona/
