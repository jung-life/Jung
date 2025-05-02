-- supabase/migrations/20250428220700_add_messages_rls_policies.sql

-- Enable Row Level Security on the messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to insert their own messages
-- Users should only be able to insert messages linked to conversations they own.
CREATE POLICY "Users can insert their own messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.conversations WHERE id = messages.conversation_id
    )
  );

-- Policy: Allow users to select messages from their own conversations
CREATE POLICY "Users can select messages from their own conversations"
  ON public.messages
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.conversations WHERE id = messages.conversation_id
    )
  );

-- Policy: Allow users to delete messages from their own conversations (optional, but good practice)
CREATE POLICY "Users can delete messages from their own conversations"
  ON public.messages
  FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM public.conversations WHERE id = messages.conversation_id
    )
  );

-- Grant necessary permissions to the authenticated role
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
