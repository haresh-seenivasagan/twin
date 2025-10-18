-- Add generation_context column to store rich context for persona generation
-- This stores the user's answers to focus-area-specific questions

ALTER TABLE user_personas
ADD COLUMN IF NOT EXISTS generation_context JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN user_personas.generation_context IS 'Stores rich context data collected during persona generation, including focus area specific answers';

-- Example structure:
-- {
--   "version": 1,
--   "timestamp": "2025-10-18T12:00:00Z",
--   "focusAreas": ["relationships", "health"],
--   "context": {
--     "relationships": {
--       "status": "single",
--       "goal": "meeting_people",
--       "custom": "Building confidence to approach people I find interesting"
--     },
--     "health": {
--       "level": "beginner",
--       "goal": "general_fitness"
--     }
--   }
-- }
