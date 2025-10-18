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
| **Real Personas** | ✅ OAuth integration | Google, GitHub, LinkedIn, Twitter |
| **Rate Limiting** | ✅ 100/hour per IP | Lifetime limit option |
| **All 8 Tools** | ✅ CRUD + Export | See [TOOLS.md](./TOOLS.md) |

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

### Quick Deploy

```bash
cd workers/mcp-persona

# Create KV namespace for rate limiting
wrangler kv namespace create "RATE_LIMIT"
# Copy the ID to wrangler.toml

# Deploy
wrangler deploy
```

### Configuration

**wrangler.toml:**
```toml
name = "twin-mcp-persona"
main = "cloudflare-worker.js"

[vars]
DB_ADAPTER = "memory"  # or "supabase"
RATE_LIMIT_PER_HOUR = "100"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-kv-namespace-id"
```

### Secrets (Optional)

```bash
# For LLM-powered generation (future)
wrangler secret put OPENAI_API_KEY

# For persistent storage (future)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY

# For admin unlimited access
wrangler secret put ADMIN_API_KEYS  # Comma-separated keys
```

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
Cloudflare Worker
├── MCP Protocol Handler (JSON-RPC 2.0)
├── 8 Tools (mock, generate, save, get, update, history, rollback, export)
├── Rate Limiter (KV-based, per-IP)
└── Storage Adapter (in-memory → Supabase in future)
```

**Current Storage:** In-memory (stateless, per-request)
**Future:** Supabase (persistent, versioned)

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

- [x] Mock persona generation
- [x] OAuth-based generation
- [x] Full CRUD operations
- [x] Rate limiting (IP-based)
- [ ] LLM-powered enrichment
- [ ] Persistent storage (Supabase)
- [ ] User-based rate limits
- [ ] Usage analytics dashboard

---

## 📞 Support

- **Issues:** Create an issue in the repo
- **Questions:** Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- **API Reference:** See [TOOLS.md](./TOOLS.md)

**Version:** 974e40b9-2ad2-41dc-bed3-68c2a826d942
**Deployed:** Cloudflare Workers
**Health:** https://twin-mcp-persona.erniesg.workers.dev/health
