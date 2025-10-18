# Smithery Integration Guide

## Current Status

✅ **MCP Server Deployed:** https://twin-mcp-persona.erniesg.workers.dev/mcp

### What Works
- MCP protocol initialization (2024-11-05 spec compliant)
- 3 tools available: `persona.generate_mock`, `persona.generate_from_accounts`, `persona.export`
- Full CORS support
- Health check endpoint

### Smithery Scan Status

The Smithery automatic scan may fail due to known issues with their relay infrastructure (as of 2025-01). However, the server works perfectly when called directly.

## Testing the Server

### 1. Initialize Handshake
```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {},
      "logging": {}
    },
    "serverInfo": {
      "name": "twin-mcp-persona",
      "version": "0.1.0"
    }
  }
}
```

### 2. List Tools
```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

### 3. Call a Tool
```bash
curl -X POST https://twin-mcp-persona.erniesg.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "persona.generate_mock",
      "arguments": {
        "template": "developer",
        "customInstructions": "senior developer from Singapore"
      }
    },
    "id": 3
  }'
```

## Using with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "twin-persona": {
      "url": "https://twin-mcp-persona.erniesg.workers.dev/mcp",
      "transport": {
        "type": "http"
      }
    }
  }
}
```

## Using with Smithery Registry

### Option 1: Direct URL Registration

1. Go to https://smithery.ai/new
2. Select "Deploy External MCP Server"
3. Enter URL: `https://twin-mcp-persona.erniesg.workers.dev/mcp`
4. The scan may fail, but you can still use the server directly

### Option 2: Test Profile Configuration

If Smithery requires a test profile:

1. Go to your Smithery deployment page
2. Click "Configure Test Profile"
3. Add any required configuration (currently: none needed)
4. Save and re-scan

## Troubleshooting

### Smithery Scan Fails

**Known Issue:** Smithery's relay infrastructure has known timeout issues during the initialize phase.

**Workaround:**
- The server works perfectly when called directly
- Use the server URL directly in your MCP client
- Skip Smithery's registry and use direct HTTP connection

### CORS Issues

All CORS headers are properly set:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### Connection Timeout

If you experience timeouts:
1. Check the health endpoint: https://twin-mcp-persona.erniesg.workers.dev/health
2. Verify Cloudflare Workers status
3. Try the curl commands above to test directly

## Architecture Notes

### Why Cloudflare Workers?

- **Global Edge Deployment:** Low latency worldwide
- **No Cold Starts:** Fast initialization
- **Scalable:** Handles concurrent requests
- **Cost-Effective:** Free tier supports development

### Why Not Smithery Build?

Smithery's build process uses code generation which violates Cloudflare Workers' security policies. We use a native Cloudflare Worker implementation instead.

## Next Steps

1. ✅ Server deployed and tested
2. ⏳ Integrate with Twin frontend
3. ⏳ Add Supabase persistence
4. ⏳ Enable OAuth for real persona generation

## Support

- Server URL: https://twin-mcp-persona.erniesg.workers.dev/mcp
- Health Check: https://twin-mcp-persona.erniesg.workers.dev/health
- Documentation: `workers/mcp-persona/README.md`
