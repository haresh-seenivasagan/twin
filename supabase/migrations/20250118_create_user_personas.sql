-- Create table for storing user personas and connected account data
CREATE TABLE IF NOT EXISTS user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Raw data from connected accounts (stored for re-generation and analytics)
  youtube_data JSONB,
  twitter_data JSONB,
  reddit_data JSONB,
  linkedin_data JSONB,

  -- Generated persona from MCP server
  persona JSONB NOT NULL,

  -- Generation metadata
  focus_areas TEXT[],
  custom_instructions TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one persona per user (can be updated)
  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_personas_user_id ON user_personas(user_id);

-- Enable Row Level Security
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own persona
CREATE POLICY "Users can read own persona"
  ON user_personas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own persona
CREATE POLICY "Users can insert own persona"
  ON user_personas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own persona
CREATE POLICY "Users can update own persona"
  ON user_personas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own persona
CREATE POLICY "Users can delete own persona"
  ON user_personas
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_personas_updated_at
  BEFORE UPDATE ON user_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create table for storing YouTube access tokens (separate for security)
CREATE TABLE IF NOT EXISTS user_youtube_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_youtube_tokens_user_id ON user_youtube_tokens(user_id);

-- Enable RLS for tokens table
ALTER TABLE user_youtube_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own tokens
CREATE POLICY "Users can read own youtube tokens"
  ON user_youtube_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own youtube tokens"
  ON user_youtube_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own youtube tokens"
  ON user_youtube_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own youtube tokens"
  ON user_youtube_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at for tokens
CREATE TRIGGER update_user_youtube_tokens_updated_at
  BEFORE UPDATE ON user_youtube_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
