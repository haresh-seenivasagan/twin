-- Enable RLS on user_youtube_data table
-- This was previously disabled for onboarding, but it's a security risk
-- YouTube data writes will now go through the backend API using service role

-- Enable Row Level Security
ALTER TABLE public.user_youtube_data ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read their own YouTube data (by user_id)
CREATE POLICY "Users can read own youtube data by user_id"
  ON public.user_youtube_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can read their own YouTube data (by email fallback)
-- This helps during the transition period when user just signed up
CREATE POLICY "Users can read own youtube data by email"
  ON public.user_youtube_data
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Authenticated users can update their own YouTube data
CREATE POLICY "Users can update own youtube data"
  ON public.user_youtube_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own YouTube data
CREATE POLICY "Users can delete own youtube data"
  ON public.user_youtube_data
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: No INSERT policy for regular users
-- All inserts during onboarding are done via backend API using service role
-- This prevents anyone with the anon key from inserting fake YouTube data

-- Add comment
COMMENT ON TABLE public.user_youtube_data IS 'YouTube data with RLS enabled - writes via service role only';
