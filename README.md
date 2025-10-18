# Twin - Portable AI Persona & Memory System

> Your AI persona that travels with you across every LLM

**📖 THIS FILE:** Project overview, what Twin is, quick demo
**📘 [INIT.md](./INIT.md):** Complete setup, development phases, testing, deployment
**🚀 [workers/mcp-persona/](./workers/mcp-persona/):** Live MCP server (generate personas now!)

---

## 🚀 Quick Start (No API keys needed!)

```bash
# 1. Clone and install
cd /Users/erniesg/code/erniesg/twin
pnpm install

# 2. Start with mock data (works immediately!)
NEXT_PUBLIC_USE_MOCK=true pnpm dev

# 3. Open http://localhost:3000
```

## 🎯 What is Twin?

**Problem**: Every AI interaction starts from zero. Your preferences, context, and history are lost.

**Solution**: Twin creates a portable identity layer that remembers who you are.

**Formula**: `Persona + Goals + Memories = Consistent AI Context`

## 📚 Documentation

### Which File to Use?

| If you want to... | Read this |
|-------------------|-----------|
| **Understand what Twin is** | You're reading it (README) |
| **Start coding immediately** | Quick Start above ↑ |
| **See current status & next steps** | [INIT.md](./INIT.md#-current-status-2025-01-18) |
| **Set up real services** | [INIT.md](./INIT.md#setup) |
| **Understand the architecture** | [INIT.md](./INIT.md#architecture) |
| **Deploy to production** | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **Use persona MCP server** | [workers/mcp-persona/README.md](./workers/mcp-persona/README.md) |
| **Test persona generation** | `cd workers/mcp-persona && ./test-persona.sh` |

## ✅ MVP Success Criteria

```javascript
const SUCCESS =
  persona.name !== "" &&
  persona.currentGoals.length > 0 &&
  memories.length > 0 &&
  context.includes(goals)
```

That's it! If you can show persona + goals generating context, you've succeeded.

---

**👉 Everything else is in [INIT.md](./INIT.md) - the complete development guide**