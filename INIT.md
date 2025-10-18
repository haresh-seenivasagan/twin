# Twin - Complete Development Guide

> Everything you need to build, test, and deploy Twin

## Table of Contents
1. [Architecture](#architecture)
2. [Setup](#setup)
3. [Development Phases](#development-phases)
4. [Testing](#testing)
5. [Parallel Development](#parallel-development)
6. [Deployment](#deployment)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

```
Next.js App → Cloudflare Workers API → ┬→ Supabase (Auth + Storage)
                                       ├→ Convex (Real-time Data)
                                       ├→ mem0 (Memory Embeddings)
                                       └→ LLMs (OpenAI/Claude/Gemini)
```

### Key Design Decisions
- **Supabase**: Handles auth + long-term storage (chosen for robust auth)
- **Convex**: Real-time reactive data (chosen for instant updates)
- **mem0**: Specialized memory management (handles embeddings/search)
- **Cloudflare Workers**: Edge deployment (global, fast, cheap)

---

## Setup

### Option 1: Mock Mode (30 seconds, no config!)
```bash
cd /Users/erniesg/code/erniesg/twin
NEXT_PUBLIC_USE_MOCK=true pnpm install
NEXT_PUBLIC_USE_MOCK=true pnpm dev
# Visit http://localhost:3000 - works immediately!
```

### Option 2: Full Setup (with real services)

#### 1. Install and Configure
```bash
# Run setup script
./scripts/setup.sh

# Copy and edit environment
cp .env.example .env.local
```

#### 2. Required Environment Variables
```bash
# Supabase (create project at supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Convex (run: npx convex dev)
NEXT_PUBLIC_CONVEX_URL=your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# mem0 (get key at mem0.ai)
MEM0_API_KEY=your-mem0-key

# LLMs (need at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_KEY=AI...
```

#### 3. Database Setup (Supabase)
```sql
-- Run in Supabase SQL Editor
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  persona JSONB DEFAULT '{}',
  llm_preferences JSONB DEFAULT '{}',
  custom_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);
```

#### 4. Start Development
```bash
npx convex dev    # Terminal 1: Convex backend
pnpm dev         # Terminal 2: Next.js app
```

---

## Development Phases

### 📊 Progress Tracker

| Phase | Time | Status | Progress |
|-------|------|--------|----------|
| Phase 0: Setup | 30min | ⬜ | 0/5 |
| Phase 1: Core MVP | 3-4hr | ⬜ | 0/19 |
| Phase 2: Integration | 2hr | ⬜ | 0/8 |
| Phase 3: Deployment | 1hr | ⬜ | 0/6 |
| Phase 4: Polish | 1-2hr | ⬜ | 0/5 |

### 🎯 First Major Milestone
**Landing → Sign Up → Connect Accounts → Auto-Generated Persona → Edit → Save**

### Phase 0: Setup & Mock Testing (30 minutes)

- [ ] **Environment Setup**
  - [ ] Clone repo and run `pnpm install`
  - [ ] Copy `.env.example` to `.env.local`
  - [ ] Run with mocks: `NEXT_PUBLIC_USE_MOCK=true pnpm dev`
  - [ ] Verify app loads at http://localhost:3000
  - [ ] Verify mock data appears (4 personas, 16 memories)

### Phase 1: Core MVP (3-4 hours) ⭐ CRITICAL

**Success = User Signs Up → Connects Accounts → Gets Auto-Generated Persona**

#### 1.1 Landing & Auth
- [ ] **Landing Page**
  - [ ] Hero section explaining Twin
  - [ ] "Get Started" / "Sign Up" CTA
  - [ ] Sign up with email or social login
  - [ ] Login for returning users
  - [ ] Test: User can create account

#### 1.2 Account Connection & Persona Generation
- [ ] **Connect Accounts Page**
  - [ ] List of connectable accounts (Google, GitHub, LinkedIn, Twitter/X)
  - [ ] OAuth flow for each service
  - [ ] Show connected accounts with checkmarks
  - [ ] "Generate My Persona" button

- [ ] **Auto-Generate Persona from Connected Data**
  - [ ] Extract name from social profiles
  - [ ] Detect languages from GitHub repos / LinkedIn
  - [ ] Infer interests from GitHub stars, Twitter follows
  - [ ] Extract profession from LinkedIn
  - [ ] Generate initial goals based on recent activity
  - [ ] Test: Persona generated from at least one source

```typescript
// Example: lib/persona-generator.ts
// Extracts from GitHub:
const persona = {
  name: "Alex Chen",                    // From GitHub/Google
  profession: "Senior Software Engineer", // From LinkedIn/bio
  languages: ["en", "zh"],              // From locale/repos
  interests: ["TypeScript", "AI", "React"], // From stars/repos
  currentGoals: [
    "Maintain and improve ai-assistant",  // From recent repos
    "Master full-stack development"       // From language diversity
  ]
}
```

- [ ] **Persona Review/Edit Page**
  - [ ] Display auto-generated persona
  - [ ] Editable fields (name, goals, interests)
  - [ ] Add/remove languages
  - [ ] Adjust communication style
  - [ ] "Save & Continue" button
  - [ ] Test: User can edit and save persona

#### 1.3 Memory System
- [ ] **Memory Storage**
  - [ ] Add memory function
  - [ ] Memory includes taskRelevance
  - [ ] Test: Can store at least one memory

- [ ] **Memory Retrieval**
  - [ ] Get memories by user
  - [ ] Filter by task relevance
  - [ ] Test: Returns relevant memories

#### 1.3 Context Generation ⭐ CRITICAL
- [ ] **Build Context Generator**
  - [ ] Combine persona name + goals
  - [ ] Include relevant memories
  - [ ] Format for LLM consumption
  - [ ] Test: Context includes all required elements

```typescript
// Minimum viable context output:
{
  systemPrompt: "You are assisting [NAME]. Goals: [GOALS]. Context: [MEMORIES]",
  memoriesIncluded: 1+,
  persona: { name: "...", goals: [...] }
}
```

### Phase 2: Integration (2 hours)

#### 2.1 Authentication
- [ ] **Supabase Auth Setup**
  - [ ] Configure Supabase project
  - [ ] Enable email/password auth
  - [ ] Add social logins (optional)
  - [ ] Test: User can sign up/login

#### 2.2 Real Services
- [ ] **Connect Services**
  - [ ] Convex real-time updates working
  - [ ] mem0 API connected and storing
  - [ ] At least one LLM responding
  - [ ] Test: `pnpm test:integration`

### Phase 3: Deployment (1 hour)

- [ ] **Backend Deployment**
  - [ ] Deploy Convex: `npx convex deploy --prod`
  - [ ] Note Convex URL

- [ ] **API Deployment**
  - [ ] Deploy Workers: `cd workers/api && wrangler deploy`
  - [ ] Set secrets: `wrangler secret put [KEY_NAME]`
  - [ ] Test health: `curl https://api.workers.dev/health`

- [ ] **Frontend Deployment**
  - [ ] Deploy to Vercel: `vercel --prod`
  - [ ] Set environment variables in dashboard
  - [ ] Test production URL works

### Phase 4: Polish (1-2 hours)

- [ ] **Enhanced Features**
  - [ ] Multiple LLM support (OpenAI + Anthropic + Google)
  - [ ] Export persona to JSON/YAML
  - [ ] Import persona from file
  - [ ] Memory search UI
  - [ ] Real-time sync indicators

---

## 🎯 Quick Validation Checklist

After each phase, validate:

### After Phase 0 ✅
```bash
# Should work with zero configuration:
NEXT_PUBLIC_USE_MOCK=true pnpm dev
# ✓ App loads
# ✓ Can see mock personas
# ✓ Can see mock memories
```

### After Phase 1 ✅
```javascript
// First milestone complete:
✓ User can sign up / login
✓ User can connect at least 1 account (Google/GitHub/etc)
✓ Persona auto-generated from connected account
✓ persona.name !== "" (extracted from account)
✓ persona.currentGoals.length > 0 (auto-generated)
✓ User can edit and save persona
✓ Basic context generation works
```

### After Phase 2 ✅
```bash
# Real services connected:
✓ User can authenticate
✓ Persona saved to database
✓ Memory stored in mem0
✓ LLM returns response
```

### After Phase 3 ✅
```bash
# Everything deployed:
✓ Production URL works
✓ API endpoints responding
✓ Can create user and generate context
```

### After Phase 4 ✅
```bash
# Polish complete:
✓ Multiple LLMs work
✓ Export/import works
✓ UI is polished
```

---

## Testing

### Three Testing Strategies

```bash
# 1. Mock Mode (No external services)
NEXT_PUBLIC_USE_MOCK=true pnpm test:mock

# 2. Critical Path Only (For hackathon)
pnpm test:critical

# 3. Full Integration (Requires all services)
pnpm test:integration
```

### What to Test (Priority)

```typescript
// CRITICAL: Goals exist
test('persona has goals', () => {
  expect(persona.currentGoals.length).toBeGreaterThan(0)
})

// CRITICAL: Context includes goals
test('context includes goals', () => {
  expect(context).toContain(persona.currentGoals[0])
})

// IMPORTANT: Memories filtered by task
test('memories are relevant', () => {
  const memories = getMemoriesForTask("coding")
  expect(memories[0].taskRelevance).toContain("coding")
})
```

---

## Parallel Development

### Team Assignments

| Team | Focus | Can Use Mocks? | Deliverable |
|------|-------|----------------|-------------|
| **A** | Auth (Supabase) | No | Social login |
| **B** | UI (Persona form) | Yes | Forms, goals manager |
| **C** | Memory (mem0) | Yes | Store/search |
| **D** | Context generation | Yes | Combine persona + memories |
| **E** | Deployment | Yes | Workers API |

### Mock Data Available

```typescript
// 4 complete personas
import { MOCK_PERSONAS } from '@/tests/mocks'
// developer, designer, researcher, student

// 16+ memories with task relevance
import { MOCK_MEMORIES } from '@/tests/mocks'

// Context generator
import { generateMockContext } from '@/tests/mocks'
const context = generateMockContext("developer", "coding")
```

### Integration Timeline
- **Hour 2**: Auth ready → UI can use real users
- **Hour 4**: Personas ready → Context can use real data
- **Hour 6**: Everything integrates
- **Hour 8**: Deployed!

---

## Deployment

### Local Development
```bash
pnpm dev                # Next.js
npx convex dev         # Convex backend
cd workers/api && pnpm dev  # Workers API
```

### Production Deployment

#### 1. Deploy Convex
```bash
npx convex deploy --prod
```

#### 2. Deploy Cloudflare Workers
```bash
cd workers/api

# Set secrets
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put MEM0_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GOOGLE_AI_KEY

# Deploy
wrangler deploy --env production
```

#### 3. Deploy Next.js (Vercel)
```bash
vercel --prod
# Set env vars in Vercel dashboard
```

---

## API Reference

### Base URL
```
Development: http://localhost:8787
Production: https://your-api.workers.dev
```

### Authentication
```javascript
// All requests need Bearer token
headers: {
  'Authorization': `Bearer ${session.access_token}`
}
```

### Critical Endpoints

#### 1. Create/Update Persona
```http
POST /api/personas
```
```json
{
  "userId": "user-123",
  "persona": {
    "name": "Alex",
    "currentGoals": ["Ship MVP", "Learn Rust"],
    "languages": ["en", "zh"],
    "style": {
      "formality": "casual",
      "verbosity": "concise",
      "technical_level": "advanced"
    }
  },
  "llmPreferences": {
    "default": "claude",
    "coding": "claude",
    "creative": "gemini"
  }
}
```

#### 2. Add Memory
```http
POST /api/memories
```
```json
{
  "userId": "user-123",
  "content": "Prefers TypeScript over JavaScript",
  "metadata": {
    "category": "preferences",
    "importance": 9,
    "taskRelevance": ["coding", "frontend"]
  }
}
```

#### 3. Generate Context (MOST IMPORTANT)
```http
POST /api/context/generate
```
```json
{
  "userId": "user-123",
  "purpose": "coding",  // coding|creative|analysis|chat
  "task": "refactor auth",
  "includeMemories": true,
  "llm": "auto"  // auto|claude|openai|gemini
}
```

**Response:**
```json
{
  "systemPrompt": "You are assisting Alex. Current goals: Ship MVP, Learn Rust. Context: Prefers TypeScript...",
  "llmSelected": "claude",
  "memoriesIncluded": 3
}
```

#### 4. Chat with Context
```http
POST /api/chat
```
```json
{
  "userId": "user-123",
  "message": "Help me refactor this code",
  "includeContext": true
}
```

### Other Endpoints

```http
GET  /api/personas/:userId      # Get persona
GET  /api/memories/:userId      # List memories
POST /api/memories/search       # Search memories
GET  /api/export/:userId        # Export data
GET  /health                    # Health check
GET  /api/status                # Service status
```

---

## Troubleshooting

### Quick Fixes

| Problem | Solution |
|---------|----------|
| No Supabase | Use `NEXT_PUBLIC_USE_MOCK=true` |
| No Convex | Use React state instead |
| No mem0 | Use hardcoded memories from mocks |
| No Workers | Use Next.js `/api` routes |
| No LLMs | Return mock responses |

### Escape Hatches

```typescript
// If everything fails, demo still works!
const DEMO_MODE = {
  persona: {
    name: "Demo User",
    currentGoals: ["Build MVP", "Ship fast"]
  },
  memories: [
    "Prefers TypeScript",
    "Uses React"
  ],
  context: "You are assisting Demo User. Goals: Build MVP, Ship fast. Context: Prefers TypeScript, Uses React."
}
```

### Common Issues

#### "Cannot connect to services"
```bash
# Just use mocks!
NEXT_PUBLIC_USE_MOCK=true pnpm dev
```

#### "Tests failing"
```bash
# Run only critical tests
pnpm test:critical

# Or use mock tests
NEXT_PUBLIC_USE_MOCK=true pnpm test:mock
```

#### "Deployment failed"
```bash
# Deploy just the Next.js app with mocks
NEXT_PUBLIC_USE_MOCK=true vercel --prod
```

---

## Commands Reference

```bash
# Development
pnpm dev               # Start app
pnpm test:mock        # Test with mocks
pnpm test:critical    # MVP tests only
pnpm build            # Production build

# Deployment
npx convex deploy     # Deploy Convex
wrangler deploy       # Deploy Workers
vercel               # Deploy to Vercel

# Utilities
pnpm typecheck       # Check types
pnpm lint           # Lint code
pnpm format         # Format code
```

---

## Success Metrics

```javascript
// MVP is successful if:
const MVP_SUCCESS =
  persona.name !== "" &&
  persona.currentGoals.length > 0 &&  // CRITICAL!
  memories.length > 0 &&
  context.includes(persona.name) &&
  context.includes(persona.currentGoals[0])

// That's it! Everything else is bonus.
```

---

**Remember**: The goal is to show that AI can remember who you are. If it works with mocks, you can demo it!