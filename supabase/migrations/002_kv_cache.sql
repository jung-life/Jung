-- Migration: Create KV Cache table for conversation context and intermediate results
-- Date: 2024-12-09
-- Description: High-performance key-value cache for conversation context preservation and computation results

-- Table for key-value cache storage
-- Stores encrypted intermediate results, conversation context, and computed values
CREATE TABLE kv_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key (unique identifier for cached item)
  key TEXT NOT NULL,

  -- Cached value (encrypted JSON data)
  value TEXT NOT NULL,

  -- Optional user association for user-specific caches
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cache metadata
  expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 1,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Automatic timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint to prevent duplicate keys per user (allows global + user-specific caches)
  UNIQUE(key, user_id)
);

-- Performance indexes
CREATE INDEX idx_kv_cache_key ON kv_cache(key);
CREATE INDEX idx_kv_cache_expiry ON kv_cache(expiry);
CREATE INDEX idx_kv_cache_user_id ON kv_cache(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_kv_cache_last_accessed ON kv_cache(last_accessed DESC);

-- Composite indexes for common queries
CREATE INDEX idx_kv_cache_key_user_expiry
  ON kv_cache(key, user_id, expiry)
  WHERE expiry > NOW();

CREATE INDEX idx_kv_cache_user_expiry
  ON kv_cache(user_id, expiry)
  WHERE user_id IS NOT NULL AND expiry > NOW();

-- Partial index for expired entries (for cleanup)
CREATE INDEX idx_kv_cache_expired
  ON kv_cache(expiry)
  WHERE expiry <= NOW();

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_kv_cache_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_kv_cache_updated_at
  BEFORE UPDATE ON kv_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_kv_cache_updated_at();

-- Function for efficient cache cleanup
CREATE OR REPLACE FUNCTION cleanup_kv_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired entries
  DELETE FROM kv_cache
  WHERE expiry <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log cleanup activity
  IF deleted_count > 0 THEN
    RAISE NOTICE 'KV Cache: Cleaned up % expired entries', deleted_count;
  END IF;

  RETURN deleted_count;
END;
$$;

-- Function for cache statistics
CREATE OR REPLACE FUNCTION kv_cache_stats(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_entries BIGINT,
  user_entries BIGINT,
  expired_entries BIGINT,
  total_access_count BIGINT,
  avg_access_count DECIMAL,
  cache_size_mb DECIMAL
)
LANGUAGE sql
STABLE
AS $$
  WITH cache_metrics AS (
    SELECT
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE user_id = p_user_id) as user_count,
      COUNT(*) FILTER (WHERE expiry <= NOW()) as expired_count,
      SUM(access_count) as total_accesses,
      SUM(LENGTH(value)) as total_size_bytes
    FROM kv_cache
    WHERE p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL
  )
  SELECT
    total_count,
    user_count,
    expired_count,
    total_accesses,
    CASE WHEN total_count > 0 THEN
      ROUND(total_accesses::DECIMAL / total_count, 2)
    ELSE 0 END,
    ROUND(total_size_bytes::DECIMAL / (1024 * 1024), 2) -- Convert to MB
  FROM cache_metrics;
$$;

-- Function to get most accessed cache entries
CREATE OR REPLACE FUNCTION kv_cache_top_accessed(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  cache_key TEXT,
  access_count INTEGER,
  last_accessed TIMESTAMP WITH TIME ZONE,
  size_bytes INTEGER,
  age_hours DECIMAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    kc.key,
    kc.access_count,
    kc.last_accessed,
    LENGTH(kc.value),
    ROUND(EXTRACT(EPOCH FROM (NOW() - kc.created_at)) / 3600, 2)
  FROM kv_cache kc
  WHERE
    (p_user_id IS NULL OR kc.user_id = p_user_id OR kc.user_id IS NULL)
    AND kc.expiry > NOW()
  ORDER BY kc.access_count DESC, kc.last_accessed DESC
  LIMIT p_limit;
$$;

-- Function for intelligent cache eviction (LRU with access frequency)
CREATE OR REPLACE FUNCTION evict_kv_cache_lru(
  p_user_id UUID DEFAULT NULL,
  p_max_entries INTEGER DEFAULT 1000
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  evicted_count INTEGER := 0;
  entries_to_evict INTEGER;
BEGIN
  -- Count current entries
  SELECT COUNT(*) INTO current_count
  FROM kv_cache
  WHERE
    (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
    AND expiry > NOW();

  -- Calculate how many to evict
  entries_to_evict := current_count - p_max_entries;

  IF entries_to_evict > 0 THEN
    -- Delete least recently used entries with low access count
    DELETE FROM kv_cache
    WHERE id IN (
      SELECT id
      FROM kv_cache
      WHERE
        (p_user_id IS NULL OR user_id = p_user_id OR user_id IS NULL)
        AND expiry > NOW()
      ORDER BY
        access_count ASC,
        last_accessed ASC
      LIMIT entries_to_evict
    );

    GET DIAGNOSTICS evicted_count = ROW_COUNT;

    RAISE NOTICE 'KV Cache: Evicted % LRU entries for user %', evicted_count, COALESCE(p_user_id::TEXT, 'global');
  END IF;

  RETURN evicted_count;
END;
$$;

-- Row Level Security for privacy
ALTER TABLE kv_cache ENABLE ROW LEVEL SECURITY;

-- Users can only access their own cache entries and global entries
CREATE POLICY "Users can access own and global cache entries" ON kv_cache
  FOR ALL
  USING (
    user_id IS NULL OR
    auth.uid() = user_id
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON kv_cache TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_kv_cache TO authenticated;
GRANT EXECUTE ON FUNCTION kv_cache_stats TO authenticated;
GRANT EXECUTE ON FUNCTION kv_cache_top_accessed TO authenticated;
GRANT EXECUTE ON FUNCTION evict_kv_cache_lru TO authenticated;
GRANT EXECUTE ON FUNCTION update_kv_cache_updated_at TO authenticated;

-- Schedule automatic cleanup (requires pg_cron extension - optional)
-- This will run every hour to clean up expired entries
-- SELECT cron.schedule('kv-cache-cleanup', '0 * * * *', 'SELECT cleanup_kv_cache();');

-- Add helpful comments
COMMENT ON TABLE kv_cache IS 'High-performance key-value cache for conversation context, embeddings, and computation results';
COMMENT ON COLUMN kv_cache.key IS 'Unique identifier for cached item (e.g., "conv_context:user123:session456")';
COMMENT ON COLUMN kv_cache.value IS 'Encrypted JSON data containing cached computation or context';
COMMENT ON COLUMN kv_cache.user_id IS 'Optional user association. NULL for global cache entries';
COMMENT ON COLUMN kv_cache.expiry IS 'Cache entry expiration time. Entries are automatically cleaned up after this time';
COMMENT ON COLUMN kv_cache.access_count IS 'Number of times this cache entry has been accessed';

COMMENT ON FUNCTION cleanup_kv_cache IS 'Removes expired cache entries and returns count of deleted entries';
COMMENT ON FUNCTION kv_cache_stats IS 'Returns comprehensive statistics about cache usage and performance';
COMMENT ON FUNCTION kv_cache_top_accessed IS 'Returns most frequently accessed cache entries for performance analysis';
COMMENT ON FUNCTION evict_kv_cache_lru IS 'Implements LRU eviction policy to maintain cache size limits';