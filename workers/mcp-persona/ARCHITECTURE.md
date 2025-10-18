# Twin MCP Server - Architecture & Implementation Plan

## Overview

The Twin MCP server is a Cloudflare Worker that provides AI-powered persona generation via the Model Context Protocol (MCP). It combines **rule-based extraction** from OAuth accounts with **LLM-powered enrichment** for better quality personas.

---

## 🎯 Architecture Decision

### Hybrid Approach: Rules + LLM

**Why not pure rule-based?**
- Hard to infer personality traits, communication style, goals from raw data
- Misses nuances (e.g., "senior engineer" vs "staff engineer" implications)
- Can't generate contextual goals based on recent activity patterns

**Why not pure LLM?**
- Expensive (every call costs money)
- Slower (adds latency)
- Less predictable (harder to test)

**Solution: Hybrid Pipeline**

```
OAuth Data → Rule-Based Extraction → LLM Enhancement → Structured Persona
    ↓              ↓                       ↓                  ↓
  Raw JSON    Basic facts          Smart enrichment      Type-safe output
```

---

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (Cloudflare Worker)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │   MCP        │    │   Persona    │    │   LLM         │ │
│  │   Protocol   │───▶│   Generator  │───▶│   Service     │ │
│  │   Handler    │    │              │    │   (GPT-4o)    │ │
│  └──────────────┘    └──────────────┘    └───────────────┘ │
│         │                   │                     │          │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐ │
│  │   Auth       │    │  Supabase    │    │   Rate        │ │
│  │   Middleware │    │  Adapter     │    │   Limiter     │ │
│  └──────────────┘    └──────────────┘    └───────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                       │                      │
         ▼                       ▼                      ▼
    API Keys               Supabase DB           Cloudflare KV
  (Workers Secrets)      (Personas storage)    (Rate limit cache)
```

---

## 📝 Implementation Details

### 1. Mock vs Actual Persona Generation

#### **Mock Generation (No LLM, Fast)**

```typescript
// For development, demos, testing
async function generateMockPersona(template: string): Promise<Persona> {
  // Use predefined templates - instant response
  const templates = {
    developer: {
      name: "Alex Chen",
      profession: "Senior Software Engineer",
      interests: ["TypeScript", "React", "AI"],
      currentGoals: ["Build production-ready apps", "Master system design"],
      style: { formality: "casual", verbosity: "concise", technical_level: "advanced" }
    },
    designer: { /* ... */ },
    manager: { /* ... */ }
  };

  return templates[template] || randomize(templates);
}
```

**Use cases:**
- Frontend development without backend
- Unit tests
- Demos without API costs

---

#### **Actual Generation (LLM-Enhanced, Smart)**

```typescript
// For production, real users
async function generatePersonaFromAccounts(
  accounts: ConnectedAccounts,
  env: Env // Cloudflare Worker env with secrets
): Promise<Persona> {

  // Step 1: Rule-based extraction (fast, deterministic)
  const basicFacts = extractBasicFacts(accounts);
  // → { name: "Alex Chen", languages: ["TypeScript", "Python"], ... }

  // Step 2: LLM enhancement (smart, contextual)
  const prompt = buildEnrichmentPrompt(basicFacts, accounts);
  const enrichedData = await callLLM(prompt, env.OPENAI_API_KEY);

  // Step 3: Merge and validate
  return mergeAndValidate(basicFacts, enrichedData);
}
```

**LLM Prompt Example:**

```typescript
function buildEnrichmentPrompt(facts: any, accounts: any) {
  return `
You are analyzing a professional's online presence to build their AI persona.

EXTRACTED DATA:
- Name: ${facts.name}
- Profession: ${facts.profession}
- Top Languages: ${facts.languages.join(", ")}
- Recent Repos: ${accounts.github?.repos.map(r => r.name).join(", ")}
- GitHub Stars: ${accounts.github?.starred.map(r => r.name).slice(0, 5).join(", ")}

TASK: Infer the following:

1. **Current Goals** (3-5 specific, actionable goals based on recent activity)
2. **Communication Style**:
   - formality: formal | casual | adaptive
   - verbosity: concise | detailed | balanced
   - technical_level: beginner | intermediate | advanced
3. **Personality Traits** (3-5 adjectives)
4. **Working Preferences** (remote-first, collaboration style, etc.)

Return as JSON with this exact schema:
{
  "currentGoals": string[],
  "style": { "formality": string, "verbosity": string, "technical_level": string },
  "traits": string[],
  "workingPreferences": { [key: string]: string }
}
`;
}
```

**LLM Service with Structured Outputs:**

```typescript
async function callLLM(prompt: string, apiKey: string): Promise<EnrichedData> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Fast + cheap ($0.15/1M tokens)
      messages: [
        { role: 'system', content: 'You are a persona generation expert.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }, // ✅ Structured output!
      temperature: 0.7,
      max_tokens: 500
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

**Why gpt-4o-mini?**
- **Fast**: ~500ms response time
- **Cheap**: $0.15 per 1M input tokens (vs GPT-4 Turbo $10/1M)
- **Good enough**: Structured outputs work perfectly
- **Cost per persona**: ~$0.0001 (10,000 personas = $1)

---

### 2. API Key Management (Cloudflare Workers)

#### **Storage: Wrangler Secrets** ✅ Secure, not in code

```bash
# Set secrets (encrypted, never in git)
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put MCP_AUTH_TOKEN  # Optional: for gating access
```

#### **Access in Worker Code**

```typescript
// src/index.ts
export interface Env {
  // Secrets (auto-injected by Cloudflare)
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  MCP_AUTH_TOKEN?: string; // Optional for authentication

  // KV namespaces (for rate limiting)
  RATE_LIMIT: KVNamespace;
  PERSONA_CACHE: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // ✅ Secrets available as env.OPENAI_API_KEY
    const llmService = new LLMService(env.OPENAI_API_KEY);
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

    // Handle MCP requests...
  }
};
```

#### **wrangler.toml Configuration**

```toml
name = "twin-mcp-persona"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV namespaces for rate limiting
kv_namespaces = [
  { binding = "RATE_LIMIT", id = "your-kv-id", preview_id = "preview-kv-id" },
  { binding = "PERSONA_CACHE", id = "cache-kv-id", preview_id = "preview-cache-kv-id" }
]

# Secrets NOT defined here (use wrangler secret put)
# They're injected at runtime

# Production environment
[env.production]
route = "https://twin-mcp-persona.erniesg.workers.dev/*"
```

**Security Benefits:**
- ✅ Never in git
- ✅ Encrypted at rest
- ✅ Only accessible at runtime
- ✅ Can rotate without redeploying

---

### 3. Rate Limiting & Gating Strategy

#### **Phase 1: Public with Basic Rate Limits** (MVP)

```typescript
// Simple IP-based rate limiting
async function checkRateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; remaining: number }> {

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate:${ip}`;

  // Check current count
  const current = await env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current) : 0;

  const LIMIT = 100; // 100 requests per hour
  const TTL = 3600; // 1 hour

  if (count >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  // Increment counter
  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: TTL });

  return { allowed: true, remaining: LIMIT - count - 1 };
}

// Middleware
if (!rateLimit.allowed) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    error: {
      code: 429,
      message: 'Rate limit exceeded. Try again in 1 hour.'
    },
    id: null
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': '3600'
    }
  });
}
```

**Limits:**
- 100 requests/hour per IP
- No authentication required
- Good for public demo/testing

---

#### **Phase 2: Token-Based Authentication** (Production)

```typescript
// Optional auth header
async function checkAuth(request: Request, env: Env): Promise<boolean> {
  // Public endpoints (no auth needed)
  const url = new URL(request.url);
  if (url.pathname.includes('/health')) return true;

  // Check for auth token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false; // Or allow with lower rate limit

  const token = authHeader.replace('Bearer ', '');

  // Validate against secret
  if (env.MCP_AUTH_TOKEN && token === env.MCP_AUTH_TOKEN) {
    return true; // Trusted client (your frontend)
  }

  // Could also validate Supabase JWT here
  const isValidUser = await validateSupabaseJWT(token, env);
  return isValidUser;
}
```

**Authentication Tiers:**

| Tier | Auth | Rate Limit | Use Case |
|------|------|------------|----------|
| **Public** | None | 10/hour | Public demos, testing |
| **Authenticated** | Supabase JWT | 100/hour | Logged-in users |
| **Trusted** | API key | 1000/hour | Your own frontend |

---

#### **Phase 3: Advanced Gating** (Future)

```typescript
// User-specific limits stored in Supabase
async function getUserTier(userId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const limits = {
    free: 10,
    pro: 100,
    enterprise: 1000
  };

  return limits[data.subscription_tier] || limits.free;
}
```

**Future Features:**
- Per-user quotas (Supabase profiles table)
- Subscription tiers (free/pro/enterprise)
- Usage analytics (track costs per user)
- Custom rate limits per tier

---

## 📊 Cost Analysis

### Per-Persona Cost Breakdown

```
Rule-based extraction:  FREE (runs in worker)
LLM enhancement:        $0.0001 (gpt-4o-mini, ~300 tokens)
Storage (Supabase):     FREE (included in tier)
Worker execution:       FREE (first 100k requests/day)
KV reads/writes:        FREE (first 100k/day)

TOTAL: ~$0.0001 per persona (~10,000 personas = $1)
```

### Monthly Costs (Estimated)

| Users | Personas/month | LLM Cost | Workers Cost | Total |
|-------|---------------|----------|--------------|-------|
| 100 | 100 | $0.01 | $0 | **$0.01** |
| 1,000 | 1,000 | $0.10 | $0 | **$0.10** |
| 10,000 | 10,000 | $1.00 | $0 | **$1.00** |
| 100,000 | 100,000 | $10.00 | $5 | **$15.00** |

**Extremely cheap!** Even at 100k users, costs are minimal.

---

## 🚀 Implementation Roadmap

### Phase 1: Basic MCP Server (2-3 hours)
- [x] Design architecture
- [ ] Create Cloudflare Worker project
- [ ] Implement MCP protocol handler
- [ ] Add mock persona generation (no LLM)
- [ ] Deploy to workers.dev
- [ ] Test with curl/MCP client

### Phase 2: LLM Integration (2 hours)
- [ ] Add OpenAI API integration
- [ ] Implement structured output parsing
- [ ] Build enrichment prompt
- [ ] Add rule-based + LLM hybrid pipeline
- [ ] Test persona quality

### Phase 3: Storage & Auth (2 hours)
- [ ] Implement Supabase adapter
- [ ] Add persona CRUD operations
- [ ] Add version history
- [ ] Implement JWT validation

### Phase 4: Production Hardening (1 hour)
- [ ] Add rate limiting (IP-based)
- [ ] Add error handling
- [ ] Add logging/monitoring
- [ ] Add health check endpoint
- [ ] Deploy to production domain

### Phase 5: Advanced Features (Future)
- [ ] Multi-LLM support (Claude, Gemini)
- [ ] Token-based authentication
- [ ] Usage analytics
- [ ] Subscription tiers
- [ ] Webhook notifications

---

## 📝 File Structure

```
twin/
├── workers/
│   └── mcp-persona/           # NEW: Cloudflare Worker
│       ├── src/
│       │   ├── index.ts       # Main worker entry
│       │   ├── mcp/
│       │   │   ├── handler.ts # MCP protocol implementation
│       │   │   └── tools.ts   # Tool definitions
│       │   ├── services/
│       │   │   ├── llm.ts     # LLM integration (OpenAI, etc.)
│       │   │   ├── persona.ts # Persona generation logic
│       │   │   └── storage.ts # Supabase adapter
│       │   ├── middleware/
│       │   │   ├── auth.ts    # Authentication
│       │   │   └── rateLimit.ts # Rate limiting
│       │   └── types.ts       # TypeScript types
│       ├── wrangler.toml      # Cloudflare config
│       ├── package.json
│       └── README.md
│
├── lib/
│   ├── mcp/
│   │   └── client.ts          # ✅ Already exists
│   └── persona-generator.ts   # ✅ Move to worker
│
└── ARCHITECTURE.md            # This file

```

---

## 🎯 Next Steps

### Immediate (Today):
1. **Create Cloudflare Worker project**
   ```bash
   cd twin
   mkdir -p workers/mcp-persona
   cd workers/mcp-persona
   npm create cloudflare@latest
   ```

2. **Set up secrets**
   ```bash
   wrangler secret put OPENAI_API_KEY
   # Paste key: sk-proj-...
   ```

3. **Implement basic MCP handler** (start with mock generation)

4. **Test locally**
   ```bash
   wrangler dev
   curl -X POST http://localhost:8787/mcp -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
   ```

### This Week:
- Add LLM integration for smart persona generation
- Deploy to production
- Connect frontend to real MCP server
- Test end-to-end flow

### Future:
- Add authentication and advanced rate limiting
- Multi-LLM support
- Usage analytics dashboard

---

## 🔐 Security Checklist

- [x] API keys stored in Wrangler secrets (not git)
- [x] Rate limiting implemented
- [ ] Input validation (prevent prompt injection)
- [ ] Output sanitization (prevent XSS)
- [ ] CORS headers configured
- [ ] Error messages don't leak sensitive data
- [ ] Supabase RLS policies enabled
- [ ] JWT validation for authenticated endpoints

---

## 📖 References

- [MCP Protocol Spec](https://modelcontextprotocol.io/specification)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Wrangler Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
