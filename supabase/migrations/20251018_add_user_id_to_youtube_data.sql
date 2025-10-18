-- Add user_id to user_youtube_data for proper foreign key relationship
-- This allows linking YouTube data collected during onboarding to authenticated users

-- Add user_id column (nullable to support existing data)
ALTER TABLE public.user_youtube_data
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_youtube_data_user_id ON public.user_youtube_data(user_id);

-- Update constraint: either email OR user_id must be present
-- (Keep email for backward compatibility during onboarding)
ALTER TABLE public.user_youtube_data
ADD CONSTRAINT email_or_user_id_required
CHECK (email IS NOT NULL OR user_id IS NOT NULL);

-- Function to link YouTube data to user after signup
CREATE OR REPLACE FUNCTION link_youtube_data_to_user()
RETURNS TRIGGER AS $$
BEGIN
  -- After user signs up, link their YouTube data (if exists)
  UPDATE public.user_youtube_data
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically link YouTube data when user signs up
DROP TRIGGER IF EXISTS on_user_signup_link_youtube ON auth.users;
CREATE TRIGGER on_user_signup_link_youtube
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_youtube_data_to_user();

-- Add comments
COMMENT ON COLUMN user_youtube_data.user_id IS 'Links YouTube data to authenticated user (populated after signup)';
COMMENT ON FUNCTION link_youtube_data_to_user() IS 'Automatically links YouTube data collected during onboarding to user after signup';
