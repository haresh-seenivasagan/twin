# Supabase Migrations

## Running Migrations

Since Twin uses Cloudflare Workers (not Supabase CLI), run migrations manually:

### Option 1: Supabase Dashboard (Recommended for Development)

1. Go to your Supabase project: https://supabase.com/dashboard/project/lbyicktafbnqwbieffbj
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `migrations/20250118_create_user_personas.sql`
5. Click "Run" to execute

### Option 2: Using psql (Command Line)

```bash
# Get your database password from Supabase Dashboard → Settings → Database
psql postgresql://postgres:[YOUR-PASSWORD]@db.lbyicktafbnqwbieffbj.supabase.co:5432/postgres < supabase/migrations/20250118_create_user_personas.sql
```

## Migration Files

- `20250118_create_user_personas.sql` - Creates `user_personas` and `user_youtube_tokens` tables

## Schema Overview

### `user_personas` Table
Stores user personas and connected account data:
- `id` - UUID primary key
- `user_id` - References auth.users
- `youtube_data` - JSONB (subscriptions, likes, playlists)
- `twitter_data` - JSONB (future)
- `persona` - JSONB (generated AI persona)
- `focus_areas` - TEXT[] (user-selected focus areas)
- `custom_instructions` - TEXT (user-provided instructions)

### `user_youtube_tokens` Table
Stores YouTube OAuth tokens securely:
- `id` - UUID primary key
- `user_id` - References auth.users
- `access_token` - TEXT (encrypted in production)
- `refresh_token` - TEXT
- `expires_at` - TIMESTAMPTZ

## Row Level Security (RLS)

Both tables have RLS enabled with policies ensuring users can only access their own data:
- Users can SELECT/INSERT/UPDATE/DELETE their own records only
- Enforced via `auth.uid() = user_id` check
