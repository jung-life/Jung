-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    mood TEXT CHECK (mood IN (
        'excited', 'happy', 'content', 'calm', 'neutral',
        'anxious', 'sad', 'frustrated', 'angry', 'tired',
        'energetic', 'grateful', 'hopeful', 'lonely', 'stressed'
    )),
    tags TEXT[] DEFAULT '{}',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'clear')),
    location TEXT,
    attachments JSONB DEFAULT '[]',
    word_count INTEGER NOT NULL DEFAULT 0,
    reading_time INTEGER NOT NULL DEFAULT 0,
    is_private BOOLEAN NOT NULL DEFAULT false,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_mood ON public.journal_entries(mood);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_favorite ON public.journal_entries(is_favorite);
CREATE INDEX IF NOT EXISTS idx_journal_entries_is_private ON public.journal_entries(is_private);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON public.journal_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON public.journal_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.journal_entries TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;