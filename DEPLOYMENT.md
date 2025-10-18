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

### 4. Deploy to Cloudflare Pages

#### First-time setup:
```bash
# Login to Cloudflare
wrangler login

# Build the project for Cloudflare
pnpm cf:build

# Deploy to Cloudflare Pages
wrangler pages deploy .vercel/output/static

# Follow the prompts to:
# 1. Name your project (e.g., "twin-app")
# 2. Select production branch
```

#### Set environment variables in Cloudflare:
1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables
2. Add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Cloudflare Pages URL)

#### Subsequent deployments:
```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
```

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

## Features Status

### ✅ Working Now
- User signup/login with Supabase Auth
- Protected routes and middleware
- Landing page with feature overview
- OAuth connection UI (mocked)
- Persona generation with custom instructions
- Persona review and editing
- Dashboard with persona display

### 🚧 Coming Soon
- Real OAuth connections (YouTube, Gmail, LinkedIn)
- Memory CRUD operations
- AI-powered persona generation from real data
- Export/import functionality
- Multi-LLM support

## Development Commands

```bash
# Local development
pnpm dev

# Run with mock data (no external services needed)
NEXT_PUBLIC_USE_MOCK=true pnpm dev

# Build for production
pnpm build

# Deploy to Cloudflare
pnpm cf:deploy

# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production
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

## Support

For issues or questions:
- Check the [INIT.md](./INIT.md) file for detailed development guide
- Review the example environment file: `.env.local.example`
- Test with mock mode first: `NEXT_PUBLIC_USE_MOCK=true pnpm dev`