-- Allow authenticated users to insert their own YouTube data
-- This fixes the RLS issue where users couldn't insert during onboarding

-- Policy: Authenticated users can insert their own YouTube data
CREATE POLICY "Users can insert own youtube data"
  ON public.user_youtube_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
