# Twin - Deployment Guide

## Quick Start (Cloudflare Deployment)

### Prerequisites
- Cloudflare account (free tier works)
- Supabase account for authentication
- Node.js 18+ and pnpm installed

### 1. Clone and Install
```bash
git clone <your-repo>
cd twin
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

#### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_APP_URL`: Your app URL (use localhost:3000 for development)

#### For Quick Testing (No External Services)
```bash
NEXT_PUBLIC_USE_MOCK=true pnpm dev
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run this SQL in the Supabase SQL editor:
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  persona JSONB DEFAULT '{}',
  llm_preferences JSONB DEFAULT '{}',
  custom_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own profile
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

3. Configure authentication:
   - Go to Authentication → Providers
   - Enable Email/Password
   - (Optional) Enable Google and GitHub OAuth

### 4. Deploy to Cloudflare Workers (Updated 2025-10-18)

#### Current Deployment Method (OpenNext)
We use `@opennextjs/cloudflare` to deploy Next.js 15 to Cloudflare Workers:

```bash
# Login to Cloudflare (first time only)
wrangler login

# Build and deploy in one command
npx @opennextjs/cloudflare build && npx @opennextjs/cloudflare deploy
```

#### Set environment variables in Cloudflare:
Use `wrangler secret` for sensitive keys:
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put MCP_ADMIN_API_KEY
```

Public variables are in `wrangler.toml` under `[vars]`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `YOUTUBE_REDIRECT_URI`
- `MCP_SERVER_URL`

#### Current Production URL
https://twin.erniesg.workers.dev

#### Recent Deployments
- 2025-10-18: Version `a9321d52-e64c-41f5-9171-1a98336071ba`
  - Fixed email vs user_id schema mismatch
  - MCP persona generation integrated
  - Custom goals feature added

### 5. Custom Domain (Optional)

1. Go to Cloudflare Pages → Your Project → Custom Domains
2. Add your domain
3. Update DNS records as instructed

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Cloudflare  │────▶│  Supabase   │
│             │◀────│    Pages     │◀────│   (Auth)    │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Optional   │
                    │   Services   │
                    ├──────────────┤
                    │ • Convex     │
                    │ • mem0       │
                    │ • OpenAI     │
                    │ • Anthropic  │
                    └──────────────┘
```

## Features Status (Updated 2025-10-18)

### ✅ Working Now
- User signup/login with Supabase Auth
- Protected routes and middleware
- Landing page with feature overview
- **YouTube OAuth integration** (working - fetches subscriptions, playlists, likes)
- **MCP server persona generation** (integrated at `twin-mcp-persona.erniesg.workers.dev`)
- Improved focus areas with 10 categorized options (Career, Skills, Personal, Productivity)
- Custom goal input system (users can add "Dating & Relationships", etc.)
- Persona generation from real YouTube data
- Persona review and editing
- Dashboard with persona display
- Deployed to Cloudflare Workers at `twin.erniesg.workers.dev`

### ✅ Recent Updates (2025-10-18)
- **Phase 1**: Connected MCP server for AI persona generation
  - Modified `lib/persona/generator.ts` to use real MCP API calls
  - Full YouTube data objects passed to MCP (not just strings)
  - Fallback to mock if MCP fails
  - Added console logging for debugging

- **Phase 2+3**: Enhanced focus areas and custom goals
  - Replaced overlapping focus areas with organized categories
  - Added emoji icons for better UX
  - Implemented custom goal input with badges
  - Combined pre-defined + custom goals for persona generation

- **Bug Fixes**:
  - Fixed TypeScript errors in persona generator
  - Fixed schema mismatch (email vs user_id in YouTube data lookup)
  - Removed deprecated `watchHistory` references

### 🚧 Coming Soon
- Real OAuth for Gmail and LinkedIn
- Memory CRUD operations
- Export/import functionality
- Multi-LLM support
- End-to-end testing with authenticated users

## Development Commands (Updated 2025-10-18)

```bash
# Local development
pnpm dev

# Build for production (Next.js)
pnpm build

# Build for Cloudflare Workers (OpenNext)
npx @opennextjs/cloudflare build

# Deploy to Cloudflare Workers
npx @opennextjs/cloudflare deploy

# Build and deploy together
npx @opennextjs/cloudflare build && npx @opennextjs/cloudflare deploy

# Check YouTube data
curl "https://twin.erniesg.workers.dev/api/youtube/data?email=YOUR_EMAIL"

# Monitor live deployment (requires separate terminal)
wrangler tail twin --format pretty
```

## Troubleshooting

### "Module not found" errors
```bash
pnpm install
```

### Supabase connection issues
- Check that your Supabase URL and keys are correct
- Ensure Row Level Security policies are set up
- Verify your Supabase project is not paused

### Cloudflare deployment fails
- Ensure you're logged in: `wrangler login`
- Check that all environment variables are set in Cloudflare dashboard
- Verify Node.js compatibility flags in wrangler.toml

### OAuth not working
- Currently mocked - real OAuth requires configuration in Supabase
- Set up OAuth providers in Supabase Dashboard → Authentication → Providers

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your application URL |
| `SUPABASE_SERVICE_KEY` | ⚠️ | For server-side operations |
| `NEXT_PUBLIC_USE_MOCK` | ❌ | Enable mock mode |
| `NEXT_PUBLIC_CONVEX_URL` | ❌ | Convex project URL |
| `CONVEX_DEPLOY_KEY` | ❌ | Convex deployment key |
| `MEM0_API_KEY` | ❌ | mem0 API key |
| `OPENAI_API_KEY` | ❌ | OpenAI API key |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API key |
| `GOOGLE_AI_KEY` | ❌ | Google AI key |

## Security Best Practices (Updated 2025-01)

### Environment Variables Strategy

#### ✅ Public Variables (Safe to Commit)
These go in `wrangler.toml` under `[vars]`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (protected by RLS)
- `NEXT_PUBLIC_APP_URL` - Your app URL

**Why it's safe:** ANON keys are designed for client-side use and are protected by Row Level Security policies in Supabase.

#### ⚠️ Secret Variables (NEVER Commit)
Use Cloudflare secrets for sensitive data:

```bash
# Set production secrets (creates new deployment)
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
```

#### Local Development Secrets
Create `.dev.vars` for local development:
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your local secrets (if needed):
```
SUPABASE_SERVICE_ROLE_KEY=your-local-key
```

**Important:** `.dev.vars` is gitignored and never committed!

### Managing Secrets

```bash
# List secrets (shows names only, not values)
wrangler secret list

# Update a secret (creates new deployment)
wrangler secret put SECRET_NAME

# Delete a secret
wrangler secret delete SECRET_NAME
```

### Security Checklist

- ✅ `wrangler.toml` is in `.gitignore`
- ✅ `.dev.vars` is in `.gitignore`
- ✅ `.env.local` is in `.gitignore`
- ✅ Only `.example` files are committed
- ✅ ANON keys are safe in `[vars]`
- ✅ SERVICE_ROLE_KEY only via secrets
- ✅ Compatibility date set to 2025-01-18

### Compatibility Configuration

Current setup in `wrangler.toml`:
```toml
compatibility_date = "2025-01-18"
compatibility_flags = ["nodejs_compat"]
```

**What this enables:**
- Modern Node.js APIs (crypto, buffer, etc.)
- Automatic `process.env` population (as of 2025-04-01+)
- Latest Cloudflare Workers features

### Resources

- [Cloudflare Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Cloudflare Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Supabase + Cloudflare Workers](https://supabase.com/partners/integrations/cloudflare-workers)

## Next Steps - Development Roadmap (2025-10-18)

### 🎯 Immediate Priorities (Next 1-2 Weeks)

#### 1. End-to-End Testing with Real Users
- [ ] Create test account with `icicle.sky@gmail.com` in Supabase
- [ ] Complete full onboarding flow: YouTube OAuth → Generate Persona → Review
- [ ] Test MCP server persona generation with real YouTube data (16 subs, 2 playlists, 10 likes)
- [ ] Verify persona storage in Supabase `user_personas` table
- [ ] Test custom goals feature ("Dating & Relationships", "Cooking", etc.)
- [ ] Monitor Cloudflare Workers logs during test: `wrangler tail twin --format pretty`

#### 2. Error Handling & UX Improvements
- [ ] Add loading states to persona generation page
- [ ] Add error messages for MCP server failures
- [ ] Add retry logic for failed persona generation
- [ ] Add success animations/feedback after persona generation
- [ ] Add ability to regenerate persona with different focus areas
- [ ] Add "Save Draft" functionality for incomplete personas

#### 3. Persona Review Page Enhancements
- [ ] Display generated persona in readable format
- [ ] Add edit capabilities for each persona field
- [ ] Show which YouTube channels influenced the persona
- [ ] Add "Regenerate" button to try again with new settings
- [ ] Add export functionality (JSON, PDF)

### 🔧 Backend & Integration Work

#### 4. MCP Server Robustness
- [ ] Add detailed error logging for MCP calls
- [ ] Implement circuit breaker pattern for MCP failures
- [ ] Add MCP response validation
- [ ] Create unit tests for `lib/persona/generator.ts`
- [ ] Add integration tests for MCP client
- [ ] Document MCP API response format

#### 5. Database & Schema Improvements
- [ ] Add indexes for common queries on `user_personas` table
- [ ] Consider merging `user_youtube_data.email` with `auth.users.id`
- [ ] Add `last_generated_at` timestamp to track regeneration frequency
- [ ] Add `generation_version` to track schema changes over time
- [ ] Implement soft deletes for personas (instead of hard delete)

#### 6. OAuth Integration Expansion
- [ ] Implement Gmail OAuth flow (similar to YouTube)
- [ ] Add LinkedIn OAuth integration
- [ ] Create unified OAuth callback handler
- [ ] Store OAuth refresh tokens securely (Cloudflare KV?)
- [ ] Add token refresh logic before API calls
- [ ] Add "Disconnect" functionality for each OAuth provider

### 🎨 Frontend & UX Features

#### 7. Dashboard Improvements
- [ ] Display persona summary on dashboard
- [ ] Show persona generation date and freshness
- [ ] Add "Connected Accounts" widget showing OAuth status
- [ ] Add quick regeneration CTA if persona is >30 days old
- [ ] Add persona comparison view (before/after edits)

#### 8. Onboarding Flow Polish
- [ ] Add progress indicator (Step 1 of 3, etc.)
- [ ] Add skip functionality for optional steps
- [ ] Add "Why do we need this?" tooltips
- [ ] Add preview of what persona will look like
- [ ] Add onboarding completion celebration animation

#### 9. Focus Areas & Goals Enhancement
- [ ] Add search/filter for focus areas
- [ ] Add popular custom goals suggestions
- [ ] Track which focus areas users select most
- [ ] Add "Quick Start" templates (Developer, Designer, Student, etc.)
- [ ] Save focus area preferences for future regenerations

### 📊 Analytics & Monitoring

#### 10. Telemetry & Observability
- [ ] Add Cloudflare Analytics integration
- [ ] Track persona generation success/failure rates
- [ ] Monitor MCP server response times
- [ ] Track which focus areas are most popular
- [ ] Track custom goals users add
- [ ] Add error tracking (Sentry or similar)

#### 11. Performance Monitoring
- [ ] Measure time-to-generate for personas
- [ ] Track YouTube API rate limits
- [ ] Monitor Cloudflare Workers CPU/memory usage
- [ ] Add performance budgets for page loads
- [ ] Optimize bundle size (currently 106 kB First Load JS)

### 🔒 Security & Compliance

#### 12. Security Hardening
- [ ] Review and test Row Level Security policies
- [ ] Implement rate limiting for persona generation (prevent spam)
- [ ] Add CSRF protection for OAuth callbacks
- [ ] Audit all API endpoints for authorization checks
- [ ] Add input validation for custom goals (prevent XSS)
- [ ] Implement content security policy headers

#### 13. Privacy & Data Management
- [ ] Add data export functionality (GDPR compliance)
- [ ] Add data deletion functionality
- [ ] Add privacy policy page
- [ ] Add terms of service page
- [ ] Document data retention policies
- [ ] Add user consent management

### 📝 Documentation & Testing

#### 14. Documentation
- [ ] Write API documentation for all endpoints
- [ ] Document MCP server integration
- [ ] Create architecture diagram showing data flow
- [ ] Write user guide for onboarding process
- [ ] Document deployment process for new developers
- [ ] Create troubleshooting guide

#### 15. Testing Strategy
- [ ] Write unit tests for persona generator
- [ ] Write integration tests for OAuth flow
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add pre-commit hooks for linting/testing
- [ ] Set up staging environment

### 🚀 Advanced Features (Future)

#### 16. AI Enhancement
- [ ] Allow users to chat with their persona
- [ ] Add persona tuning based on user feedback
- [ ] Implement multi-modal persona (text + voice)
- [ ] Add persona evolution over time
- [ ] Create persona diff view to see changes

#### 17. Multi-LLM Support
- [ ] Add provider selection (OpenAI, Anthropic, Gemini)
- [ ] Store provider preferences in user settings
- [ ] A/B test different providers for quality
- [ ] Add cost tracking per provider

---

## Current Technical Debt

### High Priority
1. **Auth vs Email Inconsistency**: YouTube data stored by email, but personas query by user_id
   - **Fix**: Either migrate YouTube data to use user_id or keep email-based lookup
   - **Impact**: Blocks persona generation if user email changes

2. **No Error Recovery**: If MCP fails, user sees generic error
   - **Fix**: Add specific error messages and retry UI
   - **Impact**: Poor UX for intermittent failures

3. **No Loading States**: Persona generation takes time but no feedback
   - **Fix**: Add progress indicators and estimated time
   - **Impact**: Users think the app is broken

### Medium Priority
4. **No Tests**: Persona generation has no automated tests
   - **Fix**: Add unit + integration tests
   - **Impact**: Regressions are hard to catch

5. **Bundle Size**: 106 kB First Load JS is large
   - **Fix**: Code splitting, lazy loading
   - **Impact**: Slow initial page load

6. **No Monitoring**: Can't see errors in production
   - **Fix**: Add Sentry or similar
   - **Impact**: Hard to debug production issues

---

## Support

For issues or questions:
- Check the [INIT.md](./INIT.md) file for detailed development guide
- Review the example environment file: `.env.local.example`
- See this comprehensive roadmap for planned features
- Monitor live deployments: `wrangler tail twin --format pretty`