-- Add conversation JSONB column to phase1 table for AI conversation persistence
ALTER TABLE phase1 ADD COLUMN IF NOT EXISTS conversation JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN phase1.conversation IS 'Array of ConversationMessage objects from the AI pre-trip conversation';
