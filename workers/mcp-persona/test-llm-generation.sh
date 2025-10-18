#!/bin/bash

# Test LLM-powered persona generation
# Tests both local and deployed endpoints

set -e

echo "🧪 Testing LLM-Powered Persona Generation"
echo "=========================================="

# Load API key from .env if available
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Check if API key is available
if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  Warning: GEMINI_API_KEY not found in .env"
  echo "Will test rule-based fallback only"
fi

# Test endpoint (change to deployed URL for production test)
ENDPOINT="${MCP_ENDPOINT:-http://localhost:8787/mcp}"

echo ""
echo "Testing endpoint: $ENDPOINT"
echo ""

# Mock connected accounts data
TEST_PAYLOAD=$(cat <<'EOF'
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "persona.generate_from_accounts",
    "arguments": {
      "accounts": {
        "google": {
          "name": "Test Developer",
          "email": "test@example.com",
          "locale": "en-US",
          "youtube": {
            "subscriptions": [
              { "snippet": { "title": "Fireship", "description": "High-intensity code tutorials" } },
              { "snippet": { "title": "ThePrimeagen", "description": "Vim and software engineering" } },
              { "snippet": { "title": "Web Dev Simplified", "description": "Modern web development" } }
            ]
          }
        },
        "github": {
          "login": "testuser",
          "name": "Test Developer",
          "bio": "Full-stack developer passionate about TypeScript",
          "repos": [
            { "name": "awesome-app", "language": "TypeScript", "stars": 45 },
            { "name": "api-server", "language": "JavaScript", "stars": 23 }
          ],
          "starred": [
            { "name": "remix", "topics": ["react", "framework", "ssr"] }
          ]
        },
        "linkedin": {
          "name": "Test Developer",
          "headline": "Senior Full-Stack Developer",
          "skills": ["TypeScript", "React", "Node.js"]
        }
      }
    }
  }
}
EOF
)

echo "📤 Sending test request..."
echo ""

# Make the request
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

echo "📥 Response received:"
echo ""

# Parse and display the response
echo "$RESPONSE" | jq '.'

# Extract persona from response
PERSONA=$(echo "$RESPONSE" | jq '.result.content[0].text' | jq -r '.' | jq '.')

echo ""
echo "🎭 Generated Persona:"
echo "$PERSONA" | jq '.'

# Check if it was LLM or rule-based
METHOD=$(curl -s -I -X POST "$ENDPOINT" -H "Content-Type: application/json" -d "$TEST_PAYLOAD" 2>/dev/null | grep -i "x-persona-method" | cut -d: -f2 | tr -d ' \r\n' || echo "unknown")

echo ""
echo "📊 Generation Method: $METHOD"

# Analyze the persona quality
INTERESTS=$(echo "$PERSONA" | jq -r '.interests[]' | head -3)
GOALS=$(echo "$PERSONA" | jq -r '.currentGoals[]' | head -1)

echo ""
echo "✨ Analysis:"
echo "  Top Interests: $(echo $INTERESTS | tr '\n' ', ' | sed 's/, $//')"
echo "  First Goal: $GOALS"

echo ""
echo "✅ Test completed successfully!"
echo ""
echo "💡 To deploy with API key:"
echo "   wrangler secret put GEMINI_API_KEY"
echo "   (paste your key when prompted)"
