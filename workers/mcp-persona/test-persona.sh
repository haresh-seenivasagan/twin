#!/bin/bash
# Quick test script for persona MCP server
# Usage: ./test-persona.sh

set -e

echo "🧪 Testing Twin MCP Persona Server"
echo ""

# Start server in background
echo "📡 Starting MCP server..."
pnpm dev &
SERVER_PID=$!
sleep 3

echo ""
echo "✅ Server started (PID: $SERVER_PID)"
echo ""

# Test 1: Generate random mock persona
echo "Test 1: Generate random mock persona"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "persona.generate_mock",
      "arguments": {
        "template": "random"
      }
    },
    "id": 1
  }' | jq '.'

echo ""
echo ""

# Test 2: Generate developer persona with custom instructions
echo "Test 2: Generate senior developer from Singapore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "persona.generate_mock",
      "arguments": {
        "template": "developer",
        "customInstructions": "Make them a senior developer from Singapore"
      }
    },
    "id": 2
  }' | jq '.'

echo ""
echo ""

# Test 3: Generate from accounts (mock data)
echo "Test 3: Generate from connected accounts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "persona.generate_from_accounts",
      "arguments": {
        "accounts": {
          "github": {
            "login": "testuser",
            "name": "Test User",
            "bio": "Full-stack developer",
            "repos": [
              {"name": "twin", "language": "TypeScript", "stars": 42}
            ],
            "starred": [
              {"name": "next.js", "topics": ["react", "framework"]}
            ]
          }
        }
      }
    },
    "id": 3
  }' | jq '.'

echo ""
echo ""

# Cleanup
echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "✅ All tests completed!"
echo ""
echo "Next steps:"
echo "  1. Review the persona outputs above"
echo "  2. Try different templates: developer, designer, manager, student"
echo "  3. Experiment with custom instructions"
echo "  4. Check PERSONA_API.md for integration examples"
