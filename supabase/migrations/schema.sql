-- Create new tables and modify existing ones for encryption and emotional assessment

-- 1. Add encrypted_data column to conversations table
ALTER TABLE conversations 
ADD COLUMN encrypted_title TEXT,
ADD COLUMN encrypted_data TEXT;

-- 2. Create emotional_states table
CREATE TABLE emotional_states (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX idx_emotional_states_user_id ON emotional_states(user_id);
CREATE INDEX idx_emotional_states_timestamp ON emotional_states(timestamp);

-- 4. Add encrypted column to messages table
ALTER TABLE messages
ADD COLUMN encrypted_content TEXT;

-- 5. Add encrypted column to analyses table
ALTER TABLE analyses
ADD COLUMN encrypted_content TEXT;

-- 6. Create view to clean up old unencrypted data (to be run after migration)
CREATE OR REPLACE VIEW cleanup_unencrypted_data AS
SELECT 
  'conversations' AS table_name,
  COUNT(*) AS records_to_clean
FROM conversations 
WHERE encrypted_data IS NOT NULL AND (content IS NOT NULL OR title IS NOT NULL)
UNION ALL
SELECT 
  'messages' AS table_name,
  COUNT(*) AS records_to_clean
FROM messages 
WHERE encrypted_content IS NOT NULL AND content IS NOT NULL
UNION ALL
SELECT 
  'analyses' AS table_name,
  COUNT(*) AS records_to_clean
FROM analyses 
WHERE encrypted_content IS NOT NULL AND content IS NOT NULL;

-- 7. Add RLS policies for emotional_states
ALTER TABLE emotional_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emotional states"
  ON emotional_states
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotional states"
  ON emotional_states
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotional states"
  ON emotional_states
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional states"
  ON emotional_states
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create migration function to encrypt existing data
CREATE OR REPLACE FUNCTION migrate_to_encrypted() 
RETURNS void AS $$
DECLARE
  encryption_key TEXT := 'temporary_encryption_key_for_migration';
BEGIN
  -- This is a placeholder function that would need to be implemented
  -- with proper encryption in a real migration script
  -- In a real implementation, this would be done client-side or with a secure backend service
  
  RAISE NOTICE 'This is a placeholder. Real encryption should be done client-side.';
END;
$$ LANGUAGE plpgsql;