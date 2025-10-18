# Twin MCP Persona Server

**🚀 LIVE:** https://twin-mcp-persona.erniesg.workers.dev/mcp

Generate AI personas for your app - **no setup required!**

---

## ⚡ Quick Start (< 30 seconds)

### Try it right now:

```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "persona.generate_mock",
    "arguments": {"template": "developer"}
  },
  "id": 1
}
EOF
```

### From TypeScript/JavaScript:

```typescript
import { mcpClient } from '@/lib/mcp/client';

// ✅ Works immediately - no configuration needed!
const persona = await mcpClient.generateMockPersona({
  template: 'developer',
  customInstructions: 'senior developer from Singapore'
});

console.log(persona.name);         // "Alex Chen"
console.log(persona.languages);    // ["en", "zh", "ms"]
```

**Available templates:** `developer`, `designer`, `manager`, `student`, `random`

---

## 📊 Status

| Component | Status | Details |
|-----------|--------|---------|
| **Live URL** | ✅ https://twin-mcp-persona.erniesg.workers.dev/mcp | Production |
| **Health** | ✅ /health | Status check |
| **Mock Personas** | ✅ 5 templates | No OAuth needed |
| **Real Personas** | ✅ OAuth integration | YouTube subscriptions → interests & goals |
| **LLM Generation** | ✅ Google Gemini | Gemini 2.0 Flash Experimental |
| **Fallback Mode** | ✅ Rule-based | When no API key set |
| **Rate Limiting** | ✅ 50 lifetime calls/IP | Admin bypass available |
| **All 8 Tools** | ✅ CRUD + Export | See [TOOLS.md](./TOOLS.md) |
| **MCP Protocol** | ✅ Full support | initialize, tools, prompts, resources |

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **[TOOLS.md](./TOOLS.md)** | Complete API reference for all 8 tools |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design, LLM integration, costs |
| **README.md** | This file - quick start & essentials |

---

## 🎯 Common Use Cases

### 1. Generate Mock Persona (Development)

```typescript
const persona = await mcpClient.generateMockPersona({
  template: 'developer'
});
```

### 2. Generate from Connected Accounts (Production)

```typescript
const persona = await mcpClient.generateFromAccounts({
  google: { name: "John Doe", email: "john@example.com" },
  github: { login: "johndoe", repos: [...] }
});
```

### 3. Export as LLM Prompt

```typescript
const prompt = await mcpClient.exportPersona({
  personaId: persona.id,
  format: 'llm_prompt'
});
// "You are assisting Alex Chen who prefers casual, concise communication..."
```

### 4. Save & Retrieve

```typescript
// Save
const { id } = await mcpClient.savePersona(userId, persona);

// Retrieve
const saved = await mcpClient.getPersona(userId);
```

---

## 🚀 Deployment

### Prerequisites

1. **Cloudflare account** with Workers enabled
2. **Gemini API key** (get free at https://aistudio.google.com/apikey)
3. **Node.js 18+** and `wrangler` CLI

### Local Development Setup

```bash
cd workers/mcp-persona

# 1. Copy environment template
cp .env.example .env.local

# 2. Add your Gemini API key to .env.local
# GEMINI_API_KEY=your-actual-key-here

# 3. Start dev server
wrangler dev

# 4. Test in another terminal
curl http://localhost:8787/health
```

**Note:** `.env.local` is gitignored and never committed!

### Production Deploy

```bash
# 1. Create KV namespace for rate limiting
wrangler kv namespace create "RATE_LIMIT"
# Copy the ID to wrangler.toml [[kv_namespaces]] section

# 2. Set production secrets
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted

wrangler secret put ADMIN_API_KEYS
# Paste comma-separated admin keys (for unlimited access)

# 3. Deploy
wrangler deploy
```

### Configuration Files

**wrangler.toml:**
```toml
name = "twin-mcp-persona"
main = "cloudflare-worker.js"

[vars]
DB_ADAPTER = "memory"       # or "supabase" (future)
LIFETIME_LIMIT = "50"       # Total calls per IP (not per hour)

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"
```

**.env.local** (for local dev only):
```bash
GEMINI_API_KEY=your-gemini-api-key-here
DB_ADAPTER=memory
```

### Environment Variables

| Variable | Where Set | Purpose |
|----------|-----------|---------|
| `GEMINI_API_KEY` | `.env.local` (dev) / Cloudflare Secret (prod) | **REQUIRED** for LLM generation |
| `ADMIN_API_KEYS` | Cloudflare Secret | Comma-separated keys for unlimited access |
| `DB_ADAPTER` | `wrangler.toml` [vars] | Storage backend: `memory` or `supabase` |
| `LIFETIME_LIMIT` | `wrangler.toml` [vars] | Total calls per IP (default: 50) |

---

## 🛡️ Rate Limiting

**Current:** 100 requests/hour per IP address

### Check Remaining Calls

Rate limit info in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: <timestamp>
```

### When Rate Limited

HTTP 429 response:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": 429,
    "message": "Rate limit exceeded. Try again in 1 hour."
  }
}
```

### Admin Bypass (Unlimited Calls)

Set admin API keys:
```bash
wrangler secret put ADMIN_API_KEYS
# Enter: your-secret-key-1,your-secret-key-2
```

Use admin key:
```bash
curl -H 'X-API-Key: your-secret-key-1' ...
# No rate limits!
```

---

## 🔧 Development

### Local Testing

```bash
# Start dev server
wrangler dev

# Test health check
curl http://localhost:8787/health

# Generate mock persona
curl -X POST http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"persona.generate_mock","arguments":{"template":"developer"}},"id":1}'
```

### Run Tests

```bash
./test-deployment.sh
```

Expected output:
```
🧪 Testing Twin MCP Persona Server Deployment
✅ Health check passed
✅ Tools list passed (8 tools)
✅ Mock generation passed
✅ All tests passed!
```

---

## 🏗️ Architecture Overview

```
Cloudflare Worker (cloudflare-worker.js)
├── MCP Protocol Handler (JSON-RPC 2.0)
│   ├── initialize (declare capabilities)
│   ├── tools/list (8 tools)
│   ├── tools/call (execute tool)
│   ├── prompts/list (empty, for MCP clients)
│   ├── resources/list (empty, for MCP clients)
│   └── notifications/initialized (acknowledge init)
│
├── Persona Generation (src/generation.ts + src/llm.ts)
│   ├── 🤖 LLM Mode: Google Gemini 2.0 Flash Experimental
│   │   └── Analyzes YouTube subscriptions → personalized goals
│   └── 📋 Fallback Mode: Rule-based heuristics
│       └── When GEMINI_API_KEY not set
│
├── Rate Limiter (KV-based, per-IP)
│   ├── 50 calls lifetime (not per hour)
│   └── Admin bypass with API key
│
└── Storage Adapter (src/adapter.ts)
    ├── ✅ In-memory (current, stateless)
    └── ⏳ Supabase (future, persistent + versioned)
```

### Generation Modes

**🤖 LLM-Powered (Primary):**
- Uses Google Gemini 2.0 Flash Experimental
- Input: YouTube subscriptions + playlists + focus areas
- Output: Personalized goals, interests, communication style
- Cost: ~$0.001 per persona
- **Active when:** `GEMINI_API_KEY` is set

**📋 Rule-Based Fallback:**
- Simple heuristics (channel name → interests)
- Used when API key is missing or LLM fails
- Free, instant, predictable
- **Active when:** No API key or LLM error

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical details.

---

## 🎨 Available Tools (8 total)

| Tool | Purpose | Status |
|------|---------|--------|
| `persona.generate_mock` | Test personas (no OAuth) | ✅ Live |
| `persona.generate_from_accounts` | Real personas from OAuth | ✅ Live |
| `persona.save` | Create/update persona | ✅ Live |
| `persona.get` | Retrieve by ID | ✅ Live |
| `persona.update_field` | Partial updates | ✅ Live |
| `persona.get_history` | Version history | ✅ Live |
| `persona.rollback` | Undo changes | ✅ Live |
| `persona.export` | JSON/YAML/LLM prompts | ✅ Live |

**Full API reference:** [TOOLS.md](./TOOLS.md)

---

## 🔐 Security

- ✅ API keys stored in Cloudflare secrets (never in git)
- ✅ Rate limiting active (prevents abuse)
- ✅ CORS enabled (configurable origins)
- ✅ Input validation (Zod schemas)
- ⏳ Supabase RLS (future, for multi-tenant storage)

---

## 🐛 Troubleshooting

### "Rate limit exceeded"
- Wait 1 hour or use admin API key
- Check `X-RateLimit-Remaining` header

### "Persona not found"
- In-memory storage doesn't persist between requests
- Use mock generation for immediate testing
- Persistent storage coming with Supabase adapter

### CORS errors
- CORS is enabled for all origins (`*`)
- Check browser console for specific errors

---

## 🚦 Roadmap

### ✅ Completed
- [x] Mock persona generation (5 templates)
- [x] OAuth-based generation (YouTube integration)
- [x] **LLM-powered enrichment (Gemini 2.0 Flash)**
- [x] Rule-based fallback (no API key needed)
- [x] Full CRUD operations (8 tools)
- [x] Rate limiting (IP-based, lifetime limit)
- [x] Admin bypass (unlimited calls)
- [x] MCP protocol support (tools, prompts, resources)
- [x] Smithery.ai registry integration

### 🚧 In Progress
- [ ] Persistent storage (Supabase adapter)
- [ ] User-based rate limits (vs IP-based)
- [ ] Version history persistence
- [ ] Usage analytics dashboard

### 📋 Planned
- [ ] Multi-provider LLM support (Claude, GPT-4)
- [ ] LinkedIn/GitHub data integration
- [ ] Persona A/B testing
- [ ] Custom persona templates
- [ ] Team/organization personas

---

## 📞 Support

- **Issues:** Create an issue in the repo
- **Questions:** Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- **API Reference:** See [TOOLS.md](./TOOLS.md)

**Version:** 974e40b9-2ad2-41dc-bed3-68c2a826d942
**Deployed:** Cloudflare Workers
**Health:** https://twin-mcp-persona.erniesg.workers.dev/health
