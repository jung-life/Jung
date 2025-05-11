-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_premium BOOLEAN DEFAULT false,
    full_name TEXT,
    theme_preference TEXT DEFAULT 'system',
    notification_preferences JSONB DEFAULT '{"daily_reminders": false, "new_features": true, "insights": true}'::jsonb
);

-- 2. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    encrypted_title TEXT,
    encrypted_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    content TEXT,
    encrypted_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    encrypted_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create emotional_states table
CREATE TABLE IF NOT EXISTS public.emotional_states (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_data TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create indexes for emotional_states
CREATE INDEX IF NOT EXISTS idx_emotional_states_user_id ON public.emotional_states(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_states_timestamp ON public.emotional_states(timestamp);

-- 7. Create view to clean up old unencrypted data
CREATE OR REPLACE VIEW cleanup_unencrypted_data AS
SELECT 
    'conversations' AS table_name,
    COUNT(*) AS records_to_clean
FROM public.conversations 
WHERE encrypted_data IS NOT NULL AND (content IS NOT NULL OR title IS NOT NULL)
UNION ALL
SELECT 
    'messages' AS table_name,
    COUNT(*) AS records_to_clean
FROM public.messages 
WHERE encrypted_content IS NOT NULL AND content IS NOT NULL
UNION ALL
SELECT 
    'analyses' AS table_name,
    COUNT(*) AS records_to_clean
FROM public.analyses 
WHERE encrypted_content IS NOT NULL AND content IS NOT NULL;

-- 8. Add RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 9. Add RLS policies for emotional_states
ALTER TABLE public.emotional_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emotional states"
ON public.emotional_states
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotional states"
ON public.emotional_states
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotional states"
ON public.emotional_states
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotional states"
ON public.emotional_states
FOR DELETE
USING (auth.uid() = user_id);