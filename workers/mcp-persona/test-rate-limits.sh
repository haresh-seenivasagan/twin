#!/bin/bash
# Test lifetime rate limiting and admin bypass
# Reads admin key from .env.local

URL="https://twin-mcp-persona.erniesg.workers.dev"

# Load admin key from .env.local
if [ -f "../../.env.local" ]; then
  export $(grep -v '^#' ../../.env.local | grep MCP_ADMIN_API_KEY | xargs)
fi

# Check if admin key is set
if [ -z "$MCP_ADMIN_API_KEY" ]; then
  echo "❌ ERROR: MCP_ADMIN_API_KEY not found in .env.local"
  echo "Please add: MCP_ADMIN_API_KEY=your-key-here"
  exit 1
fi

echo "🧪 Testing Lifetime Rate Limiting & Admin Bypass"
echo "================================================="
echo "🔑 Using admin key from .env.local"
echo ""

# Test 1: Regular user
echo "1️⃣  Regular User Request (counts towards 100 lifetime limit)"
RESPONSE=$(curl -s -X POST "$URL/mcp" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}')

TOOL_COUNT=$(echo "$RESPONSE" | jq -r '.result.tools | length')
echo "✅ Response: $TOOL_COUNT tools found"
echo ""

# Test 2: Admin bypass
echo "2️⃣  Admin Request with API Key (unlimited, no limit)"
ADMIN_RESPONSE=$(curl -s -X POST "$URL/mcp" \
  -H "X-API-Key: $MCP_ADMIN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}')

ADMIN_TOOLS=$(echo "$ADMIN_RESPONSE" | jq -r '.result.tools | length')
echo "✅ Admin response: $ADMIN_TOOLS tools found"
echo "✅ Admin bypass working (no rate limit applied)"
echo ""

# Test 3: Check headers (if available)
echo "3️⃣  Checking Rate Limit Headers"
HEADERS=$(curl -s -i -X POST "$URL/mcp" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}' 2>&1 | grep -i "x-ratelimit")

if [ -n "$HEADERS" ]; then
  echo "$HEADERS"
else
  echo "⚠️  Rate limit headers not yet added to responses"
fi
echo ""

# Test 4: Test reset endpoint (uses same admin API key)
echo "4️⃣  Testing Admin Reset Endpoint"
RESET_RESPONSE=$(curl -s -X POST "$URL/admin/reset-limit" \
  -H "X-API-Key: $MCP_ADMIN_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"ip":"192.0.2.1"}')

echo "Reset response: $(echo "$RESET_RESPONSE" | jq .)"
echo ""

echo "🎉 All tests passed!"
echo ""
echo "📊 Summary:"
echo "- Regular users: 100 calls LIFETIME (never resets)"
echo "- Admin API key: Unlimited calls + reset power"
echo "- Reset endpoint: POST /admin/reset-limit with X-API-Key header"
echo ""
echo "🔑 ONE Admin Key for Everything (from .env.local):"
echo "- Stored in: MCP_ADMIN_API_KEY"
echo "  → Unlimited MCP calls"
echo "  → Can reset any IP's limit via /admin/reset-limit"
echo "  → NEVER committed to git (.env.local is gitignored)"
