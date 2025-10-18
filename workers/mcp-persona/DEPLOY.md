# Deployment Guide - Twin MCP Persona Server

## Prerequisites

- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Logged in to Cloudflare (`wrangler login`)

## Step 1: Create KV Namespace (One-time setup)

```bash
cd /Users/erniesg/code/erniesg/twin/workers/mcp-persona

# Create KV namespace for rate limiting
wrangler kv:namespace create "RATE_LIMIT"

# Output will look like:
# ✨ Success!
# Add the following to your wrangler.toml:
# { binding = "RATE_LIMIT", id = "abc123..." }

# Copy the ID and update wrangler.toml
```

Update `wrangler.toml` line 16 with the actual KV namespace ID.

## Step 2: Configure API Keys (Optional for LLM features)

These are optional now but will be needed when we add LLM-powered persona generation:

```bash
# OpenAI (for future LLM-enhanced persona generation)
wrangler secret put OPENAI_API_KEY
# Paste: sk-proj-...

# Anthropic (alternative LLM)
wrangler secret put ANTHROPIC_API_KEY
# Paste: sk-ant-...

# Supabase (for persistent storage - future)
wrangler secret put SUPABASE_URL
# Paste: https://xxx.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Paste: eyJ...
```

**Current Status:** Not required yet! The MCP server works with in-memory storage.

## Step 3: Deploy

```bash
cd /Users/erniesg/code/erniesg/twin/workers/mcp-persona

# Deploy to production
wrangler deploy

# Or deploy to a specific environment
wrangler deploy --env production
```

## Step 4: Verify Deployment

```bash
# Test health check
curl https://twin-mcp-persona.erniesg.workers.dev/health

# Test MCP server
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"initialize",
    "params":{
      "protocolVersion":"2024-11-05",
      "capabilities":{"tools":{}},
      "clientInfo":{"name":"test","version":"1.0.0"}
    },
    "id":1
  }'

# Expected: {"jsonrpc":"2.0","id":1,"result":{...}}
```

## Step 5: Test All 8 Tools

```bash
# Run test script
./test-persona.sh

# Or test individually:

# 1. Generate mock persona
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

# 2. Save persona
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.save",
      "arguments":{
        "supabaseId":"test-user-123",
        "persona":{
          "name":"Test User",
          "languages":["en"],
          "preferredLanguage":"en",
          "style":{"formality":"casual","verbosity":"concise","technical_level":"intermediate"},
          "interests":["AI","coding"],
          "currentGoals":["Learn MCP"]
        }
      }
    },
    "id":3
  }'

# 3. Get persona
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.get",
      "arguments":{"supabaseId":"test-user-123"}
    },
    "id":4
  }'

# 4. Update field
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.update_field",
      "arguments":{
        "supabaseId":"test-user-123",
        "fieldPath":"style.formality",
        "value":"formal"
      }
    },
    "id":5
  }'

# 5. Get history
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.get_history",
      "arguments":{"supabaseId":"test-user-123"}
    },
    "id":6
  }'

# 6. Export as LLM prompt
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"persona.export",
      "arguments":{
        "supabaseId":"test-user-123",
        "format":"llm_prompt"
      }
    },
    "id":7
  }'
```

## Step 6: Monitor Rate Limits

Rate limiting is enforced at **100 requests/hour per IP address**.

To check rate limit status, look for headers in responses:
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: X
- `Retry-After`: 3600 (when rate limited)

To adjust the limit, update `wrangler.toml`:
```toml
[vars]
RATE_LIMIT_PER_HOUR = "200"  # Increase to 200/hour
```

Then redeploy: `wrangler deploy`

## Current Deployment Status

✅ **Live at:** https://twin-mcp-persona.erniesg.workers.dev/mcp

✅ **Features Working:**
- 8/8 MCP tools implemented
- Rate limiting active (100/hour per IP)
- CORS enabled
- In-memory persona storage

⏳ **Future Enhancements:**
- LLM-powered persona generation (needs OPENAI_API_KEY)
- Persistent storage via Supabase (needs SUPABASE_URL + KEY)
- Advanced authentication (Supabase JWT validation)
- Usage analytics

## Troubleshooting

### "Rate limit exceeded"
- Wait 1 hour, or
- Increase `RATE_LIMIT_PER_HOUR` in wrangler.toml

### "KV namespace not found"
- Run step 1 to create KV namespace
- Update wrangler.toml with correct ID

### "Persona not found"
- In-memory storage is stateless (per request)
- Data doesn't persist between requests
- Solution: Implement Supabase adapter (future)

### Deployment fails
```bash
# Check wrangler config
wrangler whoami

# Re-login
wrangler logout
wrangler login

# Try deploy with verbose logging
wrangler deploy --verbose
```

## Next Steps

1. **Implement Supabase Adapter** - For persistent storage
2. **Add LLM Integration** - For smart persona generation
3. **Enable OAuth** - Connect real social accounts
4. **Add Analytics** - Track usage and costs
