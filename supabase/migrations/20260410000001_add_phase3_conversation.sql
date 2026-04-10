-- Add conversation JSONB column to phase3_entries table for AI post-trip reflection conversation persistence
ALTER TABLE phase3_entries ADD COLUMN IF NOT EXISTS conversation JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add trip summary text column for AI-generated holistic summary
ALTER TABLE phase3_entries ADD COLUMN IF NOT EXISTS trip_summary TEXT;

-- Documentation comments
COMMENT ON COLUMN phase3_entries.conversation IS 'Array of Phase3ConversationMessage objects from the AI post-trip reflection';
COMMENT ON COLUMN phase3_entries.trip_summary IS 'AI-generated holistic trip summary spanning all three phases';
