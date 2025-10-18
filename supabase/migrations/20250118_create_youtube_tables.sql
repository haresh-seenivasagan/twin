-- Create user_youtube_data table to store fetched YouTube data (no auth required for onboarding)
CREATE TABLE IF NOT EXISTS public.user_youtube_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  subscriptions JSONB,
  playlists JSONB,
  liked_videos JSONB,
  last_refreshed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable RLS for onboarding (no auth required)
-- In production, you may want to add service role policies
ALTER TABLE public.user_youtube_data DISABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_youtube_data_email ON public.user_youtube_data(email);

-- Add comments
COMMENT ON TABLE public.user_youtube_data IS 'YouTube data fetched during onboarding (subscriptions, playlists, liked videos)';
