# Twin MCP Persona Server - Usage Guide

## 🚀 Quick Start

### Get a Mock Persona (curl)

```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "persona.generate_mock",
    "arguments": {
      "template": "developer"
    }
  },
  "id": 1
}
EOF
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"name\":\"Alex Chen\",\"languages\":[\"en\",\"zh\"],\"profession\":\"Senior Full-Stack Developer\",..."
    }]
  }
}
```

### From JavaScript/TypeScript

```typescript
import { mcpClient } from '@/lib/mcp/client';

const persona = await mcpClient.generateMockPersona({
  template: 'developer',
  customInstructions: 'senior developer from Singapore'
});

console.log(persona);
// {
//   name: "Alex Chen",
//   languages: ["en", "zh", "ms"],
//   profession: "Senior Full-Stack Developer",
//   currentGoals: ["Build scalable microservices", "Learn Rust"],
//   ...
// }
```

---

## 📊 Current Rate Limiting

**Status:** 100 requests/hour per IP

### How Users See Remaining Calls

Rate limit info is in response headers:
```bash
curl -i https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Headers show:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705420800
```

**Note:** Currently these headers are prepared in the code but not added to responses. Need to update all response objects.

### When Rate Limited

HTTP 429 response:
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": 429,
    "message": "Rate limit exceeded. Max 100 requests per hour. Try again later."
  },
  "id": null
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
```

---

## 🔐 Admin/User-Specific Rate Limits

### Option 1: Unlimited API Key (Recommended)

Add trusted API key bypass:

```javascript
// cloudflare-worker.js - Add before rate limiting check

if (url.pathname === '/mcp' && request.headers.get('X-API-Key')) {
  const apiKey = request.headers.get('X-API-Key');
  const adminKeys = env.ADMIN_API_KEYS?.split(',') || [];

  if (adminKeys.includes(apiKey)) {
    // Skip rate limiting for admin keys
    ctx.isAdmin = true;
  }
}

// Later in rate limit check:
if (ctx.isAdmin) {
  // Skip rate limiting
  return; // Continue to endpoint
}
```

**Set admin keys via wrangler:**
```bash
wrangler secret put ADMIN_API_KEYS
# Enter: key1,key2,key3
```

**Usage:**
```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'X-API-Key: your-admin-key' \
  -H 'Content-Type: application/json' \
  -d '...'
```

---

### Option 2: Whitelist IPs

```javascript
// cloudflare-worker.js
const WHITELISTED_IPS = env.WHITELISTED_IPS?.split(',') || [];
const ip = request.headers.get('CF-Connecting-IP');

if (WHITELISTED_IPS.includes(ip)) {
  // Skip rate limiting
  return;
}
```

**Set via wrangler:**
```bash
wrangler secret put WHITELISTED_IPS
# Enter: 1.2.3.4,5.6.7.8
```

---

### Option 3: Supabase User-Based Limits

For authenticated users with different tiers:

```javascript
// Require Authorization header with Supabase JWT
const jwt = request.headers.get('Authorization')?.replace('Bearer ', '');

if (jwt) {
  const user = await verifySupabaseJWT(jwt, env.SUPABASE_JWT_SECRET);

  if (user) {
    // Check user tier from Supabase
    const { data } = await supabase
      .from('profiles')
      .select('rate_limit_tier')
      .eq('id', user.sub)
      .single();

    const limits = {
      free: 10,
      pro: 100,
      admin: Infinity
    };

    const limit = limits[data.rate_limit_tier] || limits.free;
    // Use user-specific limit
  }
}
```

---

## 🚫 Lifetime Limit (100 calls total, not per hour)

To restrict each IP to 100 calls **ever**:

### Change KV TTL to null (never expires)

```javascript
// In cloudflare-worker.js rate limiting section

// BEFORE (resets every hour):
await env.RATE_LIMIT.put(rateLimitKey, (count + 1).toString(), {
  expirationTtl: 3600 // ❌ Remove this!
});

// AFTER (lifetime limit):
await env.RATE_LIMIT.put(rateLimitKey, (count + 1).toString());
// No TTL = never expires

// Updated check:
const LIFETIME_LIMIT = parseInt(env.LIFETIME_LIMIT || '100');

if (count >= LIFETIME_LIMIT) {
  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    error: {
      code: 429,
      message: `Lifetime limit reached. You have used all ${LIFETIME_LIMIT} requests.`
    },
    id: null
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': LIFETIME_LIMIT.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Lifetime': 'true',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
```

### Admin Reset Function

Add a reset endpoint for admins:

```javascript
// POST /admin/reset-limit
if (url.pathname === '/admin/reset-limit' && request.method === 'POST') {
  const adminKey = request.headers.get('X-Admin-Key');

  if (adminKey !== env.ADMIN_RESET_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const ipToReset = body.ip;

  await env.RATE_LIMIT.delete(`rate:${ipToReset}`);

  return new Response(JSON.stringify({
    success: true,
    message: `Reset limit for IP: ${ipToReset}`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Set reset key:**
```bash
wrangler secret put ADMIN_RESET_KEY
# Enter: your-secret-reset-key
```

**Reset an IP:**
```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/admin/reset-limit \
  -H 'X-Admin-Key: your-secret-reset-key' \
  -H 'Content-Type: application/json' \
  -d '{"ip":"1.2.3.4"}'
```

---

## 📝 Complete Implementation Plan

### 1. Update Rate Limiting to Lifetime (5 min)

```bash
cd workers/mcp-persona
```

Edit `cloudflare-worker.js` line 67:
```javascript
// BEFORE:
await env.RATE_LIMIT.put(rateLimitKey, (count + 1).toString(), { expirationTtl: ttl });

// AFTER:
await env.RATE_LIMIT.put(rateLimitKey, (count + 1).toString()); // No TTL
```

Update line 39:
```javascript
const LIFETIME_LIMIT = parseInt(env.LIFETIME_LIMIT || '100');
```

Update error message line 50:
```javascript
message: `Lifetime limit reached. You have used all ${LIFETIME_LIMIT} requests. Contact admin to reset.`
```

### 2. Add Admin Bypass (10 min)

Before rate limiting (after line 35), add:

```javascript
// Admin bypass via API key
const apiKey = request.headers.get('X-API-Key');
const adminKeys = (env.ADMIN_API_KEYS || '').split(',').filter(Boolean);

if (apiKey && adminKeys.includes(apiKey)) {
  // Skip rate limiting
  ctx.isAdmin = true;
}

// Rate limiting (only if not admin)
if (url.pathname === '/mcp' && env.RATE_LIMIT && !ctx.isAdmin) {
  // ... existing rate limit code
}
```

### 3. Add Reset Endpoint (10 min)

After health check (after line 33), add:

```javascript
// Admin reset endpoint
if (url.pathname === '/admin/reset-limit' && request.method === 'POST') {
  const adminKey = request.headers.get('X-Admin-Key');

  if (adminKey !== env.ADMIN_RESET_KEY) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const ipToReset = body.ip;

    if (!ipToReset) {
      return new Response(JSON.stringify({ error: 'IP address required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.RATE_LIMIT.delete(`rate:${ipToReset}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Reset limit for IP: ${ipToReset}`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 4. Set Secrets (2 min)

```bash
# Lifetime limit
wrangler secret put LIFETIME_LIMIT
# Enter: 100

# Admin API keys (comma-separated, no spaces)
wrangler secret put ADMIN_API_KEYS
# Enter: dev-key-123,admin-key-456

# Reset key
wrangler secret put ADMIN_RESET_KEY
# Enter: reset-secret-789
```

### 5. Deploy (1 min)

```bash
wrangler deploy
```

---

## 🧪 Testing

### Test Lifetime Limit

```bash
# Make 101 requests (script)
for i in {1..101}; do
  curl -s https://twin-mcp-persona.erniesg.workers.dev/mcp \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' \
    | jq -r '.error.message // "OK"'
done
# Should show "Lifetime limit reached" after 100
```

### Test Admin Bypass

```bash
curl https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'X-API-Key: dev-key-123' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
# Should work even after 100 calls
```

### Test Reset

```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/admin/reset-limit \
  -H 'X-Admin-Key: reset-secret-789' \
  -H 'Content-Type: application/json' \
  -d '{"ip":"1.2.3.4"}'
# Response: {"success":true,"message":"Reset limit for IP: 1.2.3.4"}
```

---

## 📊 Summary

| Feature | Status | Implementation Time |
|---------|--------|---------------------|
| **Mock personas via curl** | ✅ LIVE | Working now! |
| **Rate limit headers** | ⏳ TODO | 5 min (add to responses) |
| **100 calls LIFETIME** | ⏳ TODO | 5 min (remove TTL) |
| **Admin API keys** | ⏳ TODO | 10 min |
| **IP reset endpoint** | ⏳ TODO | 10 min |

**Total implementation time: ~30 minutes**

---

## 🎯 Next Steps

1. Decide on final rate limit strategy:
   - Lifetime limit (100 total)?
   - Per-hour limit (100/hour, renews)?
   - Hybrid (10/hour, 100 lifetime)?

2. Set up admin keys for unlimited access

3. Deploy and test

4. Update documentation with new limits

5. Add dashboard to view all IP usage (optional)
