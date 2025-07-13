-- Add archived column to conversations table
ALTER TABLE conversations
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for archived column for faster queries
CREATE INDEX IF NOT EXISTS conversations_archived_idx ON conversations(archived);
