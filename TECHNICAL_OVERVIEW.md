# Twin – Technical Overview and Implementation Guide

This document summarizes the current codebase with a focus on technical implementation and how the major features are built. It is intended for engineers who want to understand, extend, and operate Twin.

> Repo: [`haresh-seenivasagan/twin`](https://github.com/haresh-seenivasagan/twin.git)

---

## 1) System Architecture (High‑Level)

- Frontend: Next.js 15 (App Router) + React 19 + TailwindCSS
- Auth & Profiles: Supabase (auth + row‑level security) with SSR helpers
- Realtime models: Convex (personas, memory refs, context history, metadata)
- MCP Persona service: Cloudflare Worker (TypeScript) – persona generation pipeline and future rate limits/auth
- Build/Deploy:
  - OpenNext → Cloudflare Pages/Workers
  - Wrangler for Workers
  - GitHub Actions (CI) ready
- Tests: Vitest + Testing Library + Playwright hooks (e2e)

```
Browser ↔ Next.js (App) ↔ Supabase (Auth) ↔ Convex (Realtime) ↔ Workers (MCP/API)
                                                     ↘ Cloudflare KV (future)
```

---

## 2) Frontend Application (Next.js)

Location: `app/`

Key routes
- `app/page.tsx` – Landing Page (hero, demo section, “Scenario: Persona‑Powered YouTube Feed” blocks). Includes:
  - Warm yellow gradient theme, floating orbs and soft hover effects
  - Manrope unified typography for headings and body
  - Video embed section (YouTube `iframe` – configurable via `NEXT_PUBLIC_DEMO_VIDEO_ID`)
  - Scenario blocks with consistent character width/height for copy
- `app/login/page.tsx`, `app/signup/page.tsx` – Email+password flows via server actions
- `app/onboarding/*` – Mocked onboarding screens (connect, generate, review)
- `app/dashboard/page.tsx` – Placeholder dashboard
- `app/layout.tsx` – Global HTML, fonts, and page‑wide warm gradient background
- `app/globals.css` – Tailwind foundation + custom gradient orbs + soft buttons + heading family

Styling & Fonts
- TailwindCSS + utility classes (responsive, spacing, z‑index)
- Custom classes:
  - `hero-gradient`, `gradient-orbs`, `soft-btn`, `heading-display`
- Fonts via `next/font/google`: Manrope (body+headings) for a friendly, minimal look

UI components: `components/ui/`
- Button, Card, Input, Label, Textarea – minimal composition (shadcn‑style)

Navigation bar
- Semi‑transparent (30% → refined to `bg-white/10` with `backdrop-blur-md`) and sticky top with soft border/shadow

---

## 3) Authentication & Server Actions

Files
- `app/actions/auth.ts`
- `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`

Highlights
- Server Actions for `login`, `signup`, `signOut`, `loginWithProvider`
- SSR Supabase client uses `@supabase/ssr` with cookie adapters
- `signup` creates a profile row (if table exists) and redirects to onboarding
- All actions validate inputs and return friendly error messages

Environment (examples)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 4) Data Models (Convex)

Schema: `convex/schema.ts`

Tables
- `users` – supabaseId, email, lastSync (indexes by supabaseId/email)
- `personas` – persona core (name, languages, preferredLanguage, style, interests, profession, currentGoals, llmPreferences, customData, versioning timestamps) with indexes
- `memoryRefs` – references to external memory store (mem0 planned), cached content, category/importance/confidence/source, timings (indexes by userId, category, importance)
- `contextHistory` – persisted prompts contexts (purpose, llmUsed, systemPrompt, tokenCount, memoriesIncluded)
- `metadata` – flexible KV per user
- `sessions` – linkage for Supabase tokens (sync helpers)

Usage model
- Convex provides realtime streams for persona/memory dashboards, while persistent truth for auth/users comes from Supabase.

---

## 5) Persona Generation via MCP Worker

Directory: `workers/mcp-persona/`

Purpose
- Provide a Model Context Protocol (MCP) tool server that can generate or enrich a user persona from connected accounts (GitHub/LinkedIn/YouTube/Gmail planned).

Key files
- `src/index.ts` – Worker entry
- `src/generation.ts` – Rule‑based extraction + LLM enrichment (structured JSON)
- `src/schemas.ts` – zod schemas for typed results
- `src/adapter.ts` – Adapter boundaries for data/LLM providers
- `README.md`, `SMITHERY.md`, `TOOLS.md` – Usage notes and integration

Pipeline (hybrid)
1. Rule‑based extraction from OAuth sources (fast, deterministic)
2. LLM enrichment (OpenAI/Claude/Gemini – structured output)
3. Merge + validate with zod

Security & Ops
- Workers secrets via `wrangler secret put`
- Options for IP rate limiting, token auth, per‑user quotas (KV + Supabase)

---

## 6) Build & Deployment

Next.js → Cloudflare Pages/Workers
- `open-next.config.ts` and `next.config.js` prepared for OpenNext builds
- Cloudflare Workers managed with Wrangler (`wrangler.toml` examples)

Typical workflows
```
# Frontend (Next.js)
pnpm dev
pnpm build

# Workers
cd workers/mcp-persona
wrangler dev
wrangler deploy
```

CI/CD (GitHub Actions)
- Workflow in `.github/workflows/` (env secrets for Supabase/Workers)

Branches & PR strategy
- Feature branches (e.g. `feature/landing-polish`) merged to `main` via PR for safe integration

---

## 7) Testing

- Unit/Component: Vitest + Testing Library
- Critical tests: `tests/critical/persona.test.ts`
- E2E (scaffold): Playwright intent

Example
```ts
// tests/critical/persona.test.ts
expect(persona.currentGoals.length).toBeGreaterThan(0)
```

---

## 8) Landing Implementation Notes

- Hero copy and subtitle controlled in `app/page.tsx`
- “AI‑Powered Persona Tool” badge
- Video section with descriptive copy about LLM/Agent persona sharing + YouTube feed personalization
- Scenario section:
  - Title: `Scenario: Persona‑Powered YouTube Feed`
  - Three columns with equal visual length using `max-w-[46ch]` and `min-h-[3.5rem]`
  - Refined copy (Authorize → Dynamic Persona → Recommendations)

Theming
- Global warm yellow background (`page-warm`) with top‑to‑white gradient for readability
- Hero gradient (`hero-gradient`) + animated orbs (`gradient-orbs`) + soft buttons (`soft-btn`)

---

## 9) Environment Variables

Examples (`.env.local.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Optional demo video id for landing
NEXT_PUBLIC_DEMO_VIDEO_ID=
# Convex/OpenNext/Workers envs (see wrangler/open-next configs)
```

Notes
- Supabase service and RLS policies are documented in `INIT.md` (SQL snippets)
- Secrets for Workers must be configured with Wrangler

---

## 10) Extending the System

- Add new data source (e.g., LinkedIn/Gmail)
  1) Create OAuth provider flow in Supabase (or Worker)
  2) Extend `workers/mcp-persona/src/adapter.ts` to fetch user signals
  3) Add rule‑based extractors + LLM prompt updates in `generation.ts`
  4) Persist persona deltas in Convex tables

- Personalization for YouTube feed
  - Convert persona signals into categories/topics → Re‑rank or filter a candidate set (via YouTube Data API or intermediate index)
  - Track feedback/engagement to close the loop (store as `memoryRefs`)

- Realtime persona editor (Dashboard)
  - Subscribe to Convex persona stream
  - Inline edits with optimistic updates

- Multi‑LLM routing
  - Preferences in `personas.llmPreferences`
  - Build a router that picks model per purpose (coding/creative/chat/analysis)

---

## 11) Security & Compliance

- Supabase RLS for `profiles` (row‑level access only to the owner)
- Secrets never stored in Git – use Wrangler/Actions Secrets
- Rate limits suggested for public worker endpoints
- Input/output validation via zod in the worker; sanitize model outputs

---

## 12) Local Development

```bash
# 1) Install deps
pnpm install

# 2) Dev with local mock or real services
NEXT_PUBLIC_USE_MOCK=true pnpm dev
# or
pnpm dev

# 3) Convex (if used locally)
npx convex dev

# 4) Workers
cd workers/mcp-persona && wrangler dev
```

---

## 13) Roadmap (Suggested)

- OAuth integrations (YouTube/LinkedIn/Gmail) end‑to‑end
- Feed re‑ranking demo (YouTube topics → persona intents)
- Realtime persona editor & memory search UI
- Usage analytics + per‑user quotas for MCP worker
- Full test coverage for server actions and worker pipeline

---

## 14) References

- GitHub repository: [`haresh-seenivasagan/twin`](https://github.com/haresh-seenivasagan/twin.git)
- Convex docs, Supabase docs, Cloudflare Workers, OpenNext (see respective provider guides)

---

If you need a deeper deep‑dive into any subsystem (auth/session handshake, worker prompt schema, or Convex data access patterns), open a task and we can add design notes and code diagrams inline.
