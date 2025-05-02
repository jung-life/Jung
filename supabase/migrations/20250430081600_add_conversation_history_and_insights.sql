-- supabase/migrations/20250430081600_add_conversation_history_and_insights.sql

-- Create a new table for storing conversation history
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  UNIQUE(user_id, conversation_id)
);

-- Create a new table for storing conversation insights
CREATE TABLE IF NOT EXISTS public.conversation_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  share_url TEXT,
  UNIQUE(user_id, conversation_id)
);

-- Enable Row Level Security on the new tables
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_history
CREATE POLICY "Users can insert their own conversation history"
  ON public.conversation_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own conversation history"
  ON public.conversation_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation history"
  ON public.conversation_history
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation history"
  ON public.conversation_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for conversation_insights
CREATE POLICY "Users can insert their own conversation insights"
  ON public.conversation_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own conversation insights"
  ON public.conversation_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversation insights"
  ON public.conversation_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation insights"
  ON public.conversation_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON public.conversation_history TO authenticated;
GRANT ALL ON public.conversation_insights TO authenticated;
