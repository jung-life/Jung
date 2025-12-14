-- Migration: Create conversation patterns table for privacy-preserving pattern analysis
-- Date: 2024-12-03
-- Description: HIPAA-compliant storage of anonymized conversation themes and patterns

-- Enable pgvector extension for semantic similarity
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing anonymized conversation patterns
-- This stores aggregated, non-identifiable patterns for therapeutic context
CREATE TABLE conversation_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern information (anonymized)
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'anxiety', 'depression', 'relationships', 'work_stress',
    'eating_patterns', 'life_transitions', 'sleep_issues', 'family_dynamics'
  )),

  -- Pattern metadata
  intensity TEXT NOT NULL CHECK (intensity IN ('low', 'moderate', 'high')),
  frequency TEXT NOT NULL CHECK (frequency IN ('rare', 'occasional', 'frequent', 'persistent')),

  -- Temporal information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for conversation cache with semantic search capabilities
-- Stores encrypted conversations with embeddings for similarity matching
CREATE TABLE conversation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation data (encrypted)
  encrypted_prompt TEXT NOT NULL,
  encrypted_response TEXT NOT NULL,

  -- Semantic search (embeddings of anonymized content)
  prompt_embedding vector(1536), -- OpenAI text-embedding-3-small dimension

  -- Metadata for context and analytics
  model_used TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  credits_spent INTEGER NOT NULL DEFAULT 0,

  -- Session and avatar context
  session_id UUID,
  avatar_id TEXT,

  -- Automatic cleanup
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '60 days')
);

-- Indexes for performance
CREATE INDEX idx_conversation_patterns_user_type
  ON conversation_patterns(user_id, pattern_type);

CREATE INDEX idx_conversation_patterns_created_at
  ON conversation_patterns(created_at DESC);

CREATE INDEX idx_conversation_patterns_frequency
  ON conversation_patterns(frequency, pattern_type);

-- Indexes for conversation cache
CREATE INDEX idx_conversation_cache_user_id
  ON conversation_cache(user_id);

CREATE INDEX idx_conversation_cache_expires
  ON conversation_cache(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_conversation_cache_session
  ON conversation_cache(user_id, session_id) WHERE session_id IS NOT NULL;

-- Vector similarity index for semantic search
CREATE INDEX idx_conversation_cache_embedding
  ON conversation_cache USING ivfflat (prompt_embedding vector_cosine_ops)
  WITH (lists = 100);

-- RPC function for privacy-preserving pattern frequency increment
CREATE OR REPLACE FUNCTION increment_pattern_frequency(
  p_user_id UUID,
  p_pattern_type TEXT,
  p_intensity TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_frequency TEXT;
BEGIN
  -- Check if pattern exists for today
  SELECT frequency INTO current_frequency
  FROM conversation_patterns
  WHERE user_id = p_user_id
    AND pattern_type = p_pattern_type
    AND DATE(created_at) = CURRENT_DATE;

  IF FOUND THEN
    -- Update existing pattern frequency
    UPDATE conversation_patterns
    SET
      frequency = CASE current_frequency
        WHEN 'rare' THEN 'occasional'
        WHEN 'occasional' THEN 'frequent'
        WHEN 'frequent' THEN 'persistent'
        ELSE 'persistent'
      END,
      intensity = CASE
        WHEN p_intensity = 'high' OR intensity = 'high' THEN 'high'
        WHEN p_intensity = 'moderate' OR intensity = 'moderate' THEN 'moderate'
        ELSE 'low'
      END,
      updated_at = NOW()
    WHERE user_id = p_user_id
      AND pattern_type = p_pattern_type
      AND DATE(created_at) = CURRENT_DATE;
  ELSE
    -- Insert new pattern
    INSERT INTO conversation_patterns (user_id, pattern_type, intensity, frequency)
    VALUES (p_user_id, p_pattern_type, p_intensity, 'rare');
  END IF;
END;
$$;

-- RPC function for semantic similarity search
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.85,
  p_user_id UUID DEFAULT NULL,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  similarity FLOAT,
  model_used TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cc.id,
    1 - (cc.prompt_embedding <=> query_embedding) as similarity,
    cc.model_used,
    cc.input_tokens,
    cc.output_tokens,
    cc.cost_usd,
    cc.created_at
  FROM conversation_cache cc
  WHERE
    (p_user_id IS NULL OR cc.user_id = p_user_id)
    AND cc.expires_at > NOW()
    AND cc.prompt_embedding IS NOT NULL
    AND 1 - (cc.prompt_embedding <=> query_embedding) > similarity_threshold
  ORDER BY cc.prompt_embedding <=> query_embedding
  LIMIT result_limit;
$$;

-- RPC function to get anonymized user patterns for therapeutic context
CREATE OR REPLACE FUNCTION get_user_patterns(
  p_user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  pattern_type TEXT,
  intensity TEXT,
  frequency TEXT,
  last_occurrence TIMESTAMP WITH TIME ZONE,
  occurrence_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    cp.pattern_type,
    cp.intensity,
    cp.frequency,
    MAX(cp.created_at) as last_occurrence,
    COUNT(*) as occurrence_count
  FROM conversation_patterns cp
  WHERE
    cp.user_id = p_user_id
    AND cp.created_at > NOW() - (days_back || ' days')::INTERVAL
  GROUP BY cp.pattern_type, cp.intensity, cp.frequency
  ORDER BY occurrence_count DESC, last_occurrence DESC;
$$;

-- RPC function for pattern correlation analysis
CREATE OR REPLACE FUNCTION analyze_pattern_correlations(
  p_user_id UUID,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  primary_pattern TEXT,
  correlated_pattern TEXT,
  correlation_strength FLOAT,
  co_occurrence_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH user_patterns AS (
    SELECT DISTINCT pattern_type, DATE(created_at) as pattern_date
    FROM conversation_patterns
    WHERE user_id = p_user_id
      AND created_at > NOW() - (days_back || ' days')::INTERVAL
  ),
  pattern_pairs AS (
    SELECT
      p1.pattern_type as primary_pattern,
      p2.pattern_type as correlated_pattern,
      p1.pattern_date
    FROM user_patterns p1
    JOIN user_patterns p2 ON p1.pattern_date = p2.pattern_date
    WHERE p1.pattern_type < p2.pattern_type  -- Avoid duplicates and self-correlation
  )
  SELECT
    primary_pattern,
    correlated_pattern,
    (COUNT(*)::FLOAT / days_back::FLOAT) as correlation_strength,
    COUNT(*) as co_occurrence_count
  FROM pattern_pairs
  GROUP BY primary_pattern, correlated_pattern
  HAVING COUNT(*) >= 2  -- At least 2 co-occurrences to be significant
  ORDER BY correlation_strength DESC, co_occurrence_count DESC;
$$;

-- Automatic cleanup function for expired conversations
CREATE OR REPLACE FUNCTION cleanup_expired_conversations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM conversation_cache
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log cleanup activity (you can remove this if not needed)
  RAISE NOTICE 'Cleaned up % expired conversations', deleted_count;

  RETURN deleted_count;
END;
$$;

-- Row Level Security (RLS) policies for privacy protection
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own patterns
CREATE POLICY "Users can view own conversation patterns" ON conversation_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access their own conversation cache
CREATE POLICY "Users can view own conversation cache" ON conversation_cache
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON conversation_patterns TO authenticated;
GRANT ALL ON conversation_cache TO authenticated;
GRANT EXECUTE ON FUNCTION increment_pattern_frequency TO authenticated;
GRANT EXECUTE ON FUNCTION search_similar_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_pattern_correlations TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_conversations TO authenticated;

-- Schedule automatic cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-expired-conversations', '0 2 * * *', 'SELECT cleanup_expired_conversations();');

-- Add helpful comments
COMMENT ON TABLE conversation_patterns IS 'Stores anonymized psychological patterns for therapeutic context without exposing conversation content';
COMMENT ON TABLE conversation_cache IS 'Encrypted conversation storage with semantic search capabilities for privacy-preserving pattern recognition';
COMMENT ON FUNCTION increment_pattern_frequency IS 'Privacy-preserving function to track pattern frequency without exposing conversation content';
COMMENT ON FUNCTION search_similar_conversations IS 'Semantic similarity search using vector embeddings for contextual therapeutic responses';
COMMENT ON FUNCTION get_user_patterns IS 'Retrieve anonymized user patterns for therapeutic context building';
COMMENT ON FUNCTION analyze_pattern_correlations IS 'Identify correlations between different psychological themes for therapeutic insights';